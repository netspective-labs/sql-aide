import * as g from "../universal/graph.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

/**
 * Interface which accepts a Workflow class or object and limits the keys to
 * just functions (basically every function is a Workflow _step_). If the
 * Workflow class or object has other properties that are not functions those
 * will be kept out of the type-safe shape.
 */
export type FlowShapeStep<Workflow> = {
  [K in keyof Workflow]: Workflow[K] extends (...args: Any[]) => Any ? K
    : never;
}[keyof Workflow];

/**
 * Defines TypeScript functions which can be used to decorate flows and steps.
 */
export class FlowDescriptor<
  Workflow,
  FlowShape extends {
    [K in FlowShapeStep<Workflow>]: FlowStep<Workflow>;
  } = {
    [K in FlowShapeStep<Workflow>]: FlowStep<Workflow>;
  },
  PropertyName extends keyof FlowShape = keyof FlowShape,
> {
  readonly lintResults: { readonly message: string }[] = [];
  readonly initProps: {
    readonly propertyKey: PropertyName;
    readonly priority: number;
    readonly descriptor: PropertyDescriptor;
  }[] = [];
  readonly finalizeProps: {
    readonly propertyKey: PropertyName;
    readonly priority: number;
    readonly descriptor: PropertyDescriptor;
  }[] = [];
  readonly disregardProps = new Map<PropertyName, PropertyDescriptor>();
  readonly dependencies: {
    readonly propertyKey: PropertyName;
    readonly dependsOn: PropertyName;
    readonly descriptor: PropertyDescriptor;
  }[] = [];

  /**
   * Extract the flow steps and object shape of a Workflow
   * @param workflow the prototype of a class
   */
  structure(workflow: Workflow) {
    const flowShape: FlowShape = {} as Any;
    const flowSteps: FlowStep<Workflow>[] = [];
    for (const pn of Object.getOwnPropertyNames(workflow)) {
      if (pn == "constructor") continue;
      if (this.disregardProps.get(pn as PropertyName)) continue;

      const pd = Object.getOwnPropertyDescriptor(workflow, pn);
      const wfStepID = pn as PropertyName;
      if (pd) {
        const stepMetaData = { wfStepID, ...pd } as unknown as FlowStep<
          Workflow
        >;
        flowSteps.push(stepMetaData);
        (flowShape as Any)[wfStepID] = stepMetaData;
      }
    }

    return { flowShape, flowSteps };
  }

  /**
   * Decorate a flow step function with `@dependsOn('step')` to instruct the DAG
   * to make the function a _dependent_ (for topological sorting order) of the
   * function called `step`.
   * @param dependsOn name of a function in the Workflow
   * @returns flow step dectorator
   */
  dependsOn(dependsOn: PropertyName) {
    return (
      _target: Workflow,
      propertyKey: PropertyName,
      descriptor: PropertyDescriptor,
    ) => {
      if (propertyKey == dependsOn) {
        this.lintResults.push({
          message: `[dependsOn] circular dependency detected in ${
            String(propertyKey)
          }: ${String(dependsOn)}`,
        });
      }
      this.dependencies.push({ propertyKey, dependsOn, descriptor });
    };
  }

  /**
   * Decorate a function with `@disregard` if it should not be treated as a flow
   * step. TODO: figure out how to remove _disregarded_ functions from
   * FlowShapeStep<Workflow>
   * @returns flow step dectorator
   */
  disregard() {
    return (
      _target: Workflow,
      propertyKey: PropertyName,
      descriptor: PropertyDescriptor,
    ) => {
      this.disregardProps.set(propertyKey, descriptor);
    };
  }

  /**
   * Decorate a function with `init` if it should be treated as an
   * initialization function. The priority is the sort order, the higher the
   * number the lower in priority it has (priority #1 comes first, etc.). All
   * initialization functions run in priority order before all other flow steps
   * are executed.
   *
   * Initialization of a flow should typically occur in a constructor; however,
   * since constructors cannot run async code, using an async `@init`-decorated
   * function could be useful.
   * @param priority the execution order, the lower the earlier it's run
   * @returns flow step dectorator
   */
  init(priority?: number) {
    return (
      _target: Workflow,
      propertyKey: PropertyName,
      descriptor: PropertyDescriptor,
    ) => {
      this.disregardProps.set(propertyKey, descriptor);
      this.initProps.push({
        propertyKey,
        descriptor,
        priority: priority ?? this.initProps.length,
      });
    };
  }

  /**
   * Descorate a function with `finalize` if it should be treated as a
   * finalization function. The priority is the sort order, the higher the
   * number the lower in priority it has (priority #1 comes first, etc.). All
   * finalization functions run in priority order after all other flow steps
   * are executed.
   * @param priority the execution order, the lower the earlier it's run
   * @returns flow step dectorator
   */
  finalize(priority?: number) {
    return (
      _target: Workflow,
      propertyKey: PropertyName,
      descriptor: PropertyDescriptor,
    ) => {
      this.disregardProps.set(propertyKey, descriptor);
      this.finalizeProps.push({
        propertyKey,
        descriptor,
        priority: priority ?? this.finalizeProps.length,
      });
    };
  }
}

