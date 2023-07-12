import { testingAsserts as ta } from "../../deps-test.ts";
import * as mod from "./flow.ts";

// import * as pe from "npm:plantuml-encoder";
// function plantUmlRenderUrl(
//   pumlContent: string,
//   serverUrl = "http://www.plantuml.com/plantuml/svg/",
// ): string {
//   const encodedSource = pe.encode(pumlContent);
//   return `${serverUrl}${encodedSource}`;
// }

// deno-lint-ignore no-explicit-any
type Any = any;

Deno.test("simple class-based Workflow DAG engine", async () => {
  class SimpleWorkflow {
    readonly executed: { step: "constructor" | keyof SimpleWorkflow }[] = [];
    constructor() {
      this.executed.push({ step: "constructor" });
    }

    simpleStep1() {
      this.executed.push({ step: "simpleStep1" });
    }

    // deno-lint-ignore require-await
    async simpleStep_two() {
      this.executed.push({ step: "simpleStep_two" });
    }

    // deno-lint-ignore require-await
    async simpleStep3() {
      this.executed.push({ step: "simpleStep3" });
    }

    simpleStepFour() {
      this.executed.push({ step: "simpleStepFour" });
    }
  }

  const engine = new mod.Engine<SimpleWorkflow>(
    SimpleWorkflow.prototype,
    mod.decorators<SimpleWorkflow>().metaData,
  );

  ta.assertEquals(engine.lintResults.length, 0);
  ta.assert(engine.isValid);
  ta.assertEquals(engine.DAG.dagSteps.map((s) => s.wfStepID), [
    "simpleStep1",
    "simpleStep_two",
    "simpleStep3",
    "simpleStepFour",
  ]);

  const workflow = new SimpleWorkflow();
  await engine.run(workflow);
  ta.assertEquals(workflow.executed, [
    { step: "constructor" },
    { step: "simpleStep1" },
    { step: "simpleStep_two" },
    { step: "simpleStep3" },
    { step: "simpleStepFour" },
  ]);
});

Deno.test("complex class-based Workflow DAG engine", async () => {
  // these are the workflow class decorators (`wcd`) and you can name it anything
  const cw = mod.decorators<ComplexWorkflow>();
  type WorkflowContext = mod.EngineWorkflowContext<ComplexWorkflow>;
  type StepContext = mod.EngineWorkflowStepContext<ComplexWorkflow>;
  type StepID = mod.WorkflowShapeStep<ComplexWorkflow>;

  class ComplexWorkflow {
    readonly executed: { step: "constructor" | StepID }[] = [];
    protected step1Result:
      | ReturnType<typeof ComplexWorkflow.prototype.step1>
      | undefined;
    constructor() {
      this.executed.push({ step: "constructor" });
    }

    @cw.dependsOn("step3")
    step1() {
      this.executed.push({ step: "step1" });
      return { isSpecial: true, value: 100 };
    }

    // deno-lint-ignore require-await
    async step2(
      ctx: StepContext,
      step1Result: Error | ReturnType<typeof ComplexWorkflow.prototype.step1>,
    ) {
      this.executed.push({ step: ctx.current.wfStepID });
      if (step1Result instanceof Error) throw step1Result;
      this.step1Result = step1Result;
    }

    // deno-lint-ignore require-await
    async step3() {
      this.executed.push({ step: "step3" });
    }

    step4() {
      this.executed.push({ step: "step4" });
    }

    step5() {
      this.executed.push({ step: "step5" });
    }

    @cw.disregard()
    ignoreThisMethod() {
      this.executed.push({ step: "ignoreThisMethod" });
    }
  }

  const eventMetrics = {
    beforeWorkflow: 0,
    beforeStep: [] as string[],
    afterStep: [] as string[],
    afterInterrupt: [] as string[],
    afterError: [] as string[],
    afterWorkflow: 0,
  };

  const engine = new mod.Engine<ComplexWorkflow, WorkflowContext, StepContext>(
    ComplexWorkflow.prototype,
    cw.metaData,
    {
      eventEmitter: {
        beforeWorkflow: (_ctx) => {
          eventMetrics.beforeWorkflow++;
        },
        beforeStep: (step, _ctx) => {
          eventMetrics.beforeStep.push(step);
        },
        afterInterrupt: (step, _ctx) => {
          eventMetrics.afterInterrupt.push(step);
        },
        afterError: (step, _error, _ctx) => {
          eventMetrics.afterError.push(step);
        },
        afterStep: (step, _ctx) => {
          eventMetrics.afterStep.push(step);
        },
        afterWorkflow: (_ctx) => {
          eventMetrics.afterWorkflow++;
        },
      },
    },
  );

  //   console.log(plantUmlRenderUrl(engine.DAG.ops.diagram(engine.DAG.graph)));
  if (engine.DAG.isCyclical()) {
    console.dir(engine.DAG.cycles());
    throw new Error("Invalid graph, cycles detected");
  }

  ta.assertEquals(engine.lintResults.length, 0);
  ta.assert(engine.isValid);
  ta.assertEquals(engine.DAG.dagSteps.map((s) => s.wfStepID), [
    "step3",
    "step1",
    "step2",
    "step4",
    "step5",
  ]);

  const workflow = new ComplexWorkflow();
  await engine.run(workflow);
  ta.assertEquals(eventMetrics, {
    beforeWorkflow: 1,
    beforeStep: ["step3", "step1", "step2", "step4", "step5"],
    afterStep: ["step3", "step1", "step2", "step4", "step5"],
    afterInterrupt: [],
    afterError: [],
    afterWorkflow: 1,
  });
  ta.assertEquals(workflow.executed, [
    { step: "constructor" },
    { step: "step3" },
    { step: "step1" },
    { step: "step2" },
    { step: "step4" },
    { step: "step5" },
  ]);
});
