import * as g from "../universal/graph.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

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
 * Defines TypeScript functions which can be used to decorate functions and
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
 * The descriptor and name of a single cell of a given Notebook
 */
export type NotebookCell<
  Notebook,
  ShapeCell extends NotebookShapeCell<Notebook>,
> =
  & { readonly nbShapeCell: ShapeCell }
  & PropertyDescriptor;

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

/**
 * The notebook and cells that a kernel should operate on.
 */
export type KernelContext<
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
export type KernelCellContext<
  Notebook,
  Cell extends NotebookCell<Notebook, NotebookShapeCell<Notebook>>,
> =
  & KernelContext<Notebook, Cell>
  & {
    readonly current: Cell;
    readonly previous?: KernelCellContext<Notebook, Cell>;
    readonly next?: Cell;
    readonly index: number;
  };

export type KernelEvents<
  Notebook,
  Cell extends NotebookCell<Notebook, NotebookShapeCell<Notebook>>,
  KernelCtx extends KernelContext<Notebook, Cell>,
  KernelCellCtx extends KernelCellContext<Notebook, Cell>,
> = {
  readonly initNotebook: (
    ctx: KernelCtx,
  ) => void | false | Promise<void | false>;
  readonly beforeCell: <
    ShapeCell extends string & NotebookShapeCell<Notebook>,
  >(
    cellID: `${ShapeCell}`,
    ctx:
      & KernelCellCtx
      & KernelRunStateSupplier<
        Notebook,
        Cell,
        Any,
        KernelCtx,
        KernelCellCtx
      >,
  ) => void | "interrupt" | Promise<void | "interrupt">;
  readonly afterInterrupt: <
    ShapeCell extends string & NotebookShapeCell<Notebook>,
  >(
    cellID: `${ShapeCell}`,
    ctx:
      & KernelCellCtx
      & KernelRunStateSupplier<
        Notebook,
        Cell,
        Any,
        KernelCtx,
        KernelCellCtx
      >,
  ) => void | Promise<void>;
  readonly afterError: <
    ShapeCell extends string & NotebookShapeCell<Notebook>,
  >(
    cellID: `${ShapeCell}`,
    error: Error,
    ctx:
      & KernelCellCtx
      & KernelRunStateSupplier<
        Notebook,
        Cell,
        Any,
        KernelCtx,
        KernelCellCtx
      >,
  ) => void | "continue" | "abort" | Promise<void | "continue" | "abort">;
  readonly afterCell: <
    ShapeCell extends string & NotebookShapeCell<Notebook>,
    Result,
  >(
    cellID: `${ShapeCell}`,
    result: KernelRunCellState<
      Notebook,
      Cell,
      Result,
      KernelCtx,
      KernelCellCtx
    >,
    ctx:
      & KernelCellCtx
      & KernelRunStateSupplier<
        Notebook,
        Cell,
        Result,
        KernelCtx,
        KernelCellCtx
      >,
  ) => void | Promise<void>;
  readonly finalizeNotebook: (
    ctx:
      & KernelCtx
      & KernelRunStateSupplier<
        Notebook,
        Cell,
        Any,
        KernelCtx,
        KernelCellCtx
      >,
  ) => void | Promise<void>;
};

export interface KernelOptions<
  Notebook,
  Cell extends NotebookCell<Notebook, NotebookShapeCell<Notebook>>,
  KernelCtx extends KernelContext<Notebook, Cell>,
  KernelCellCtx extends KernelCellContext<Notebook, Cell>,
> {
  readonly prepareNotebookCtx?: (
    suggested: KernelContext<Notebook, Cell>,
  ) => KernelCtx;
  readonly prepareCellCtx?: (
    suggested: KernelCellContext<Notebook, Cell>,
  ) => KernelCellCtx;
  readonly eventEmitter?: KernelEvents<
    Notebook,
    Cell,
    KernelCtx,
    KernelCellCtx
  >;
}

export type KernelRunCellState<
  Notebook,
  Cell extends NotebookCell<Notebook, NotebookShapeCell<Notebook>>,
  ExecResult,
  NotebookContext extends KernelContext<Notebook, Cell>,
  CellContext extends KernelCellContext<Notebook, Cell>,
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
  Cell extends NotebookCell<Notebook, NotebookShapeCell<Notebook>>,
  ExecResult,
  KernelCtx extends KernelContext<Notebook, Cell>,
  KernelCellCtx extends KernelCellContext<Notebook, Cell>,
> {
  readonly descriptor: NotebookDescriptor<Notebook, Cell>;
  readonly prepareNotebookCtx: (
    suggested: KernelContext<Notebook, Cell>,
  ) => KernelCtx;
  readonly prepareCellCtx: (
    suggested: KernelCellContext<Notebook, Cell>,
  ) => KernelCellCtx;
  readonly callArgs:
    ((cellCtx: KernelCellCtx, prevExecResult: ExecResult) => Array<Any>)[];
  readonly eventEmitter: KernelEvents<
    Notebook,
    Cell,
    KernelCtx,
    KernelCellCtx
  >;
  readonly cellsExecuted: KernelRunCellState<
    Notebook,
    Cell,
    ExecResult,
    KernelCtx,
    KernelCellCtx
  >[];
  readonly cellResult: (
    cellState: KernelRunCellState<
      Notebook,
      Cell,
      ExecResult,
      KernelCtx,
      KernelCellCtx
    >,
  ) => Error | ExecResult;
  interruptedAtCell: KernelCellCtx | undefined;
  erroredOutAtCell: KernelCellCtx | undefined;
}

export interface KernelRunStateSupplier<
  Notebook,
  Cell extends NotebookCell<Notebook, NotebookShapeCell<Notebook>>,
  PreviousResult,
  NotebookContext extends KernelContext<Notebook, Cell>,
  CellContext extends KernelCellContext<Notebook, Cell>,
> {
  readonly kernelRunState: () => KernelRunState<
    Notebook,
    Cell,
    PreviousResult,
    NotebookContext,
    CellContext
  >;
}

export interface Kernel<Notebook> {
  readonly isValid: () => Promise<boolean>;
  readonly run: (instance: Notebook) => Promise<void>;
}
