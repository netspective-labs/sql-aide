import { testingAsserts as ta } from "../deps-test.ts";
import * as mod from "./schema.ts";
import * as emit from "../emit/mod.ts";

Deno.test("SQL Aide (SQLa) schema", async (tc) => {
  const ctx = emit.typicalSqlEmitContext();

  await tc.step("idempotent schema declaration", () => {
    const view = mod.sqlSchemaDefn("synthetic_schema1", {
      isIdempotent: true,
    });
    ta.assertEquals(
      view.SQL(ctx),
      `CREATE SCHEMA IF NOT EXISTS "synthetic_schema1"`,
    );
  });

  await tc.step("schema declaration (non-idempotent)", () => {
    const view = mod.sqlSchemaDefn("synthetic_schema2");
    ta.assertEquals(
      view.SQL(ctx),
      `CREATE SCHEMA "synthetic_schema2"`,
    );
  });
});
