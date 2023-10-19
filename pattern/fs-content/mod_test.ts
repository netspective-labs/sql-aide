import { testingAsserts as ta } from "../../deps-test.ts";
import * as ft from "../../lib/universal/flexible-text.ts";
import * as sh from "../../lib/sqlite/shell.ts";
import * as SQLa from "../../render/mod.ts";
import * as mod from "./mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

class SqliteError extends Error {
  constructor(readonly sql: ft.FlexibleTextSupplierSync, message: string) {
    super(message);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SqliteError);
    }

    this.name = "SqliteError";
  }
}

async function execDbQueryResult<Shape>(
  sql: ft.FlexibleTextSupplierSync,
  sqliteDb?: string,
) {
  let sqliteErr: SqliteError | undefined = undefined;
  const scaj = await sh.sqliteCmdAsJSON<Shape>(
    sqliteDb ?? ":memory:",
    sql,
    {
      onError: (escResult) => {
        sqliteErr = new SqliteError(sql, escResult?.stderr());
        return undefined;
      },
    },
  );
  return sqliteErr ?? scaj;
}

export const sqlPkgExtnLoadSqlSupplier = (
  extnIdentity: string,
): SQLa.SqlTextBehaviorSupplier<Any> => {
  const sqlPkgHome = Deno.env.has("SQLPKG_HOME")
    ? Deno.env.get("SQLPKG_HOME")
    : `${Deno.env.get("HOME")}/.sqlpkg`;
  return {
    executeSqlBehavior: () => {
      return {
        SQL: () => `.load ${sqlPkgHome}/${extnIdentity}`,
      };
    },
  };
};

Deno.test("migration notebooks", async () => {
  const ctx = SQLa.typicalSqlEmitContext();
  const nbh = new mod.NotebookHelpers({
    loadExtnSQL: sqlPkgExtnLoadSqlSupplier,
    execDbQueryResult,
  });
  const f = SQLa.sqlNotebookFactory(
    mod.ConstructionNotebook.prototype,
    () => new mod.ConstructionNotebook<typeof ctx>(nbh, []),
  );
  // deno-fmt-ignore
  const sql = nbh.SQL`
    ${(await f.SQL({
        separator: (cell) => ({
            executeSqlBehavior: () => ({ SQL: () => `\n---\n--- Cell: ${cell}\n---\n` }),
        }),
        }, "initialDDL", "fsContentWalkSessionStatsViewDDL", "mimeTypesSeedDML"))}
  `.SQL(ctx);
  const edbqr = await execDbQueryResult(sql);
  if (edbqr instanceof SqliteError) {
    ta.assertNotInstanceOf(
      edbqr,
      SqliteError,
      edbqr.message,
    );
  }
});
