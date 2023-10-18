import * as g from "../universal/graph.ts";
import { NotebookCell, NotebookShapeCell } from "./governance.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

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
