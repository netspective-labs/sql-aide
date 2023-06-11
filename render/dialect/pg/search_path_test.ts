import { testingAsserts as ta } from "../../deps-test.ts";
import * as mod from "./search_path.ts";
import * as sch from "../../ddl/schema.ts";
import * as emit from "../../emit/mod.ts";

type SchemaName = "synthetic_schema1" | "synthetic_schema2";

Deno.test("SQL Aide (SQLa) schema", async (tc) => {
  const ctx = emit.typicalSqlEmitContext({
    sqlDialect: emit.postgreSqlDialect(),
  });

  await tc.step("PostgreSQL schema search path declaration", () => {
    const schema1 = sch.sqlSchemaDefn<SchemaName, emit.SqlEmitContext>(
      "synthetic_schema1",
    );
    const schema2 = sch.sqlSchemaDefn<SchemaName, emit.SqlEmitContext>(
      "synthetic_schema2",
    );

    const searchPath = mod.pgSearchPath<SchemaName, emit.SqlEmitContext>(
      schema1,
      schema2,
    );
    ta.assertEquals(
      searchPath.SQL(ctx),
      `SET search_path TO "synthetic_schema1", "synthetic_schema2"`,
    );
  });
});
