import { testingAsserts as ta } from "./deps-test.ts";
import * as mod from "./class.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

Deno.test("simple class-based notebook cells executed in linear order", async () => {
  class SimpleNotebook {
    readonly executed: { cell: "constructor" | keyof SimpleNotebook }[] = [];
    constructor() {
      this.executed.push({ cell: "constructor" });
    }

    simpleCell1() {
      this.executed.push({ cell: "simpleCell1" });
    }

    // deno-lint-ignore require-await
    async simpleCell_two() {
      this.executed.push({ cell: "simpleCell_two" });
    }

    // deno-lint-ignore require-await
    async simpleCell3() {
      this.executed.push({ cell: "simpleCell3" });
    }

    "simpleCell-four"() {
      this.executed.push({ cell: "simpleCell-four" });
    }
  }

  const kernel = mod.ObservableKernel.create(SimpleNotebook.prototype);
  if (!kernel.isValid() || kernel.lintResults.length > 0) {
    const pe = await import("npm:plantuml-encoder");
    const diagram = kernel.introspectedNB.dagOps.diagram(
      kernel.introspectedNB.graph,
    );
    console.log(`http://www.plantuml.com/plantuml/svg/${pe.encode(diagram)}`);
  }

  ta.assertEquals(kernel.lintResults, []);
  ta.assert(kernel.isValid());

  const tsCells = kernel.introspectedNB.topologicallySortedCells();
  ta.assertEquals(tsCells, kernel.introspectedNB.cells);
  ta.assertEquals(tsCells.map((s) => s.nbShapeCell), [
    "simpleCell1",
    "simpleCell_two",
    "simpleCell3",
    "simpleCell-four",
  ]);

  const workflow = new SimpleNotebook();
  await kernel.run(workflow, await kernel.initRunState());
  ta.assertEquals(workflow.executed, [
    { cell: "constructor" },
    { cell: "simpleCell1" },
    { cell: "simpleCell_two" },
    { cell: "simpleCell3" },
    { cell: "simpleCell-four" },
  ]);
});

Deno.test("complex class-based notebook cells executed in topological order", async () => {
  // these are the complex notebook decorators (`cnd`) and you can name it anything
  type ComplexCell = mod.NotebookCell<
    ComplexNotebook,
    mod.NotebookShapeCell<ComplexNotebook>
  >;
  const cnd = new mod.NotebookDescriptor<ComplexNotebook, ComplexCell>();
  type NotebookContent = mod.NotebookContext<ComplexNotebook, ComplexCell>;
  type CellContext = mod.NotebookCellContext<ComplexNotebook, ComplexCell>;
  type ShapeCell = mod.NotebookShapeCell<ComplexNotebook>;

  class ComplexNotebook {
    readonly executed: {
      cell:
        | "constructor"
        | "beforeAllOtherCells"
        | "afterAllOtherCells"
        | ShapeCell;
    }[] = [];
    protected cell1Result:
      | ReturnType<typeof ComplexNotebook.prototype.cell1>
      | undefined;
    constructor() {
      this.executed.push({ cell: "constructor" });
    }

    @cnd.init()
    // deno-lint-ignore require-await
    async beforeAllOtherCells() {
      this.executed.push({ cell: "beforeAllOtherCells" });
    }

    @cnd.dependsOn("cell3")
    cell1() {
      this.executed.push({ cell: "cell1" });
      return { isSpecial: true, value: 100 };
    }

    // deno-lint-ignore require-await
    async cell2(
      ctx: CellContext,
      cell1Result: Error | ReturnType<typeof ComplexNotebook.prototype.cell1>,
    ) {
      this.executed.push({ cell: ctx.current.nbShapeCell });
      if (cell1Result instanceof Error) throw cell1Result;
      this.cell1Result = cell1Result;
      ta.assertEquals(this.cell1Result, { isSpecial: true, value: 100 });
    }

    // deno-lint-ignore require-await
    async cell3() {
      this.executed.push({ cell: "cell3" });
    }

    cell4() {
      this.executed.push({ cell: "cell4" });
    }

    cell5() {
      this.executed.push({ cell: "cell5" });
    }

    @cnd.disregard()
    ignoreThisMethod() {
      this.executed.push({ cell: "ignoreThisMethod" });
    }

    @cnd.finalize()
    // deno-lint-ignore require-await
    async afterAllOtherCells() {
      this.executed.push({ cell: "afterAllOtherCells" });
    }
  }

  const eventMetrics = {
    beforeNotebook: 0,
    beforeCell: [] as string[],
    afterCell: [] as string[],
    afterInterrupt: [] as string[],
    afterError: [] as string[],
    afterNotebook: 0,
  };

  const kernel = mod.ObservableKernel.create(ComplexNotebook.prototype, cnd);
  if (kernel.introspectedNB.isCyclical()) {
    const pe = await import("npm:plantuml-encoder");
    const diagram = kernel.introspectedNB.dagOps.diagram(
      kernel.introspectedNB.graph,
    );
    console.log(`http://www.plantuml.com/plantuml/svg/${pe.encode(diagram)}`);
    console.dir(kernel.introspectedNB.cycles());
    throw new Error("Invalid graph, cycles detected");
  }

  ta.assertEquals(kernel.lintResults.length, 0);
  ta.assert(kernel.isValid());

  const tsCells = kernel.introspectedNB.topologicallySortedCells();
  ta.assertEquals(tsCells.map((s) => s.nbShapeCell), [
    "cell3",
    "cell1",
    "cell2",
    "cell4",
    "cell5",
  ]);

  const workflow = new ComplexNotebook();
  const initRunState = await kernel.initRunState();
  initRunState.runState.eventEmitter.initNotebook = (_ctx) => {
    eventMetrics.beforeNotebook++;
  };
  initRunState.runState.eventEmitter.beforeCell = (cell, _ctx) => {
    eventMetrics.beforeCell.push(cell);
  };
  initRunState.runState.eventEmitter.afterInterrupt = (cell, _ctx) => {
    eventMetrics.afterInterrupt.push(cell);
  };
  initRunState.runState.eventEmitter.afterError = (cell, _ctx) => {
    eventMetrics.afterError.push(cell);
  };
  initRunState.runState.eventEmitter.afterCell = (cell, _ctx) => {
    eventMetrics.afterCell.push(cell);
  };
  initRunState.runState.eventEmitter.finalizeNotebook = (_ctx) => {
    eventMetrics.afterNotebook++;
  };

  await kernel.run(workflow, initRunState);
  ta.assertEquals(eventMetrics, {
    beforeNotebook: 1,
    beforeCell: ["cell3", "cell1", "cell2", "cell4", "cell5"],
    afterCell: ["cell3", "cell1", "cell2", "cell4", "cell5"],
    afterInterrupt: [],
    afterError: [],
    afterNotebook: 1,
  });
  ta.assertEquals(workflow.executed, [
    { cell: "constructor" },
    { cell: "beforeAllOtherCells" },
    { cell: "cell3" },
    { cell: "cell1" },
    { cell: "cell2" },
    { cell: "cell4" },
    { cell: "cell5" },
    { cell: "afterAllOtherCells" },
  ]);
});
