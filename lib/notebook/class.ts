import * as g from "../universal/graph.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

// There is no "Notebook" type or interface because it's just a "plain old
// JavaScript class".

/**
 * Interface which accepts a Notebook class or object and limits the keys to
 * just class methods (basically every function defined in a class is a Notebook
 * _cell_). If the Notebook class or object has other properties that are not
 * functions those will be kept out of the type-safe shape.
 */
export type NotebookShapeCell<Notebook> = {
  [K in keyof Notebook]: Notebook[K] extends (...args: Any[]) => Any ? K
    : never;
}[keyof Notebook];

/**
 * The descriptor and name of a single cell of a given Notebook
 */
export type NotebookCell<
  Notebook,
  ShapeCell extends NotebookShapeCell<Notebook>,
> =
  & { readonly nbShapeCell: ShapeCell }
  & PropertyDescriptor;

/**
 * The notebook and cells that a kernel should operate on.
 */
export type NotebookContext<
  Notebook,
  Cell extends NotebookCell<Notebook, NotebookShapeCell<Notebook>>,
> = {
  readonly cells: Cell[];
  readonly notebook: Notebook;
  readonly last: number;
};

/**
 * The state or _context_ of a single Notebook cell when being executed in
 * a kernel.
 */
export type NotebookCellContext<
  Notebook,
  Cell extends NotebookCell<Notebook, NotebookShapeCell<Notebook>>,
> =
  & NotebookContext<Notebook, Cell>
  & {
    readonly current: Cell;
    readonly previous?: NotebookCellContext<Notebook, Cell>;
    readonly next?: Cell;
    readonly index: number;
  };

/**
 * Defines TypeScript functions which can be used to decorate class methods and
 * introspect the shape and notebook cells.
 */
export class NotebookDescriptor<
  Notebook,
  Cell extends NotebookCell<Notebook, NotebookShapeCell<Notebook>>,
  NotebookShape extends {
    [K in NotebookShapeCell<Notebook>]: Cell;
  } = {
    [K in NotebookShapeCell<Notebook>]: Cell;
  },
  CellName extends keyof NotebookShape = keyof NotebookShape,
