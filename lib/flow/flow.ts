import * as g from "../universal/graph.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export type WorkflowShapeStep<Workflow> = {
  [K in keyof Workflow]: Workflow[K] extends (...args: Any[]) => Any ? K
    : never;
}[keyof Workflow];

export function decorators<
  Workflow,
  PropertyName extends WorkflowShapeStep<Workflow> = WorkflowShapeStep<
    Workflow
  >,
>() {
  const lintResults: { readonly message: string }[] = [];
  const disregardProps = new Map<PropertyName, PropertyDescriptor>();
  const dependencies: {
    propertyKey: PropertyName;
    dependsOn: PropertyName;
    descriptor: PropertyDescriptor;
  }[] = [];

  const disregard = () => {
    return function (
      _target: Workflow,
      propertyKey: PropertyName,
      descriptor: PropertyDescriptor,
    ) {
      disregardProps.set(propertyKey, descriptor);
    };
  };

  const dependsOn = (dependsOn: PropertyName) => {
    return function (
      _target: Workflow,
      propertyKey: PropertyName,
      descriptor: PropertyDescriptor,
    ) {
      if (propertyKey == dependsOn) {
        lintResults.push({
          message: `[dependsOn] circular dependency detected in ${
            String(propertyKey)
          }: ${String(dependsOn)}`,
        });
      }
      dependencies.push({ propertyKey, dependsOn, descriptor });
    };
  };

  return {
    dependsOn,
    disregard,
    metaData: {
      lintResults,
      dependencies,
      disregardProps,
    },
  };
}

export type WorkflowStep<
  Workflow,
  StepID extends WorkflowShapeStep<Workflow> = WorkflowShapeStep<Workflow>,
> =
  & { readonly wfStepID: StepID }
  & PropertyDescriptor;

export function workflowDAG<
  Workflow,
  StepID extends WorkflowShapeStep<Workflow> = WorkflowShapeStep<
    Workflow
  >,