/**
 * The descriptor and name of a single flow step of a given Workflow
 */
export type FlowStep<
  Workflow,
  StepID extends FlowShapeStep<Workflow> = FlowShapeStep<Workflow>,
> =
  & { readonly wfStepID: StepID }
  & PropertyDescriptor;

/**
 * The DAG steps in topological sort order after a Workflow instance been
 * inspected. This interface is independent of the execution engine.
 */
export type FlowDagContext<Workflow> = {
  readonly dagSteps: FlowStep<Workflow>[];
  readonly flow: Workflow;
  readonly last: number;
};

/**
 * The state or _context_ of a single Workflow DAG step, independent of the
 * Engine that is executing the DAG.
 */
export type FlowDagStepContext<Workflow> =
  & FlowDagContext<Workflow>
  & {
    readonly current: FlowStep<Workflow>;
    readonly previous?: FlowDagStepContext<Workflow>;
    readonly next?: FlowStep<Workflow>;
    readonly index: number;
  };

/**
 * Prepare the DAG operations for a graph.
 * @param graph Nodes and edges
 * @returns DAG operations and steps for the given graph
 */
export function flowDAG<
  Workflow,
  StepID extends FlowShapeStep<Workflow> = FlowShapeStep<
    Workflow
  >,
>(graph: g.Graph<FlowStep<Workflow, StepID>>) {
  const ops = g.dagDepthFirst<FlowStep<Workflow, StepID>, StepID>(
    (node) => node.wfStepID,
    (a, b) => {
      if (typeof a.wfStepID === "symbol" || typeof b.wfStepID === "symbol") {
        throw new Error(
          "Cannot meaningfully compare symbol keys in workflowClassDAG",
        );
      }

      if (typeof a.wfStepID === "number" && typeof b.wfStepID === "number") {
        return a.wfStepID - b.wfStepID;
      }

      const aString = String(a.wfStepID);
      const bString = String(b.wfStepID);

      if (aString < bString) {
        return -1;
      }

      if (aString > bString) {
        return 1;
      }

      return 0;
    },
  );

  return {
    graph,
    ops,
    dagSteps: ops.topologicalSort(graph),
    isCyclical: () => ops.isCyclical(graph),
    cycles: () => ops.cycles(graph),
  };
}

export type EngineEvents<
  Workflow,
  WorkflowContext extends FlowDagContext<Workflow>,
  StepContext extends FlowDagStepContext<Workflow>,
