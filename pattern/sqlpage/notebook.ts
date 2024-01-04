import { zod as z } from "../../deps.ts";
import * as chainNB from "../../lib/notebook/chain-of-responsibility.ts";
import * as SQLa from "../../render/mod.ts";
import * as c from "./component.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export function sqlPageNotebook<
  SQLPageNotebook,
  EmitContext extends SQLa.SqlEmitContext,
>(
  prototype: SQLPageNotebook,
  instanceSupplier: () => SQLPageNotebook,
  ctxSupplier: () => EmitContext,
  nbDescr: chainNB.NotebookDescriptor<
    SQLPageNotebook,
    chainNB.NotebookCell<
      SQLPageNotebook,
      chainNB.NotebookCellID<SQLPageNotebook>
    >
  >,
) {
  const kernel = chainNB.ObservableKernel.create(prototype, nbDescr);
  const instance = instanceSupplier();
  const pkcf = SQLa.primaryKeyColumnFactory<
    EmitContext,
    SQLa.SqlDomainQS
  >();
  const sqlPageFiles = SQLa.tableDefinition("sqlpage_files", {
    path: pkcf.primaryKey(z.string()),
    contents: z.string(),
    last_modified: z.date().default(new Date()).optional(),
  }, {
    isIdempotent: true,
    qualitySystem: {
      description: c.markdown`
            [SQLPage](https://sql.ophir.dev/) app server content`,
    },
  });
  const sqlPageFilesCRF = SQLa.tableColumnsRowFactory<
    typeof sqlPageFiles.tableName,
    typeof sqlPageFiles.zoSchema.shape,
    EmitContext,
    SQLa.SqlDomainQS,
    SQLa.SqlDomainsQS<SQLa.SqlDomainQS>
  >(
    sqlPageFiles.tableName,
    sqlPageFiles.zoSchema.shape,
  );

  const sqlCells = async () => {
    const irs = await kernel.initRunState();
    const ctx = ctxSupplier();
    const sqlEngineNow = { SQL: () => `CURRENT_TIMESTAMP` };
    const notebookSQL: SQLa.SqlTextSupplier<EmitContext>[] = [sqlPageFiles];
    irs.runState.eventEmitter.afterCell = (cell, state) => {
      if (state.status == "successful") {
        notebookSQL.push(sqlPageFilesCRF.insertDML({
          path: cell, // the class's method name is the "cell"
          // deno-fmt-ignore
          contents: SQLa.isSqlTextSupplier<EmitContext>(state.execResult)
                ? state.execResult.SQL(ctx)
                : `select 'alert' as component,
                              'sqlPageNotebook issue' as title,
                              'sqlPageNotebook cell "${cell}" did not return SQL (found: ${typeof state.execResult})' as description;`,
          last_modified: sqlEngineNow,
        }, {
          onConflict: {
            SQL: () =>
              `ON CONFLICT(path) DO UPDATE SET contents = EXCLUDED.contents /* TODO: does not work in DuckDB , last_modified = (CURRENT_TIMESTAMP) */`,
          },
        }));
      }
    };

    await kernel.run(instance, irs);
    return notebookSQL;
  };

  return {
    kernel,
    instance,
    table: sqlPageFiles,
    tableCRF: sqlPageFilesCRF,
    sqlCells,
    SQL: async (ctx: EmitContext) =>
      (await sqlCells()).map((c) => c.SQL(ctx)).join(";\n\n"),
  };
}
