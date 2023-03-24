import { zod as z } from "../deps.ts";
import { testingAsserts as ta } from "../deps-test.ts";
import { unindentWhitespace as uws } from "../lib/universal/whitespace.ts";
import * as mod from "./type.ts";
import * as emit from "../emit/mod.ts";
import * as sch from "./schema.ts";

Deno.test("SQL Aide (SQLa) types", async (tc) => {
  const ctx = emit.typicalSqlEmitContext();

  await tc.step("create SQL type", () => {
    const type = mod.sqlTypeDefinition("synthetic_type", {
      text: z.string(),
      int: z.number(),
    });
    ta.assertEquals(
      type.SQL(ctx),
      uws(`
         CREATE TYPE "synthetic_type" AS (
             "text" TEXT,
             "int" INTEGER
         )`),
    );
  });

  await tc.step("create namspaced SQL type", () => {
    const type = mod.sqlTypeDefinition("synthetic_type", {
      text: z.string(),
      int: z.number(),
    }, {
      embeddedStsOptions: emit.typicalSqlTextSupplierOptions(),
      sqlNS: sch.sqlSchemaDefn("synthetic_schema"),
    });
    ta.assertEquals(
      type.SQL(ctx),
      uws(`
         CREATE TYPE "synthetic_schema"."synthetic_type" AS (
             "text" TEXT,
             "int" INTEGER
         )`),
    );
  });

  await tc.step("drop first then create then drop", () => {
    const type = mod.sqlTypeDefinition("synthetic_type", {
      text: z.string(),
      int: z.number(),
    }, {
      embeddedStsOptions: emit.typicalSqlTextSupplierOptions(),
      before: (typeName) => mod.dropType(typeName),
    });
    ta.assertEquals(
      type.SQL(ctx),
      uws(`
         DROP TYPE IF EXISTS "synthetic_type";
         CREATE TYPE "synthetic_type" AS (
             "text" TEXT,
             "int" INTEGER
         )`),
    );

    ta.assertEquals(
      type.drop().SQL(ctx),
      `DROP TYPE IF EXISTS "synthetic_type"`,
    );
    ta.assertEquals(
      type.drop({ ifExists: false }).SQL(ctx),
      `DROP TYPE "synthetic_type"`,
    );
  });
});