> = {
  readonly beforeWorkflow: (
    ctx: WorkflowContext,
  ) => void | false | Promise<void | false>;
  readonly beforeStep: <
    StepID extends string & FlowShapeStep<Workflow>,
  >(
    stepID: `${StepID}`,
    ctx:
      & StepContext
      & EngineRunStateSupplier<Workflow, Any, WorkflowContext, StepContext>,
  ) => void | "interrupt" | Promise<void | "interrupt">;
  readonly afterInterrupt: <
    StepID extends string & FlowShapeStep<Workflow>,
  >(
    stepID: `${StepID}`,
    ctx:
      & StepContext
      & EngineRunStateSupplier<Workflow, Any, WorkflowContext, StepContext>,
  ) => void | Promise<void>;
  readonly afterError: <
    StepID extends string & FlowShapeStep<Workflow>,
  >(
    stepID: `${StepID}`,
    error: Error,
    ctx:
      & StepContext
      & EngineRunStateSupplier<Workflow, Any, WorkflowContext, StepContext>,
  ) => void | "continue" | "abort" | Promise<void | "continue" | "abort">;
  readonly afterStep: <
    StepID extends string & FlowShapeStep<Workflow>,
    Result,
  >(
    stepID: `${StepID}`,
    result: EngineRunStepState<Workflow, Result, WorkflowContext, StepContext>,
    ctx:
      & StepContext
      & EngineRunStateSupplier<Workflow, Result, WorkflowContext, StepContext>,
  ) => void | Promise<void>;
  readonly afterWorkflow: (
    ctx:
      & WorkflowContext
      & EngineRunStateSupplier<Workflow, Any, WorkflowContext, StepContext>,
  ) => void | Promise<void>;
};

export interface EngineOptions<
  Workflow,
  WorkflowContext extends FlowDagContext<Workflow> = FlowDagContext<
    Workflow
  >,
  StepContext extends FlowDagStepContext<Workflow> = FlowDagStepContext<
    Workflow
  >,
> {
  readonly prepareFlowCtx?: (
    suggested: FlowDagContext<Workflow>,
  ) => WorkflowContext;
  readonly prepareStepCtx?: (
    suggested: FlowDagStepContext<Workflow>,
  ) => StepContext;
  readonly eventEmitter?: EngineEvents<
    Workflow,
    WorkflowContext,
    StepContext
  >;
}

export type EngineRunStepState<
  Workflow,
  ExecResult,
  WorkflowContext extends FlowDagContext<Workflow>,
  StepContext extends FlowDagStepContext<Workflow>,
> =
  & {
    readonly index: number;
    readonly stepCtx: StepContext;
  }
  & ({ readonly status: "initial" } | {
    readonly status: "successful";
    readonly execResult: ExecResult;
  } | {
    readonly status: "interrupted";
  } | {
    readonly status: "aborted" | "indeterminate";
    readonly execError: Error;
  });

export interface EngineRunState<
  Workflow,
  ExecResult,
  WorkflowContext extends FlowDagContext<Workflow>,
  StepContext extends FlowDagStepContext<Workflow>,
> {
  readonly descriptor: FlowDescriptor<Workflow>;
  readonly prepareFlowCtx: (
    suggested: FlowDagContext<Workflow>,
  ) => WorkflowContext;
  readonly prepareStepCtx: (
    suggested: FlowDagStepContext<Workflow>,
  ) => StepContext;
  readonly callArgs:
    ((stepCtx: StepContext, prevExecResult: ExecResult) => Array<Any>)[];
  readonly eventEmitter: EngineEvents<Workflow, WorkflowContext, StepContext>;
  readonly stepsExecuted: EngineRunStepState<
    Workflow,
    ExecResult,
    WorkflowContext,
    StepContext
  >[];
  readonly stepResult: (
    stepState: EngineRunStepState<
      Workflow,
      ExecResult,
      WorkflowContext,
      StepContext
    >,
  ) => Error | ExecResult;
  interruptedAtStep: StepContext | undefined;
  erroredOutAtStep: StepContext | undefined;
}

export interface EngineRunStateSupplier<
  Workflow,
  PreviousResult,
  WorkflowContext extends FlowDagContext<Workflow>,
  StepContext extends FlowDagStepContext<Workflow>,
> {
  readonly engineRunState: () => EngineRunState<
    Workflow,
    PreviousResult,
    WorkflowContext,
    StepContext
  >;
}

export class Engine<
  Workflow,
  WorkflowContext extends FlowDagContext<Workflow> = FlowDagContext<
    Workflow
  >,
  StepContext extends FlowDagStepContext<Workflow> = FlowDagStepContext<
    Workflow
  >,
