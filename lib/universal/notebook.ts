import * as g from "./graph.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

/**
 * Interface which accepts a Notebook class or object and limits the keys to
 * just functions (basically every function is a Notebook _cell_). If the
 * Notebook class or object has other properties that are not functions those
 * will be kept out of the type-safe shape.
 */
export type NotebookShapeCell<Notebook> = {
  [K in keyof Notebook]: Notebook[K] extends (...args: Any[]) => Any ? K
    : never;
}[keyof Notebook];

/**
 * Defines TypeScript functions which can be used to decorate functions and
 * introspect the shape and notebook cells.
 */
export class NotebookDescriptor<
  Notebook,
  NotebookShape extends {
    [K in NotebookShapeCell<Notebook>]: NotebookCell<Notebook>;
  } = {
    [K in NotebookShapeCell<Notebook>]: NotebookCell<Notebook>;
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
    const introspectedShape: NotebookShape = {} as Any;
    const introspectedCells: NotebookCell<Notebook>[] = [];
    for (const pn of Object.getOwnPropertyNames(notebook)) {
      if (pn == "constructor") continue;
      if (this.disregardProps.get(pn as CellName)) continue;

      const pd = Object.getOwnPropertyDescriptor(notebook, pn);
      if (typeof pd?.value !== "function") continue;

      const nbShapeCell = pn as NotebookShapeCell<Notebook>;
      if (pd) {
        const cellMetaData: NotebookCell<Notebook> = { nbShapeCell, ...pd };
        introspectedCells.push(cellMetaData);
        (introspectedShape as Any)[nbShapeCell] = cellMetaData;
      }
    }

    return { introspectedShape, introspectedCells };
  }

  /**
   * Decorate a cell function with `@dependsOn('cell')` to instruct the DAG
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
 * The descriptor and name of a single cell of a given Notebook
 */
export type NotebookCell<
  Notebook,
  ShapeCell extends NotebookShapeCell<Notebook> = NotebookShapeCell<Notebook>,
> =
  & { readonly nbShapeCell: ShapeCell }
  & PropertyDescriptor;

/**
 * The DAG cells in topological sort order after a Notebook instance been
 * inspected. This interface is independent of the execution kernel.
 */
export type NotebookDagContext<Notebook> = {
  readonly dagCells: NotebookCell<Notebook>[];
  readonly notebook: Notebook;
  readonly last: number;
};

/**
 * The state or _context_ of a single Notebook DAG cell, independent of the
 * Kernel that is executing the DAG.
 */
export type NotebookDagCellContext<Notebook> =
  & NotebookDagContext<Notebook>
  & {
    readonly current: NotebookCell<Notebook>;
    readonly previous?: NotebookDagCellContext<Notebook>;
    readonly next?: NotebookCell<Notebook>;
    readonly index: number;
  };

/**
 * Prepare the DAG cell-based operations for a notebook instance.
 * @param notebook class instance or prototype to generate the DAG from
 * @param descriptor decorators and other descriptors for the given notebook
 * @returns DAG graph and operations and cells for the given notebook
 */
export function cellsDAG<
  Notebook,