>(graph: g.Graph<WorkflowStep<Workflow, StepID>>) {
  const ops = g.dagDepthFirst<WorkflowStep<Workflow, StepID>, StepID>(
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

export type EngineWorkflowContext<Workflow> = {
  readonly dagSteps: WorkflowStep<Workflow>[];
  readonly flow: Workflow;
  readonly last: number;
};

export type EngineWorkflowStepContext<Workflow> =
  & EngineWorkflowContext<Workflow>
  & {
    readonly current: WorkflowStep<Workflow>;
    readonly previous?: EngineWorkflowStepContext<Workflow>;
    readonly next?: WorkflowStep<Workflow>;
    readonly index: number;
  };

export type EngineEvents<
  Workflow,
  WorkflowContext extends EngineWorkflowContext<Workflow>,
  StepContext extends EngineWorkflowStepContext<Workflow>,
> = {
  readonly beforeWorkflow: (
    ctx: WorkflowContext,
  ) => void | false | Promise<void | false>;
  readonly beforeStep: <
    StepID extends string & WorkflowShapeStep<Workflow>,
  >(
    stepID: `${StepID}`,
    ctx: StepContext,
  ) => void | "interrupt" | Promise<void | "interrupt">;
  readonly afterInterrupt: <
    StepID extends string & WorkflowShapeStep<Workflow>,
  >(
    stepID: `${StepID}`,
    ctx: StepContext,
  ) => void | Promise<void>;
  readonly afterError: <
    StepID extends string & WorkflowShapeStep<Workflow>,
  >(
    stepID: `${StepID}`,
    error: Error,
    ctx: StepContext,
  ) => void | "continue" | "abort" | Promise<void | "continue" | "abort">;
  readonly afterStep: <
    StepID extends string & WorkflowShapeStep<Workflow>,
    Result,
  >(
    stepID: `${StepID}`,
    result: Error | Result,
    ctx: StepContext,
  ) => void | Promise<void>;
  readonly afterWorkflow: (
    ctx: WorkflowContext & {
      readonly interruptedAt?: StepContext;
      readonly erroredOutAt?: StepContext;
    },
  ) => void | Promise<void>;
};

export interface EngineOptions<
  Workflow,
  WorkflowContext extends EngineWorkflowContext<Workflow> =
    EngineWorkflowContext<Workflow>,
  StepContext extends EngineWorkflowStepContext<Workflow> =
    EngineWorkflowStepContext<Workflow>,
> {
  readonly prepareWorkflowCtx?: (
    suggested: EngineWorkflowContext<Workflow>,
  ) => WorkflowContext;
  readonly prepareStepCtx?: (
    suggested: EngineWorkflowStepContext<Workflow>,
  ) => StepContext;
  readonly eventEmitter?: EngineEvents<
    Workflow,
    WorkflowContext,
    StepContext
  >;
}

export class Engine<
  Workflow,
  WorkflowContext extends EngineWorkflowContext<Workflow> =
    EngineWorkflowContext<Workflow>,
  StepContext extends EngineWorkflowStepContext<Workflow> =
    EngineWorkflowStepContext<Workflow>,
  StepID extends WorkflowShapeStep<Workflow> = WorkflowShapeStep<
    Workflow
  >,
> {
  readonly flowStepsMetaData: WorkflowStep<Workflow, StepID>[];
  readonly flowStepsMetaDataDict: Record<
    StepID,
    WorkflowStep<Workflow, StepID>
  >;
  readonly DAG: ReturnType<typeof workflowDAG<Workflow, StepID>>;
  readonly lintResults: { readonly message: string }[];

  constructor(
    readonly flowSteps: Workflow,
    readonly metaData: ReturnType<
      typeof decorators<Workflow, StepID>
    >["metaData"],
    readonly options?: EngineOptions<Workflow, WorkflowContext, StepContext>,
  ) {
    this.lintResults = [...metaData.lintResults];
    this.flowStepsMetaDataDict = {} as Any;
    this.flowStepsMetaData = [];

    const { disregardProps, dependencies } = metaData;
    for (const pn of Object.getOwnPropertyNames(this.flowSteps)) {
      if (pn == "constructor") continue;
      if (disregardProps.get(pn as StepID)) continue;

      const pd = Object.getOwnPropertyDescriptor(
        this.flowSteps,
        pn,
      );

      const wfStepID = pn as StepID;
      if (pd) {
        const stepMetaData = { wfStepID, ...pd };
        this.flowStepsMetaData.push(stepMetaData);
        this.flowStepsMetaDataDict[wfStepID] = stepMetaData;
      }
    }

    const nodes: WorkflowStep<Workflow, StepID>[] = [];
    const edges: g.Edge<
      WorkflowStep<Workflow, StepID>,
      WorkflowStep<Workflow, StepID>
    >[] = [];
    const graph = { nodes, edges };

    for (const node of this.flowStepsMetaData) {
      nodes.push(node);
    }

    for (const dep of dependencies) {
      const node = this.flowStepsMetaDataDict[dep.propertyKey];
      const dependsOn = this.flowStepsMetaDataDict[dep.dependsOn];
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

    for (let i = 0; i < this.flowStepsMetaData.length; i++) {
      const current = this.flowStepsMetaData[i];
      if (edges.find((e) => e.from.wfStepID == current.wfStepID)) continue;

      let n = i + 1;
      while (n < this.flowStepsMetaData.length) {
        const next = this.flowStepsMetaData[n];
        if (!edges.find((e) => e.from.wfStepID == next.wfStepID)) {
          edges.push({ from: current, to: next });
          break;
        }
        n++;
      }
    }

    this.DAG = workflowDAG<Workflow, StepID>(graph);
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

    const pwc = this.options?.prepareWorkflowCtx ??
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

    const staticCtx: EngineWorkflowContext<Workflow> = {
      dagSteps,
      flow: instance,
      last: dagSteps.length - 1,
    };
    const handle = await ee.beforeWorkflow(pwc(staticCtx));
    if (typeof handle === "boolean" && handle === false) return;

    let prevCtx: StepContext | undefined = undefined;
    let prevCallResult: Any = undefined;

    let interruptedAt: StepContext | undefined = undefined;

    let prevCallError: Error | undefined = undefined;
    let erroredOutAt: StepContext | undefined = undefined;
    for (let i = 0; i < dagSteps.length; i++) {
      const [previous, current, next] = [
        i > 0 ? prevCtx : undefined,
        dagSteps[i],
        i < staticCtx.last ? dagSteps[i + 1] : undefined,
      ];

      const eventCtx = psc({ ...staticCtx, index: i, previous, current, next });
      prevCtx = eventCtx;

      const runStep = await ee.beforeStep<StepID & string>(
        String(current.wfStepID) as Any,
        eventCtx,
      );
      if (runStep === "interrupt") {
        interruptedAt = eventCtx;
        break;
      }

      try {
        // each method has the following signature:
        // step(ctx: StepContext, pipe: Error | )
        prevCallResult = await ((instance as Any)[current.wfStepID] as Any)
          .call(
            instance,
            eventCtx,
            prevCallError ?? prevCallResult,
          );

        // if the previous step errored out but this one succeeded, we already
        // reported it so reset the state
        prevCallError = undefined;
      } catch (err) {
        erroredOutAt = eventCtx;
        const abortOnError = await ee.afterError<StepID & string>(
          String(current.wfStepID) as Any,
          err,
          eventCtx,
        );
        if (abortOnError === "abort") {
          break;
        }
        prevCallError = err;
      }

      await ee.afterStep<StepID & string, Any>(
        String(current.wfStepID) as Any,
        prevCallError ?? prevCallResult,
        eventCtx,
      );
    }

    await ee.afterWorkflow({ ...pwc(staticCtx), interruptedAt, erroredOutAt });
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