> {
  readonly flowSteps: ReturnType<
    FlowDescriptor<Workflow>["structure"]
  >["flowSteps"];
  readonly flowShape: ReturnType<
    FlowDescriptor<Workflow>["structure"]
  >["flowShape"];
  readonly DAG: ReturnType<typeof flowDAG<Workflow, FlowShapeStep<Workflow>>>;
  readonly lintResults: { readonly message: string }[];

  constructor(
    readonly workflow: Workflow,
    readonly descriptor: FlowDescriptor<Workflow> = new FlowDescriptor<
      Workflow
    >(),
    readonly options?: EngineOptions<
      Workflow,
      WorkflowContext,
      StepContext
    >,
  ) {
    this.lintResults = [...descriptor.lintResults];

    const nodes: FlowStep<Workflow, FlowShapeStep<Workflow>>[] = [];
    const edges: g.Edge<
      FlowStep<Workflow, FlowShapeStep<Workflow>>,
      FlowStep<Workflow, FlowShapeStep<Workflow>>
    >[] = [];

    const graph = { nodes, edges };
    const { flowSteps, flowShape } = descriptor.structure(workflow);
    this.flowSteps = flowSteps;
    this.flowShape = flowShape;

    for (const node of flowSteps) {
      nodes.push(node);
    }

    for (const dep of descriptor.dependencies) {
      const node = flowShape[dep.propertyKey];
      const dependsOn = flowShape[dep.dependsOn];
      if (dependsOn) {
        edges.push({ from: dependsOn, to: node });
      } else {
        this.lintResults.push({
          message: `invalid dependency: ${String(dep.dependsOn)} in ${
            String(node.wfStepID)
          }`,
        });
      }
    }

    for (let i = 0; i < flowSteps.length; i++) {
      const current = flowSteps[i];
      if (edges.find((e) => e.from.wfStepID == current.wfStepID)) continue;

      let n = i + 1;
      while (n < flowSteps.length) {
        const next = flowSteps[n];
        if (!edges.find((e) => e.from.wfStepID == next.wfStepID)) {
          edges.push({ from: current, to: next });
          break;
        }
        n++;
      }
    }

    this.DAG = flowDAG<Workflow, FlowShapeStep<Workflow>>(graph);
    if (this.DAG.isCyclical()) {
      this.lintResults.push({ message: `Cycles detected in graph` });
    }
  }

  get isValid() {
    return this.DAG.isCyclical() ? false : true;
  }

  // deno-lint-ignore require-await
  async prepareRunState() {
    const prepareFlowCtx = this.options?.prepareFlowCtx ??
      ((suggested) => suggested as WorkflowContext);
    const prepareStepCtx = this.options?.prepareStepCtx ??
      ((suggested) => suggested as StepContext);
    const eventEmitter = this.options?.eventEmitter ?? ({
      beforeWorkflow: () => {},
      beforeStep: () => {},
      afterInterrupt: () => {},
      afterError: () => {},
      afterStep: () => {},
      afterWorkflow: () => {},
    });

    // each step might have different call args from decoration decls
    const callArgs = this.flowSteps.map((_step) => ((
      stepCtx: StepContext,
      prevExecResult: Any,
    ) => [stepCtx, prevExecResult]));

    const runState: EngineRunState<
      Workflow,
      Any,
      WorkflowContext,
      StepContext
    > = {
      callArgs,
      descriptor: this.descriptor,
      prepareFlowCtx,
      prepareStepCtx,
      eventEmitter,
      stepsExecuted: [],
      stepResult: (step) => {
        const psss = step.status;
        return psss === "aborted" || psss === "indeterminate"
          ? step.execError
          : (psss === "successful" ? step.execResult : undefined);
      },
      interruptedAtStep: undefined,
      erroredOutAtStep: undefined,
    };

    const runStateSupplier: EngineRunStateSupplier<
      Workflow,
      Any,
      WorkflowContext,
      StepContext
    > = {
      engineRunState: () => runState,
    };

    return {
      runState,
      runStateSupplier,
    };
  }

  async run(instance: Workflow) {
    if (!this.isValid) {
      throw new Error(`Cycles detected in graph, invalid DAG`);
    }
    if (!Engine.isClass<Workflow>(instance)) {
      throw new Error(`Workflow must be a class instance`);
    }

    const { runState, runStateSupplier } = await this.prepareRunState();
    const { dagSteps } = this.DAG;
    const {
      callArgs,
      prepareFlowCtx,
      prepareStepCtx,
      eventEmitter: ee,
      stepsExecuted,
    } = runState;

    const staticCtx: FlowDagContext<Workflow> = {
      dagSteps,
      flow: instance,
      last: dagSteps.length - 1,
    };
    const flowCtx = prepareFlowCtx(staticCtx);

    const handle = await ee.beforeWorkflow(flowCtx);
    if (typeof handle === "boolean" && handle === false) return;

    for (
      const init of this.descriptor.initProps.sort((a, b) =>
        a.priority - b.priority
      )
    ) {
      const handle = await ((instance as Any)[init.propertyKey] as Any)
        .call(instance, flowCtx);
      if (typeof handle === "boolean" && handle === false) return;
    }

    for (let step = 0; step < dagSteps.length; step++) {
      const prevStepState = step > 0
        ? runState.stepsExecuted[step - 1]
        : undefined;
      const [previous, current, next] = [
        step > 0 ? prevStepState?.stepCtx : undefined,
        dagSteps[step],
        step < staticCtx.last ? dagSteps[step + 1] : undefined,
      ];

      const stepCtx = {
        ...prepareStepCtx({
          ...staticCtx,
          index: step,
          previous,
          current,
          next,
        }),
        ...runStateSupplier,
      };
      const rsExecStatic = { index: step, stepCtx };
      stepsExecuted[step] = { status: "initial", ...rsExecStatic };

      const runStep = await ee.beforeStep<FlowShapeStep<Workflow> & string>(
        String(current.wfStepID) as Any,
        stepCtx,
      );
      if (runStep === "interrupt") {
        stepsExecuted[step] = { status: "interrupted", ...rsExecStatic };
        runState.interruptedAtStep = stepCtx;
        break;
      }

      const prevStepResult = prevStepState
        ? runState.stepResult(prevStepState)
        : undefined;
      try {
        // each method has the following signature:
        // step(ctx: StepContext, ...injecteArgs, prevExecResult: Error | PreviousStepResult)
        const execResult = await ((instance as Any)[current.wfStepID] as Any)
          .call(instance, ...callArgs[step](stepCtx, prevStepResult));
        stepsExecuted[step] = {
          ...rsExecStatic,
          status: "successful",
          execResult,
        };
      } catch (execError) {
        runState.erroredOutAtStep = stepCtx;
        const abortOnError = await ee.afterError<
          FlowShapeStep<Workflow> & string
        >(
          String(current.wfStepID) as Any,
          execError,
          stepCtx,
        );
        if (abortOnError === "abort") {
          stepsExecuted[step] = {
            ...rsExecStatic,
            status: "aborted",
            execError,
          };
          runState.erroredOutAtStep = stepCtx;
          break;
        } else {
          stepsExecuted[step] = {
            ...rsExecStatic,
            status: "indeterminate",
            execError,
          };
        }
      }

      await ee.afterStep<FlowShapeStep<Workflow> & string, Any>(
        String(current.wfStepID) as Any,
        stepsExecuted[step],
        stepCtx,
      );
    }

    const finalCtx = { ...flowCtx, ...runStateSupplier };
    for (
      const final of this.descriptor.finalizeProps.sort((a, b) =>
        a.priority - b.priority
      )
    ) {
      await ((instance as Any)[final.propertyKey] as Any).call(
        instance,
        finalCtx,
      );
    }
    await ee.afterWorkflow(finalCtx);
  }

  static isClass<T>(instance: Any): instance is T {
    const isCtorClass = instance.constructor &&
      instance.constructor.toString().substring(0, 5) === "class";
    if (instance.prototype === undefined) {
      return isCtorClass;
    }
    const isPrototypeCtorClass = instance.prototype.constructor &&
      instance.prototype.constructor.toString &&
      instance.prototype.constructor.toString().substring(0, 5) === "class";
    return isCtorClass || isPrototypeCtorClass;
  }
}
