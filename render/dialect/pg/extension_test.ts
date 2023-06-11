import { testingAsserts as ta } from "../../deps-test.ts";
import * as mod from "./extension.ts";
import * as sch from "../../ddl/schema.ts";
import * as emit from "../../emit/mod.ts";

Deno.test("SQL Aide (SQLa) PostgreSQL extension", async (tc) => {
  const ctx = emit.typicalSqlEmitContext({
    sqlDialect: emit.postgreSqlDialect(),
  });

  await tc.step("idempotent extension declaration", () => {
    const extn = mod.pgExtensionDefn(
      sch.sqlSchemaDefn("synthetic_schema"),
      "synthetic_extension",
    );
    ta.assertEquals(
      extn.SQL(ctx),
      `CREATE EXTENSION IF NOT EXISTS synthetic_extension SCHEMA "synthetic_schema"`,
    );
  });

  await tc.step("non-idempotent extension declaration", () => {
    const extn = mod.pgExtensionDefn(
      sch.sqlSchemaDefn("synthetic_schema"),
      "synthetic_extension",
      { isIdempotent: false },
    );
    ta.assertEquals(
      extn.SQL(ctx),
      `CREATE EXTENSION synthetic_extension SCHEMA "synthetic_schema"`,
    );
  });

  await tc.step("TODO drop extension", () => {
  });
});
