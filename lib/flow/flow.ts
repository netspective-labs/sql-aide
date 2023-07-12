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
  readonly disregardProps = new Map<PropertyName, PropertyDescriptor>();
  readonly dependencies: {
    propertyKey: PropertyName;
    dependsOn: PropertyName;
    descriptor: PropertyDescriptor;
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
}

export type FlowStep<
  Workflow,
  StepID extends FlowShapeStep<Workflow> = FlowShapeStep<Workflow>,
> =
  & { readonly wfStepID: StepID }
  & PropertyDescriptor;

export type FlowDagContext<Workflow> = {
  readonly dagSteps: FlowStep<Workflow>[];
  readonly flow: Workflow;
  readonly last: number;
};

export type FlowDagStepContext<Workflow> =
  & FlowDagContext<Workflow>
  & {
    readonly current: FlowStep<Workflow>;
    readonly previous?: FlowDagStepContext<Workflow>;
    readonly next?: FlowStep<Workflow>;
    readonly index: number;
  };

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
    result: Error | Result,
    ctx:
      & StepContext
      & EngineRunStateSupplier<Workflow, Any, WorkflowContext, StepContext>,
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

export interface EngineRunState<
  Workflow,
  PreviousResult,
  WorkflowContext extends FlowDagContext<Workflow>,
  StepContext extends FlowDagStepContext<Workflow>,
> {
  readonly prepareFlowCtx: (
    suggested: FlowDagContext<Workflow>,
  ) => WorkflowContext;
  readonly prepareStepCtx: (
    suggested: FlowDagStepContext<Workflow>,
  ) => StepContext;
  readonly eventEmitter: EngineEvents<Workflow, WorkflowContext, StepContext>;
  previousStepCtx: StepContext | undefined;
  previousStepCallResult: PreviousResult | undefined;
  previousStepCallError: Error | undefined;
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

  async run(instance: Workflow) {
    if (!this.isValid) {
      throw new Error(`Cycles detected in graph, invalid DAG`);
    }
    if (!Engine.isClass<Workflow>(instance)) {
      throw new Error(`Workflow must be a class instance`);
    }

    const pfc = this.options?.prepareFlowCtx ??
      ((suggested) => suggested as WorkflowContext);
    const psc = this.options?.prepareStepCtx ??
      ((suggested) => suggested as StepContext);
    const ee = this.options?.eventEmitter ?? ({
      beforeWorkflow: () => {},
      beforeStep: () => {},
      afterInterrupt: () => {},
      afterError: () => {},
      afterStep: () => {},
      afterWorkflow: () => {},
    });
    const { dagSteps } = this.DAG;

    const runState: EngineRunState<
      Workflow,
      Any,
      WorkflowContext,
      StepContext
    > = {
      prepareFlowCtx: pfc,
      prepareStepCtx: psc,
      eventEmitter: ee,
      previousStepCtx: undefined,
      previousStepCallResult: undefined,
      interruptedAtStep: undefined,
      previousStepCallError: undefined,
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

    const staticCtx: FlowDagContext<Workflow> = {
      dagSteps,
      flow: instance,
      last: dagSteps.length - 1,
    };
    const handle = await ee.beforeWorkflow(pfc(staticCtx));
    if (typeof handle === "boolean" && handle === false) return;

    for (let i = 0; i < dagSteps.length; i++) {
      const [previous, current, next] = [
        i > 0 ? runState.previousStepCtx : undefined,
        dagSteps[i],
        i < staticCtx.last ? dagSteps[i + 1] : undefined,
      ];

      const eventCtx = {
        ...psc({ ...staticCtx, index: i, previous, current, next }),
        ...runStateSupplier,
      };
      runState.previousStepCtx = eventCtx;

      const runStep = await ee.beforeStep<FlowShapeStep<Workflow> & string>(
        String(current.wfStepID) as Any,
        eventCtx,
      );
      if (runStep === "interrupt") {
        runState.interruptedAtStep = eventCtx;
        break;
      }

      try {
        // each method has the following signature:
        // step(ctx: StepContext, pipe: Error | )
        runState.previousStepCallResult =
          await ((instance as Any)[current.wfStepID] as Any)
            .call(
              instance,
              eventCtx,
              runState.previousStepCallError ?? runState.previousStepCallResult,
            );

        // if the previous step errored out but this one succeeded, we already
        // reported it so reset the state
        runState.previousStepCallError = undefined;
      } catch (err) {
        runState.erroredOutAtStep = eventCtx;
        const abortOnError = await ee.afterError<
          FlowShapeStep<Workflow> & string
        >(
          String(current.wfStepID) as Any,
          err,
          eventCtx,
        );
        if (abortOnError === "abort") {
          break;
        }
        runState.previousStepCallError = err;
      }

      await ee.afterStep<FlowShapeStep<Workflow> & string, Any>(
        String(current.wfStepID) as Any,
        runState.previousStepCallError ?? runState.previousStepCallResult,
        eventCtx,
      );
    }

    await ee.afterWorkflow({ ...pfc(staticCtx), ...runStateSupplier });
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
