import {
  introspectedNotebook,
  Kernel,
  KernelCellContext,
  KernelContext,
  KernelOptions,
  KernelRunState,
  KernelRunStateSupplier,
  NotebookCell,
  NotebookDescriptor,
  NotebookShapeCell,
} from "./governance.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export class ObservableKernel<
  Notebook,
  Cell extends NotebookCell<Notebook, NotebookShapeCell<Notebook>>,
  KernelCtx extends KernelContext<Notebook, Cell> = KernelContext<
    Notebook,
    Cell
  >,
  KernelCellCtx extends KernelCellContext<Notebook, Cell> = KernelCellContext<
    Notebook,
    Cell
  >,
> implements Kernel<Notebook> {
  readonly introspectedNB: ReturnType<
    typeof introspectedNotebook<Notebook, NotebookShapeCell<Notebook>, Cell>
  >;
  readonly lintResults: { readonly message: string }[];

  constructor(
    readonly notebook: Notebook,
    readonly descriptor: NotebookDescriptor<Notebook, Cell> =
      new NotebookDescriptor<
        Notebook,
        Cell
      >(),
    readonly options?:
      & KernelOptions<
        Notebook,
        Cell,
        KernelCtx,
        KernelCellCtx
      >
      & {
        readonly executeCells?: (
          introspectedNB: ReturnType<
            typeof introspectedNotebook<
              Notebook,
              NotebookShapeCell<Notebook>,
              Cell
            >
          >,
        ) => Cell[];
      },
  ) {
    this.introspectedNB = introspectedNotebook<
      Notebook,
      NotebookShapeCell<Notebook>,
      Cell
    >(notebook, descriptor);
    this.lintResults = [
      ...descriptor.lintResults,
      ...this.introspectedNB.lintResults,
    ];
  }

  // deno-lint-ignore require-await
  async isValid() {
    return this.introspectedNB.isCyclical() ? false : true;
  }

  // deno-lint-ignore require-await
  async prepareRunState() {
    const prepareNotebookCtx = this.options?.prepareNotebookCtx ??
      ((suggested) => suggested as KernelCtx);
    const prepareCellCtx = this.options?.prepareCellCtx ??
      ((suggested) => suggested as KernelCellCtx);
    const eventEmitter = this.options?.eventEmitter ?? ({
      initNotebook: () => {},
      beforeCell: () => {},
      afterInterrupt: () => {},
      afterError: () => {},
      afterCell: () => {},
      finalizeNotebook: () => {},
    });

    // each cell might have different call args from decoration decls
    const callArgs = this.introspectedNB.cells.map((_cell) => ((
      cellCtx: KernelCellCtx,
      prevExecResult: Any,
    ) => [cellCtx, prevExecResult]));

    const runState: KernelRunState<
      Notebook,
      Cell,
      Any,
      KernelCtx,
      KernelCellCtx
    > = {
      callArgs,
      descriptor: this.descriptor,
      prepareNotebookCtx,
      prepareCellCtx,
      eventEmitter,
      cellsExecuted: [],
      cellResult: (cell) => {
        const crState = cell.status;
        return crState === "aborted" || crState === "indeterminate"
          ? cell.execError
          : (crState === "successful" ? cell.execResult : undefined);
      },
      interruptedAtCell: undefined,
      erroredOutAtCell: undefined,
    };

    const runStateSupplier: KernelRunStateSupplier<
      Notebook,
      Cell,
      Any,
      KernelCtx,
      KernelCellCtx
    > = {
      kernelRunState: () => runState,
    };

    return {
      runState,
      runStateSupplier,
    };
  }

  async run(instance: Notebook) {
    if (!this.isValid) {
      throw new Error(`Cycles detected in graph, invalid DAG`);
    }
    if (!ObservableKernel.isClass<Notebook>(instance)) {
      throw new Error(`Notebook must be a class instance`);
    }

    const { runState, runStateSupplier } = await this.prepareRunState();
    const {
      callArgs,
      prepareNotebookCtx,
      prepareCellCtx,
      eventEmitter: ee,
      cellsExecuted,
    } = runState;

    const execCells = this.options?.executeCells?.(this.introspectedNB) ??
      this.introspectedNB.topologicallySortedCells();
    const staticCtx: KernelContext<Notebook, Cell> = {
      cells: execCells,
      notebook: instance,
      last: execCells.length - 1,
    };
    const nbCtx = prepareNotebookCtx(staticCtx);

    // Give the opportunity for an external event handler to do any pre-processing
    // or abort the Notebook; abort only if the return value is `false`.
    const handle = await ee.initNotebook(nbCtx);
    if (typeof handle === "boolean" && handle === false) return;

    // Now give an opportunity for any `@init`-style decorators in our instance
    // to do any pre-processing or abort the Notebook; abort only if the return
    // value for any init method is `false`.
    for (
      const init of this.descriptor.initProps.sort((a, b) =>
        a.priority - b.priority
      )
    ) {
      const handle = await ((instance as Any)[init.propertyKey] as Any)
        .call(instance, nbCtx);
      if (typeof handle === "boolean" && handle === false) return;
    }

    // At this point all initializations and pre-processing are complete; now we
    // loop through each cell and attempt to execute the functions associated
    // with each cell.
    for (let cell = 0; cell < execCells.length; cell++) {
      const prevCellState = cell > 0
        ? runState.cellsExecuted[cell - 1]
        : undefined;
      const [previous, current, next] = [
        cell > 0 ? prevCellState?.cellCtx : undefined,
        execCells[cell],
        cell < staticCtx.last ? execCells[cell + 1] : undefined,
      ];

      const cellCtx = {
        ...prepareCellCtx({
          ...staticCtx,
          index: cell,
          previous,
          current,
          next,
        }),
        ...runStateSupplier,
      };
      const rsExecStatic = { index: cell, cellCtx };
      cellsExecuted[cell] = { status: "initial", ...rsExecStatic };

      // At this point all of our state management for the current cell is
      // setup so we're ready to execute; before we execute, give an opportunity
      // for any external listeners to do any pre-processing for the specific
      // cell and ascertain whether the Notebook should be interrupted for any
      // reason.
      const runCell = await ee.beforeCell<NotebookShapeCell<Notebook> & string>(
        String(current.nbShapeCell) as Any,
        cellCtx,
      );
      if (runCell === "interrupt") {
        cellsExecuted[cell] = { status: "interrupted", ...rsExecStatic };
        runState.interruptedAtCell = cellCtx;
        break;
      }

      // Now cell-specific pre-processing is complete and we're sure no interruption
      // has been requested so we wrap our execution in a try/catch block and run
      // the function.
      const prevCellResult = prevCellState
        ? runState.cellResult(prevCellState)
        : undefined;
      try {
        // Each method has the following signature:
        //    cell(ctx: CellContext, ...injecteArgs, prevExecResult: Error | PreviousCellResult)
        const execResult = await ((instance as Any)[current.nbShapeCell] as Any)
          .call(instance, ...callArgs[cell](cellCtx, prevCellResult));
        cellsExecuted[cell] = {
          ...rsExecStatic,
          status: "successful",
          execResult,
        };
      } catch (execError) {
        // If we get any exceptions we have two choices: either trap and continue
        // processing the other cells or, if an external error event listener wants
        // us to abort we'll stop processing and fall out of the cells loop.
        const abortOnError = await ee.afterError<
          NotebookShapeCell<Notebook> & string
        >(
          String(current.nbShapeCell) as Any,
          execError,
          cellCtx,
        );
        if (abortOnError === "abort") {
          cellsExecuted[cell] = {
            ...rsExecStatic,
            status: "aborted",
            execError,
          };
          runState.erroredOutAtCell = cellCtx;
          break;
        } else {
          cellsExecuted[cell] = {
            ...rsExecStatic,
            status: "indeterminate",
            execError,
          };
        }
      }

      // At this point execution, interruption, and error detection is complete;
      // give an opportunity for any external listeners to do any post-processing
      // for the specific cell.
      await ee.afterCell<NotebookShapeCell<Notebook> & string, Any>(
        String(current.nbShapeCell) as Any,
        cellsExecuted[cell],
        cellCtx,
      );
    }

    // At this point we've either completed all cells or an interruption/abort
    // request has been detected. runState.cellsExecuted contains the state of
    // executions. Now give an opportunity for any `@finalize`-style decorators
    // in our instance to do any post-processing.
    const finalCtx = { ...nbCtx, ...runStateSupplier };
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

    // finally, give the opportunity for an external event handler to do any
    // post-processing
    await ee.finalizeNotebook(finalCtx);
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
