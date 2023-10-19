import { testingAsserts as ta } from "../deps-test.ts";
import * as whs from "../../lib/universal/whitespace.ts";
import * as s from "./sql.ts";
import * as mod from "./notebook.ts";

class SqlNotebook<Context extends s.SqlEmitContext = s.SqlEmitContext>
  extends mod.SqlNotebook<Context> {
  constructor(
    readonly stsOptions: s.SqlTextSupplierOptions<Context> = s
      .typicalSqlTextSupplierOptions(),
  ) {
    super();
  }

  init() {
    return s.SQL<Context>(this.stsOptions)`
      -- pretend this is SQL: initialization DDL
      `;
  }

  statements1() {
    return s.SQL<Context>(this.stsOptions)`
      -- pretend this is SQL: statements 1
      `;
  }

  // deno-lint-ignore require-await
  async statements2() {
    return s.SQL<Context>(this.stsOptions)`
      -- pretend this is SQL: async statements 2
      `;
  }

  statements3() {
    const sts: s.SqlTextSupplier<Context> = {
      SQL: () =>
        whs.unindentWhitespace(`
          -- pretend this is SQL: statements 3
          `),
    };
    return sts;
  }

  final() {
    return s.SQL<Context>(this.stsOptions)`
      -- pretend this is SQL: finalizing DDL
      `;
  }
}

Deno.test("SQL notebook", async (tc) => {
  const ctx = s.typicalSqlEmitContext();
  const stsOptions = s.typicalSqlTextSupplierOptions();
  const f = mod.sqlNotebookFactory(
    SqlNotebook.prototype,
    () => new SqlNotebook(),
  );

  await tc.step("specific", async () => {
    const SQL = await f.SQL(
      {
        separator: (cell) => ({
          executeSqlBehavior: () => ({ SQL: () => `-- separator: ${cell}` }),
        }),
      },
      "statements3",
      "statements1",
      "statements2",
    );
    ta.assertEquals(SQL.map((sql) => s.SQL(stsOptions)`${sql}`.SQL(ctx)), [
      "-- separator: statements3",
      "-- pretend this is SQL: statements 3\n;",
      "-- separator: statements1",
      "-- pretend this is SQL: statements 1\n;",
      "-- separator: statements2",
      "-- pretend this is SQL: async statements 2\n;",
    ]);
  });

  await tc.step("all", async () => {
    const SQL = await f.SQL(
      {
        separator: (cell) => ({
          executeSqlBehavior: () => ({ SQL: () => `-- separator: ${cell}` }),
        }),
      },
    );
    ta.assertEquals(SQL.map((sql) => s.SQL(stsOptions)`${sql}`.SQL(ctx)), [
      "-- separator: init",
      "-- pretend this is SQL: initialization DDL\n;",
      "-- separator: statements1",
      "-- pretend this is SQL: statements 1\n;",
      "-- separator: statements2",
      "-- pretend this is SQL: async statements 2\n;",
      "-- separator: statements3",
      "-- pretend this is SQL: statements 3\n;",
      "-- separator: final",
      "-- pretend this is SQL: finalizing DDL\n;",
    ]);
  });
});
