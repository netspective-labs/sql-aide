import { zod as z } from "../deps.ts";
import { testingAsserts as ta } from "../deps-test.ts";
import { unindentWhitespace as uws } from "../lib/universal/whitespace.ts";
import * as SQLa from "../render/mod.ts";
import * as mod from "./enum-table.ts";

const expectType = <T>(_value: T) => {
  // Do nothing, the TypeScript compiler handles this for us
};

Deno.test("SQL Aide (SQLa) numeric enum table", async (tc) => {
  // code is text, value is a number
  enum syntheticEnum1 {
    code0,
    code1,
  }

  const numericEnumModel = mod.ordinalEnumTable(
    "synthetic_enum_numeric",
    syntheticEnum1,
  );

  const ctx = SQLa.typicalSqlEmitContext();

  await tc.step("table definition", () => {
    ta.assert(SQLa.isTableDefinition(numericEnumModel));
    ta.assert(mod.isEnumTableDefn(numericEnumModel));
    ta.assert(numericEnumModel);
    ta.assertEquals("synthetic_enum_numeric", numericEnumModel.tableName);
    ta.assert(numericEnumModel.domains.length == 3);
    ta.assertEquals(
      ["code", "value", "created_at"],
      numericEnumModel.domains.map((cd) => cd.identity),
    );
  });

  await tc.step("table creation SQL", () => {
    ta.assertEquals(
      numericEnumModel.SQL(ctx),
      uws(`
        CREATE TABLE "synthetic_enum_numeric" (
            "code" INTEGER PRIMARY KEY NOT NULL,
            "value" TEXT NOT NULL,
            "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`),
    );
  });

  await tc.step("DML type-safety", () => {
    const row = numericEnumModel.prepareInsertable({
      code: syntheticEnum1.code0,
      value: "code0",
    });
    expectType<number | SQLa.SqlTextSupplier<SQLa.SqlEmitContext>>(row.code); // should see compile error if this doesn't work
    expectType<"code0" | "code1" | SQLa.SqlTextSupplier<SQLa.SqlEmitContext>>(
      row.value,
    ); // should see compile error if this doesn't work
  });

  await tc.step("typed Typescript objects", () => {
    type Synthetic = z.infer<typeof numericEnumModel.zoSchema>;
    const synthetic: Synthetic = {
      code: syntheticEnum1.code1,
      value: "code1",
    };
    expectType<Synthetic>(synthetic);
    expectType<syntheticEnum1>(synthetic.code);
    expectType<"code0" | "code1">(synthetic.value);
  });

  // deno-fmt-ignore
  await tc.step("seed DML row values", () => {
    const { seedDML, seedRows } = numericEnumModel;
    ta.assert(Array.isArray(seedDML));
    ta.assertEquals(2, seedDML.length);

    expectType<syntheticEnum1>(seedRows[0].code);
    expectType<"code0" | "code1">(seedRows[0].value);

    ta.assertEquals(`INSERT INTO "synthetic_enum_numeric" ("code", "value") VALUES (0, 'code0')`, seedDML[0].SQL(ctx));
    ta.assertEquals(`INSERT INTO "synthetic_enum_numeric" ("code", "value") VALUES (1, 'code1')`, seedDML[1].SQL(ctx));
  });
});

Deno.test("SQL Aide (SQLa) text enum table", async (tc) => {
  // code is text, value is text
  enum syntheticEnum2 {
    code1 = "value1",
    code2 = "value2",
    code3 = "value3",
  }

  const textEnumModel = mod.textEnumTable(
    "synthetic_enum_text",
    syntheticEnum2,
  );

  const ctx = SQLa.typicalSqlEmitContext();

  await tc.step("table definition", () => {
    ta.assert(SQLa.isTableDefinition(textEnumModel));
    ta.assert(mod.isEnumTableDefn(textEnumModel));
    ta.assert(textEnumModel);
    ta.assertEquals("synthetic_enum_text", textEnumModel.tableName);
    ta.assert(textEnumModel.domains.length == 3);
    ta.assertEquals(
      ["code", "value", "created_at"],
      textEnumModel.domains.map((cd) => cd.identity),
    );
  });

  await tc.step("table creation SQL", () => {
    ta.assertEquals(
      textEnumModel.SQL(ctx),
      uws(`
        CREATE TABLE "synthetic_enum_text" (
            "code" TEXT PRIMARY KEY NOT NULL,
            "value" TEXT NOT NULL,
            "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`),
    );
  });

  await tc.step("DML type-safety", () => {
    const row = textEnumModel.prepareInsertable({
      code: "code1", // TODO: try "codeBad" bad
      value: syntheticEnum2.code1,
    });
    expectType<
      "code1" | "code2" | "code3" | SQLa.SqlTextSupplier<SQLa.SqlEmitContext>
    >(row.code); // should see compile error if this doesn't work
    expectType<syntheticEnum2 | SQLa.SqlTextSupplier<SQLa.SqlEmitContext>>(
      row.value,
    ); // should see compile error if this doesn't work
  });

  await tc.step("typed Typescript objects", () => {
    type Synthetic = z.infer<typeof textEnumModel.zoSchema>;
    const synthetic: Synthetic = {
      code: "code1",
      value: syntheticEnum2.code1,
      created_at: new Date(),
    };
    expectType<Synthetic>(synthetic);
    expectType<"code1" | "code2" | "code3">(synthetic.code);
    expectType<syntheticEnum2>(synthetic.value);
  });

  // deno-fmt-ignore
  await tc.step("seed DML row values", () => {
    const { seedDML, seedRows } = textEnumModel;
    ta.assert(Array.isArray(seedDML));
    ta.assertEquals(3, seedDML.length);

    expectType<"code1" | "code2" | "code3">(seedRows[0].code);
    expectType<syntheticEnum2>(seedRows[0].value);

    ta.assertEquals(`INSERT INTO "synthetic_enum_text" ("code", "value") VALUES ('code1', 'value1')`, seedDML[0].SQL(ctx));
    ta.assertEquals(`INSERT INTO "synthetic_enum_text" ("code", "value") VALUES ('code2', 'value2')`, seedDML[1].SQL(ctx));
    ta.assertEquals(`INSERT INTO "synthetic_enum_text" ("code", "value") VALUES ('code3', 'value3')`, seedDML[2].SQL(ctx));
  });
});
