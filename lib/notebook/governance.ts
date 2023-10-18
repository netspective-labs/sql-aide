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
