import * as nb from "../../lib/notebook/mod.ts";
import * as s from "./sql.ts";

export abstract class SqlNotebook<Context extends s.SqlEmitContext> {
}

export function sqlNotebookAnnotations<
  Notebook extends SqlNotebook<Context>,
  Context extends s.SqlEmitContext,
>() {
  return new nb.NotebookDescriptor<
    Notebook,
    nb.NotebookCell<Notebook, nb.NotebookShapeCell<Notebook>>
  >();
}

export function sqlNotebookFactory<
  Notebook extends SqlNotebook<Context>,
  Context extends s.SqlEmitContext,
>(
  prototype: Notebook,
  instance: () => Notebook,
  nbd = sqlNotebookAnnotations<Notebook, Context>(),
) {
  type ShapeCell = nb.NotebookShapeCell<Notebook>;
  const kernel = nb.ObservableKernel.create(prototype, nbd);

  type EventEmitter = Awaited<
    ReturnType<typeof kernel.initRunState>
  >["runState"]["eventEmitter"];
  return {
    nbd,
    kernel,
    SQL: async (
      options: {
        separator?: (
          cell: Parameters<EventEmitter["afterCell"]>[0],
          state: Parameters<EventEmitter["afterCell"]>[1],
        ) => s.SqlTextBehaviorSupplier<Context>;
        onNotSqlTextSupplier?: (
          cell: Parameters<EventEmitter["afterCell"]>[0],
          state: Parameters<EventEmitter["afterCell"]>[1],
        ) => s.SqlTextBehaviorSupplier<Context>;
      },
      ...sqlIdentities: ShapeCell[]
    ) => {
      // prepare the run state with either a list of sql identities if passed
      // or all cells if no specific cells requested
      const initRunState = await kernel.initRunState({
        executeCells: (inb) => {
          if (sqlIdentities.length == 0) return inb.cells;
          const specific = sqlIdentities.map((si) =>
            inb.cells.find((c) => c.nbShapeCell == si)
          ).filter((c) => c != undefined) as typeof inb.cells;
          if (specific.length > 0) return specific;
          return inb.cells;
        },
      });

      const SQL:
        (s.SqlTextSupplier<Context> | s.SqlTextBehaviorSupplier<Context>)[] =
          [];
      initRunState.runState.eventEmitter.afterCell = (cell, state) => {
        if (state.status == "successful") {
          if (
            s.isSqlTextSupplier<Context>(state.execResult) ||
            s.isSqlTextBehaviorSupplier<Context>(state.execResult)
          ) {
            if (options.separator) SQL.push(options.separator(cell, state));
            const sts = state.execResult as s.SqlTextSupplier<Context>;
            SQL.push(sts);
          } else {
            const notSTS = options.onNotSqlTextSupplier?.(cell, state);
            if (notSTS) SQL.push(notSTS);
          }
        }
      };
      await kernel.run(instance(), initRunState);
      return SQL;
    },
  };
}