>(notebook: Notebook, descriptor: NotebookDescriptor<Notebook>) {
  const lintResults: { readonly message: string }[] = [];

  const ops = g.dagDepthFirst<
    NotebookCell<Notebook, NotebookShapeCell<Notebook>>,
    NotebookShapeCell<Notebook>
  >(
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

  const nodes: NotebookCell<Notebook, NotebookShapeCell<Notebook>>[] = [];
  const edges: g.Edge<
    NotebookCell<Notebook, NotebookShapeCell<Notebook>>,
    NotebookCell<Notebook, NotebookShapeCell<Notebook>>
  >[] = [];

  const graph = { nodes, edges };
  const { introspectedCells, introspectedShape } = descriptor.introspect(
    notebook,
  );

  for (const node of introspectedCells) {
    nodes.push(node);
  }

  for (const dep of descriptor.dependencies) {
    const node = introspectedShape[dep.propertyKey];
    const dependsOn = introspectedShape[dep.dependsOn];
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

  for (let i = 0; i < introspectedCells.length; i++) {
    const current = introspectedCells[i];
    if (edges.find((e) => e.from.nbShapeCell == current.nbShapeCell)) continue;

    let n = i + 1;
    while (n < introspectedCells.length) {
      const next = introspectedCells[n];
      if (!edges.find((e) => e.from.nbShapeCell == next.nbShapeCell)) {
        edges.push({ from: current, to: next });
        break;
      }
      n++;
    }
  }

  if (ops.isCyclical(graph)) {
    lintResults.push({ message: `Cycles detected in graph` });
  }

  return {
    lintResults,
    graph,
    ops,
    dagCells: ops.topologicalSort(graph),
    isCyclical: () => ops.isCyclical(graph),
    cycles: () => ops.cycles(graph),
    introspectedCells,
    introspectedShape,
  };
}

export type NotebookEvents<
  Notebook,
  NotebookContext extends NotebookDagContext<Notebook>,
  CellContext extends NotebookDagCellContext<Notebook>,
> = {
  readonly initNotebook: (
    ctx: NotebookContext,
  ) => void | false | Promise<void | false>;
  readonly beforeCell: <
    ShapeCell extends string & NotebookShapeCell<Notebook>,
  >(
    cellID: `${ShapeCell}`,
    ctx:
      & CellContext
      & KernelRunStateSupplier<Notebook, Any, NotebookContext, CellContext>,
  ) => void | "interrupt" | Promise<void | "interrupt">;
  readonly afterInterrupt: <
    ShapeCell extends string & NotebookShapeCell<Notebook>,
  >(
    cellID: `${ShapeCell}`,
    ctx:
      & CellContext
      & KernelRunStateSupplier<Notebook, Any, NotebookContext, CellContext>,
  ) => void | Promise<void>;
  readonly afterError: <
    ShapeCell extends string & NotebookShapeCell<Notebook>,
  >(
    cellID: `${ShapeCell}`,
    error: Error,
    ctx:
      & CellContext
      & KernelRunStateSupplier<Notebook, Any, NotebookContext, CellContext>,
  ) => void | "continue" | "abort" | Promise<void | "continue" | "abort">;
  readonly afterCell: <
    ShapeCell extends string & NotebookShapeCell<Notebook>,
    Result,
  >(
    cellID: `${ShapeCell}`,
    result: KernelRunCellState<Notebook, Result, NotebookContext, CellContext>,
    ctx:
      & CellContext
      & KernelRunStateSupplier<Notebook, Result, NotebookContext, CellContext>,
  ) => void | Promise<void>;
  readonly finalizeNotebook: (
    ctx:
      & NotebookContext
      & KernelRunStateSupplier<Notebook, Any, NotebookContext, CellContext>,
  ) => void | Promise<void>;
};

export interface KernelOptions<
  Notebook,
  NotebookContext extends NotebookDagContext<Notebook> = NotebookDagContext<
    Notebook
  >,
  CellContext extends NotebookDagCellContext<Notebook> = NotebookDagCellContext<
    Notebook
  >,
> {
  readonly prepareNotebookCtx?: (
    suggested: NotebookDagContext<Notebook>,
  ) => NotebookContext;
  readonly prepareCellCtx?: (
    suggested: NotebookDagCellContext<Notebook>,
  ) => CellContext;
  readonly eventEmitter?: NotebookEvents<
    Notebook,
    NotebookContext,
    CellContext
  >;
}

export type KernelRunCellState<
  Notebook,
  ExecResult,
  NotebookContext extends NotebookDagContext<Notebook>,
  CellContext extends NotebookDagCellContext<Notebook>,
> =
  & {
    readonly index: number;
    readonly cellCtx: CellContext;
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

export interface KernelRunState<
  Notebook,
  ExecResult,
  NotebookContext extends NotebookDagContext<Notebook>,
  CellContext extends NotebookDagCellContext<Notebook>,
> {
  readonly descriptor: NotebookDescriptor<Notebook>;
  readonly prepareNotebookCtx: (
    suggested: NotebookDagContext<Notebook>,
  ) => NotebookContext;
  readonly prepareCellCtx: (
    suggested: NotebookDagCellContext<Notebook>,
  ) => CellContext;
  readonly callArgs:
    ((cellCtx: CellContext, prevExecResult: ExecResult) => Array<Any>)[];
  readonly eventEmitter: NotebookEvents<Notebook, NotebookContext, CellContext>;
  readonly cellsExecuted: KernelRunCellState<
    Notebook,
    ExecResult,
    NotebookContext,
    CellContext
  >[];
  readonly cellResult: (
    cellState: KernelRunCellState<
      Notebook,
      ExecResult,
      NotebookContext,
      CellContext
    >,
  ) => Error | ExecResult;
  interruptedAtCell: CellContext | undefined;
  erroredOutAtCell: CellContext | undefined;
}

export interface KernelRunStateSupplier<
  Notebook,
  PreviousResult,
  NotebookContext extends NotebookDagContext<Notebook>,
  CellContext extends NotebookDagCellContext<Notebook>,
> {
  readonly kernelRunState: () => KernelRunState<
    Notebook,
    PreviousResult,
    NotebookContext,
    CellContext
  >;
}

export class Kernel<
  Notebook,
  NotebookContext extends NotebookDagContext<Notebook> = NotebookDagContext<
    Notebook
  >,
  CellContext extends NotebookDagCellContext<Notebook> = NotebookDagCellContext<
    Notebook
  >,
> {
  readonly DAG: ReturnType<typeof cellsDAG<Notebook>>;
  readonly lintResults: { readonly message: string }[];

  constructor(
    readonly notebook: Notebook,
    readonly descriptor: NotebookDescriptor<Notebook> = new NotebookDescriptor<
      Notebook
    >(),
    readonly options?: KernelOptions<
      Notebook,
      NotebookContext,
      CellContext
    >,
  ) {
    this.DAG = cellsDAG<Notebook>(notebook, descriptor);
    this.lintResults = [
      ...descriptor.lintResults,
      ...this.DAG.lintResults,
    ];
  }

  get isValid() {
    return this.DAG.isCyclical() ? false : true;
  }

  // deno-lint-ignore require-await
  async prepareRunState() {
    const prepareNotebookCtx = this.options?.prepareNotebookCtx ??
      ((suggested) => suggested as NotebookContext);
    const prepareCellCtx = this.options?.prepareCellCtx ??
      ((suggested) => suggested as CellContext);
    const eventEmitter = this.options?.eventEmitter ?? ({
      initNotebook: () => {},
      beforeCell: () => {},
      afterInterrupt: () => {},
      afterError: () => {},
      afterCell: () => {},
      finalizeNotebook: () => {},
    });

    // each cell might have different call args from decoration decls
    const callArgs = this.DAG.introspectedCells.map((_cell) => ((
      cellCtx: CellContext,
      prevExecResult: Any,
    ) => [cellCtx, prevExecResult]));

    const runState: KernelRunState<
      Notebook,
      Any,
      NotebookContext,
      CellContext
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
      Any,
      NotebookContext,
      CellContext
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
    if (!Kernel.isClass<Notebook>(instance)) {
      throw new Error(`Notebook must be a class instance`);
    }

    const { runState, runStateSupplier } = await this.prepareRunState();
    const { dagCells } = this.DAG;
    const {
      callArgs,
      prepareNotebookCtx,
      prepareCellCtx,
      eventEmitter: ee,
      cellsExecuted,
    } = runState;

    const staticCtx: NotebookDagContext<Notebook> = {
      dagCells,
      notebook: instance,
      last: dagCells.length - 1,
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

    // At this point all initializations and pre-processing are complete; now
    // we loop through each DAG topologically sorted cell and attempt to execute
    // the functions associated with each cell.
    for (let cell = 0; cell < dagCells.length; cell++) {
      const prevCellState = cell > 0
        ? runState.cellsExecuted[cell - 1]
        : undefined;
      const [previous, current, next] = [
        cell > 0 ? prevCellState?.cellCtx : undefined,
        dagCells[cell],
        cell < staticCtx.last ? dagCells[cell + 1] : undefined,
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

      // Tt this point all of our state management for the current cell is
      // setup so we're ready to execute; before we execute, given an opportunity
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
