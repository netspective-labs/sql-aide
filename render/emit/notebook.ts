import * as chainNB from "../../lib/notebook/chain-of-responsibility.ts";
import * as cmdNB from "../../lib/notebook/command.ts";
import * as s from "./sql.ts";

/**
 * Represents a set of SQL in a command pipeline. Instances of
 * `RenderSqlCommandCell` carry SqlTextSupplier content, transform it to text,
 * pipe it to other content cells or commands.
 *
 * TODO: probably makes more sense to use SqlPartialExpression instead of
 * SqlTextSupplier and then we can just call s.SQL<Context>([], ...exprs)
 * for most flexiblity
 */
export class RenderSqlCommand<Context extends s.SqlEmitContext> {
  #sqlTextSuppliers: s.SqlTextSupplier<Context>[] = [];
  #pipeInSuppliers?: cmdNB.PipeInWriterSupplier<Uint8Array>[];

  constructor(
    readonly render: (sts: s.SqlTextSupplier<Context>) => string,
    readonly options?: {
      readonly identity?: string;
      readonly SQL?: s.SqlTextSupplier<Context>[];
    },
  ) {
    if (options?.SQL) this.SQL(...options.SQL);
  }

  SQL(...content: s.SqlTextSupplier<Context>[]) {
    this.#sqlTextSuppliers.push(...content);
    return this;
  }

  pipeIn(stdInSupplier: cmdNB.PipeInWriterSupplier<Uint8Array>) {
    if (this.#pipeInSuppliers === undefined) this.#pipeInSuppliers = [];
    this.#pipeInSuppliers.push(stdInSupplier);
    return this;
  }

  pipe<NextAction extends cmdNB.PipeInSupplier<NextAction>>(
    action: NextAction,
  ) {
    const sis = cmdNB.stdinSupplierFactory(
      this.#sqlTextSuppliers.map((sts) => this.render(sts)),
      {
        identity: this.options?.identity,
        pipeInSuppliers: this.#pipeInSuppliers,
      },
    );
    return action.pipeIn(sis);
  }

  static renderSQL<Context extends s.SqlEmitContext>(
    render: ConstructorParameters<typeof RenderSqlCommand<Context>>[0],
    options?: ConstructorParameters<typeof RenderSqlCommand<Context>>[1],
  ) {
    return new RenderSqlCommand(render, options);
  }
}

/**
 * Chain-of-Responsiblity style notebook base class
 */
export abstract class SqlNotebook<Context extends s.SqlEmitContext> {
}

export function sqlNotebookAnnotations<
  Notebook extends SqlNotebook<Context>,
  Context extends s.SqlEmitContext,
>() {
  return new chainNB.NotebookDescriptor<
    Notebook,
    chainNB.NotebookCell<Notebook, chainNB.NotebookCellID<Notebook>>
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
  type CellID = chainNB.NotebookCellID<Notebook>;
  const kernel = chainNB.ObservableKernel.create(prototype, nbd);

  type EventEmitter = Awaited<
    ReturnType<typeof kernel.initRunState>
  >["runState"]["eventEmitter"];
  return {
    nbd,
    kernel,
    instance,
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
      ...sqlIdentities: CellID[]
    ) => {
      // prepare the run state with either a list of sql identities if passed
      // or all cells if no specific cells requested
      const initRunState = await kernel.initRunState({
        executeCells: (inb) => {
          if (sqlIdentities.length == 0) return inb.cells;
          const specific = sqlIdentities.map((si) =>
            inb.cells.find((c) => c.nbCellID == si)
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