> {
  readonly lintResults: { readonly message: string }[] = [];
  readonly initProps: {
    readonly propertyKey: CellName;
    readonly priority: number;
    readonly descriptor: PropertyDescriptor;
  }[] = [];
  readonly finalizeProps: {
    readonly propertyKey: CellName;
    readonly priority: number;
    readonly descriptor: PropertyDescriptor;
  }[] = [];
  readonly disregardProps = new Map<CellName, PropertyDescriptor>();
  readonly dependencies: {
    readonly propertyKey: CellName;
    readonly dependsOn: CellName;
    readonly descriptor: PropertyDescriptor;
  }[] = [];

  /**
   * Extract the cells and object shape of a notebook
   * @param notebook the prototype of a class
   */
  introspect(notebook: Notebook) {
    const shape: NotebookShape = {} as Any;
    const cells: Cell[] = [];
    for (const pn of Object.getOwnPropertyNames(notebook)) {
      if (pn == "constructor") continue;
      if (this.disregardProps.get(pn as CellName)) continue;

      const pd = Object.getOwnPropertyDescriptor(notebook, pn);
      if (typeof pd?.value !== "function") continue;

      const nbShapeCell = pn as NotebookShapeCell<Notebook>;
      if (pd) {
        const cellMetaData: NotebookCell<
          Notebook,
          NotebookShapeCell<Notebook>
        > = { nbShapeCell, ...pd };
        cells.push(cellMetaData as Cell);
        (shape as Any)[nbShapeCell] = cellMetaData;
      }
    }

    return { shape, cells };
  }

  /**
   * Decorate a cell function with `@dependsOn('cell')` to instruct the kernel
   * to make the function a _dependent_ (for topological sorting order) of the
   * function called `cell`.
   * @param dependsOn name of a function in the notebook
   * @returns notebook cell decorator
   */
  dependsOn(dependsOn: CellName) {
    return (
      _target: Notebook,
      propertyKey: CellName,
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
   * Decorate a function with `@disregard` if it should not be treated as a
   * notebook cell. TODO: figure out how to remove _disregarded_ functions from
   * NotebookShapeCell<Notebook>
   * @returns notebook cell decorator
   */
  disregard() {
    return (
      _target: Notebook,
      propertyKey: CellName,
      descriptor: PropertyDescriptor,
    ) => {
      this.disregardProps.set(propertyKey, descriptor);
    };
  }

  /**
   * Decorate a function with `init` if it should be treated as an
   * initialization function. The priority is the sort order, the higher the
   * number the lower in priority it has (priority #1 comes first, etc.). All
   * initialization functions run in priority order before all other cells
   * are executed.
   *
   * Initialization of a notebook should typically occur in a constructor; however,
   * since constructors cannot run async code, using an async `@init`-decorated
   * function could be useful.
   * @param priority the execution order, the lower the earlier it's run
   * @returns notebook cell decorator
   */
  init(priority?: number) {
    return (
      _target: Notebook,
      propertyKey: CellName,
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
   * finalization functions run in priority order after all other cells
   * are executed.
   * @param priority the execution order, the lower the earlier it's run
   * @returns notbooke cell decorator
   */
  finalize(priority?: number) {
    return (
      _target: Notebook,
      propertyKey: CellName,
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
 * Prepare the cell-based operations for a notebook instance.
 * @param notebook class instance or prototype to introspect
 * @param descriptor decorators and other descriptors for the given notebook
 * @returns operations and cells for the given notebook
 */
export function introspectedNotebook<
  Notebook,
  ShapeCell extends NotebookShapeCell<Notebook>,
  Cell extends NotebookCell<Notebook, ShapeCell>,
>(notebook: Notebook, descriptor: NotebookDescriptor<Notebook, Cell>) {
  const lintResults: { readonly message: string }[] = [];

  const dagOps = g.dagDepthFirst<Cell, ShapeCell>(
    (node) => node.nbShapeCell,
    (a, b) => {
      if (
        typeof a.nbShapeCell === "symbol" || typeof b.nbShapeCell === "symbol"
      ) {
        throw new Error(
          "Cannot meaningfully compare symbol keys in cellsDAG",
        );
      }

      if (
        typeof a.nbShapeCell === "number" && typeof b.nbShapeCell === "number"
      ) {
        return a.nbShapeCell - b.nbShapeCell;
      }

      const aString = String(a.nbShapeCell);
      const bString = String(b.nbShapeCell);

      if (aString < bString) {
        return -1;
      }

      if (aString > bString) {
        return 1;
      }

      return 0;
    },
  );

  const nodes: Cell[] = [];
  const edges: g.Edge<Cell, Cell>[] = [];

  const graph = { nodes, edges };
  const { cells, shape } = descriptor.introspect(notebook);

  for (const node of cells) nodes.push(node);

  for (const dep of descriptor.dependencies) {
    const node = shape[dep.propertyKey];
    const dependsOn = shape[dep.dependsOn];
    if (dependsOn) {
      edges.push({ from: dependsOn, to: node });
    } else {
      lintResults.push({
        message: `invalid dependency: ${String(dep.dependsOn)} in ${
          String(node.nbShapeCell)
        }`,
      });
    }
  }

  for (let i = 0; i < cells.length; i++) {
    const current = cells[i];
    if (edges.find((e) => e.from.nbShapeCell == current.nbShapeCell)) continue;

    let n = i + 1;
    while (n < cells.length) {
      const next = cells[n];
      if (!edges.find((e) => e.from.nbShapeCell == next.nbShapeCell)) {
        edges.push({ from: current, to: next });
        break;
      }
      n++;
    }
  }

  if (dagOps.isCyclical(graph)) {
    lintResults.push({ message: `Cycles detected in graph` });
  }

  return {
    shape,
    cells,
    lintResults,
    graph,
    dagOps,
    topologicallySortedCells: () => dagOps.topologicalSort(graph),
    isCyclical: () => dagOps.isCyclical(graph),
    cycles: () => dagOps.cycles(graph),
  };
}

export class ObservableKernel<
  Notebook,
  Cell extends NotebookCell<Notebook, NotebookShapeCell<Notebook>>,
  KernelNotebookCtx extends NotebookContext<Notebook, Cell> = NotebookContext<
    Notebook,
    Cell
  >,
  KernelNotebookCellCtx extends NotebookCellContext<Notebook, Cell> =
    NotebookCellContext<
      Notebook,
      Cell
    >,
> {
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
  async initRunState(options?: {
    readonly prepareNotebookCtx?: (
      suggested: NotebookContext<Notebook, Cell>,
    ) => KernelNotebookCtx;
    readonly prepareCellCtx?: (
      suggested: NotebookCellContext<Notebook, Cell>,
    ) => KernelNotebookCellCtx;
    readonly executeCells?: (
      introspectedNB: ReturnType<
        typeof introspectedNotebook<
          Notebook,
          NotebookShapeCell<Notebook>,
          Cell
        >
      >,
    ) => Cell[];
  }) {
    type Events = {
      initNotebook: (
        ctx: KernelNotebookCtx,
      ) => void | false | Promise<void | false>;
      beforeCell: <ShapeCell extends string & NotebookShapeCell<Notebook>>(
        cellID: `${ShapeCell}`,
        ctx:
          & KernelNotebookCellCtx
          & RunStateSupplier<Any>,
      ) => void | "interrupt" | Promise<void | "interrupt">;
      afterInterrupt: <ShapeCell extends string & NotebookShapeCell<Notebook>>(
        cellID: `${ShapeCell}`,
        ctx:
          & KernelNotebookCellCtx
          & RunStateSupplier<Any>,
      ) => void | Promise<void>;
      afterError: <ShapeCell extends string & NotebookShapeCell<Notebook>>(
        cellID: `${ShapeCell}`,
        error: Error,
        ctx:
          & KernelNotebookCellCtx
          & RunStateSupplier<Any>,
      ) => void | "continue" | "abort" | Promise<void | "continue" | "abort">;
      afterCell: <
        ShapeCell extends string & NotebookShapeCell<Notebook>,
        Result,
      >(
        cellID: `${ShapeCell}`,
        result: RunCellState<Result>,
        ctx:
          & KernelNotebookCellCtx
          & RunStateSupplier<Result>,
      ) => void | Promise<void>;
      finalizeNotebook: (
        ctx:
          & KernelNotebookCtx
          & RunStateSupplier<Any>,
      ) => void | Promise<void>;
    };

    type RunCellState<ExecResult> =
      & {
        readonly index: number;
        readonly cellCtx: KernelNotebookCellCtx;
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

    interface RunState<ExecResult> {
      descriptor: NotebookDescriptor<Notebook, Cell>;
      prepareNotebookCtx: (
        suggested: NotebookContext<Notebook, Cell>,
      ) => KernelNotebookCtx;
      prepareCellCtx: (
        suggested: NotebookCellContext<Notebook, Cell>,
      ) => KernelNotebookCellCtx;
      callArgs: ((
        cellCtx: KernelNotebookCellCtx,
        prevExecResult: ExecResult,
      ) => Array<Any>)[];
      eventEmitter: Events;
      cellsExecuted: RunCellState<ExecResult>[];
      cellResult: (
        cellState: RunCellState<ExecResult>,
      ) => Error | ExecResult;
      interruptedAtCell: KernelNotebookCellCtx | undefined;
      erroredOutAtCell: KernelNotebookCellCtx | undefined;
    }

    interface RunStateSupplier<PreviousResult> {
      readonly kernelRunState: () => RunState<PreviousResult>;
    }

    const prepareNotebookCtx = options?.prepareNotebookCtx ??
      ((suggested) => suggested as KernelNotebookCtx);
    const prepareCellCtx = options?.prepareCellCtx ??
      ((suggested) => suggested as KernelNotebookCellCtx);
    const eventEmitter: Events = {
      initNotebook: () => {},
      beforeCell: () => {},
      afterInterrupt: () => {},
      afterError: () => {},
      afterCell: () => {},
      finalizeNotebook: () => {},
    };

    // each cell might have different call args from decoration decls
    const callArgs = this.introspectedNB.cells.map((_cell) => ((
      cellCtx: KernelNotebookCellCtx,
      prevExecResult: Any,
    ) => [cellCtx, prevExecResult]));

    const runState: RunState<Any> = {
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

    const runStateSupplier: RunStateSupplier<Any> = {
      kernelRunState: () => runState,
    };

    return {
      executeCells: options?.executeCells?.(this.introspectedNB) ??
        this.introspectedNB.topologicallySortedCells(),
      runState,
      runStateSupplier,
    };
  }

  async run(
    instance: Notebook,
    initRunState: Awaited<ReturnType<this["initRunState"]>>,
  ) {
    if (!this.isValid) {
      throw new Error(`Cycles detected in graph, invalid DAG`);
    }
    if (!ObservableKernel.isClass<Notebook>(instance)) {
      throw new Error(`Notebook must be a class instance`);
    }

    const { runState, runStateSupplier, executeCells } = initRunState;
    const {
      callArgs,
      prepareNotebookCtx,
      prepareCellCtx,
      eventEmitter: ee,
      cellsExecuted,
    } = runState;

    const staticCtx: NotebookContext<Notebook, Cell> = {
      cells: executeCells,
      notebook: instance,
      last: executeCells.length - 1,
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
    for (let cell = 0; cell < executeCells.length; cell++) {
      const prevCellState = cell > 0
        ? runState.cellsExecuted[cell - 1]
        : undefined;
      const [previous, current, next] = [
        cell > 0 ? prevCellState?.cellCtx : undefined,
        executeCells[cell],
        cell < staticCtx.last ? executeCells[cell + 1] : undefined,
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

  /**
   * Introspect and construct a typical notebook kernel.
   * @param prototype a Notebook class (such as XyzNotebook.prototype)
   * @returns new ObservableKernel instance
   */
  static create<Notebook>(
    prototype: Notebook,
    descriptor?: NotebookDescriptor<
      Notebook,
      NotebookCell<Notebook, NotebookShapeCell<Notebook>>
    >,
  ) {
    type ShapeCell = NotebookShapeCell<Notebook>;
    type Cell = NotebookCell<Notebook, ShapeCell>;
    type NotebookCtx = NotebookContext<Notebook, Cell>;
    type CellCtx = NotebookCellContext<Notebook, Cell>;

    return new ObservableKernel<
      Notebook,
      Cell,
      NotebookCtx,
      CellCtx
    >(prototype, descriptor ?? new NotebookDescriptor<Notebook, Cell>());
  }
}
