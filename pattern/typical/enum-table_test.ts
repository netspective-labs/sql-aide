import { zod as z } from "../../deps.ts";
import { testingAsserts as ta } from "../../deps-test.ts";
import { unindentWhitespace as uws } from "../../lib/universal/whitespace.ts";
import * as SQLa from "../../render/mod.ts";
import * as mod from "./enum-table.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

const expectType = <T>(_value: T) => {
  // Do nothing, the TypeScript compiler handles this for us
};

enum SyntheticEnumNumeric {
  code0,
  code1,
}

const numericEnumModel = mod.ordinalEnumTable(
  "synthetic_enum_numeric",
  SyntheticEnumNumeric,
);

// code is text, value is text
enum SyntheticEnumText {
  code1 = "value1",
  code2 = "value2",
  code3 = "value3",
}

const textEnumModel = mod.textEnumTable(
  "synthetic_enum_text",
  SyntheticEnumText,
);

const varCharEnumModel = mod.varCharEnumTable(
  "synthetic_enum_varchar",
  SyntheticEnumText,
  87,
);

Deno.test("SQL Aide (SQLa) numeric enum table", async (tc) => {
  // code is text, value is a number
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
      code: SyntheticEnumNumeric.code0,
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
      code: SyntheticEnumNumeric.code1,
      value: "code1",
    };
    expectType<Synthetic>(synthetic);
    expectType<SyntheticEnumNumeric>(synthetic.code);
    expectType<"code0" | "code1">(synthetic.value);
  });

  // deno-fmt-ignore
  await tc.step("seed DML row values", () => {
    const { seedDML, seedRows } = numericEnumModel;
    ta.assert(Array.isArray(seedDML));
    ta.assertEquals(2, seedDML.length);

    expectType<SyntheticEnumNumeric>(seedRows[0].code);
    expectType<"code0" | "code1">(seedRows[0].value);

    ta.assertEquals(`INSERT INTO "synthetic_enum_numeric" ("code", "value") VALUES (0, 'code0')`, seedDML[0].SQL(ctx));
    ta.assertEquals(`INSERT INTO "synthetic_enum_numeric" ("code", "value") VALUES (1, 'code1')`, seedDML[1].SQL(ctx));
  });

  await tc.step("insert enum values into table rows", () => {
    const tcf = SQLa.tableColumnFactory<Any, Any>();
    const keys = SQLa.primaryKeyColumnFactory();

    const synthetic = SQLa.tableDefinition("synthetic_table", {
      synthetic_table_id: keys.autoIncPrimaryKey(),
      text: tcf.unique(z.string()),
      ord_enum_id: numericEnumModel.references.code(),
      text_enum_code: textEnumModel.references.code(),
      varchar_enum_code: varCharEnumModel.references.code(),
    });

    ta.assertEquals(
      uws(`
        CREATE TABLE "synthetic_table" (
            "synthetic_table_id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "text" TEXT /* UNIQUE COLUMN */ NOT NULL,
            "ord_enum_id" INTEGER NOT NULL,
            "text_enum_code" TEXT NOT NULL,
            "varchar_enum_code" TEXT NOT NULL,
            FOREIGN KEY("ord_enum_id") REFERENCES "synthetic_enum_numeric"("code"),
            FOREIGN KEY("text_enum_code") REFERENCES "synthetic_enum_text"("code"),
            FOREIGN KEY("varchar_enum_code") REFERENCES "synthetic_enum_varchar"("code"),
            UNIQUE("text")
        )`),
      synthetic.SQL(ctx),
    );

    const syntheticRF = SQLa.tableColumnsRowFactory(
      synthetic.tableName,
      synthetic.zoSchema.shape,
    );

    ta.assertEquals(
      `INSERT INTO "synthetic_table" ("text", "ord_enum_id", "text_enum_code", "varchar_enum_code") VALUES ('text', 0, 'code1', 'code1')`,
      syntheticRF.insertDML({
        text: "text",
        ord_enum_id: numericEnumModel.seedEnum.code0,
        text_enum_code: "code1",
        varchar_enum_code: "code1",
      }).SQL(ctx),
    );
  });
});

Deno.test("SQL Aide (SQLa) text enum table", async (tc) => {
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
      value: SyntheticEnumText.code1,
    });
    expectType<
      "code1" | "code2" | "code3" | SQLa.SqlTextSupplier<SQLa.SqlEmitContext>
    >(row.code); // should see compile error if this doesn't work
    expectType<SyntheticEnumText | SQLa.SqlTextSupplier<SQLa.SqlEmitContext>>(
      row.value,
    ); // should see compile error if this doesn't work
  });

  await tc.step("typed Typescript objects", () => {
    type Synthetic = z.infer<typeof textEnumModel.zoSchema>;
    const synthetic: Synthetic = {
      code: "code1",
      value: SyntheticEnumText.code1,
      created_at: new Date(),
    };
    expectType<Synthetic>(synthetic);
    expectType<"code1" | "code2" | "code3">(synthetic.code);
    expectType<SyntheticEnumText>(synthetic.value);
  });

  // deno-fmt-ignore
  await tc.step("seed DML row values", () => {
    const { seedDML, seedRows } = textEnumModel;
    ta.assert(Array.isArray(seedDML));
    ta.assertEquals(3, seedDML.length);

    expectType<"code1" | "code2" | "code3">(seedRows[0].code);
    expectType<SyntheticEnumText>(seedRows[0].value);

    ta.assertEquals(`INSERT INTO "synthetic_enum_text" ("code", "value") VALUES ('code1', 'value1')`, seedDML[0].SQL(ctx));
    ta.assertEquals(`INSERT INTO "synthetic_enum_text" ("code", "value") VALUES ('code2', 'value2')`, seedDML[1].SQL(ctx));
    ta.assertEquals(`INSERT INTO "synthetic_enum_text" ("code", "value") VALUES ('code3', 'value3')`, seedDML[2].SQL(ctx));
  });

  await tc.step("insert enum values into table rows", () => {
    const tcf = SQLa.tableColumnFactory<Any, Any>();
    const keys = SQLa.primaryKeyColumnFactory();

    const synthetic = SQLa.tableDefinition("synthetic_table", {
      synthetic_table_id: keys.primaryKey(z.string()),
      text: tcf.unique(z.string()),
      text_enum_code: textEnumModel.references.code(),
    });

    ta.assertEquals(
      uws(`
        CREATE TABLE "synthetic_table" (
            "synthetic_table_id" TEXT PRIMARY KEY NOT NULL,
            "text" TEXT /* UNIQUE COLUMN */ NOT NULL,
            "text_enum_code" TEXT NOT NULL,
            FOREIGN KEY("text_enum_code") REFERENCES "synthetic_enum_text"("code"),
            UNIQUE("text")
        )`),
      synthetic.SQL(ctx),
    );

    const syntheticRF = SQLa.tableColumnsRowFactory(
      synthetic.tableName,
      synthetic.zoSchema.shape,
    );

    ta.assertEquals(
      `INSERT INTO "synthetic_table" ("synthetic_table_id", "text", "text_enum_code") VALUES ('synthetic01', 'text', 'code1')`,
      syntheticRF.insertDML({
        synthetic_table_id: "synthetic01",
        text: "text",
        text_enum_code: "code1",
      }).SQL(ctx),
    );
  });
});

Deno.test("SQL Aide (SQLa) varchar enum table", async (tc) => {
  const ctx = SQLa.typicalSqlEmitContext();

  await tc.step("table definition", () => {
    ta.assert(SQLa.isTableDefinition(varCharEnumModel));
    ta.assert(mod.isEnumTableDefn(varCharEnumModel));
    ta.assert(varCharEnumModel);
    ta.assertEquals("synthetic_enum_varchar", varCharEnumModel.tableName);
    ta.assert(varCharEnumModel.domains.length == 3);
    ta.assertEquals(
      ["code", "value", "created_at"],
      varCharEnumModel.domains.map((cd) => cd.identity),
    );
  });

  await tc.step("table creation SQL", () => {
    ta.assertEquals(
      varCharEnumModel.SQL(ctx),
      uws(`
        CREATE TABLE "synthetic_enum_varchar" (
            "code" VARCHAR(87) PRIMARY KEY NOT NULL,
            "value" TEXT NOT NULL,
            "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`),
    );
  });

  await tc.step("DML type-safety", () => {
    const row = varCharEnumModel.prepareInsertable({
      code: "code1", // TODO: try "codeBad" bad
      value: SyntheticEnumText.code1,
    });
    expectType<
      "code1" | "code2" | "code3" | SQLa.SqlTextSupplier<SQLa.SqlEmitContext>
    >(row.code); // should see compile error if this doesn't work
    expectType<SyntheticEnumText | SQLa.SqlTextSupplier<SQLa.SqlEmitContext>>(
      row.value,
    ); // should see compile error if this doesn't work
  });

  await tc.step("typed Typescript objects", () => {
    type Synthetic = z.infer<typeof varCharEnumModel.zoSchema>;
    const synthetic: Synthetic = {
      code: "code1",
      value: SyntheticEnumText.code1,
      created_at: new Date(),
    };
    expectType<Synthetic>(synthetic);
    expectType<"code1" | "code2" | "code3">(synthetic.code);
    expectType<SyntheticEnumText>(synthetic.value);
  });

  // deno-fmt-ignore
  await tc.step("seed DML row values", () => {
    const { seedDML, seedRows } = varCharEnumModel;
    ta.assert(Array.isArray(seedDML));
    ta.assertEquals(3, seedDML.length);

    expectType<"code1" | "code2" | "code3">(seedRows[0].code);
    expectType<SyntheticEnumText>(seedRows[0].value);

    ta.assertEquals(`INSERT INTO "synthetic_enum_varchar" ("code", "value") VALUES ('code1', 'value1')`, seedDML[0].SQL(ctx));
    ta.assertEquals(`INSERT INTO "synthetic_enum_varchar" ("code", "value") VALUES ('code2', 'value2')`, seedDML[1].SQL(ctx));
    ta.assertEquals(`INSERT INTO "synthetic_enum_varchar" ("code", "value") VALUES ('code3', 'value3')`, seedDML[2].SQL(ctx));
  });

  await tc.step("insert enum values into table rows", () => {
    const tcf = SQLa.tableColumnFactory<Any, Any>();
    const keys = SQLa.primaryKeyColumnFactory();

    const synthetic = SQLa.tableDefinition("synthetic_table", {
      synthetic_table_id: keys.primaryKey(z.string()),
      text: tcf.unique(z.string()),
      varchar_enum_code: varCharEnumModel.references.code(),
    });

    ta.assertEquals(
      uws(`
        CREATE TABLE "synthetic_table" (
            "synthetic_table_id" TEXT PRIMARY KEY NOT NULL,
            "text" TEXT /* UNIQUE COLUMN */ NOT NULL,
            "varchar_enum_code" TEXT NOT NULL,
            FOREIGN KEY("varchar_enum_code") REFERENCES "synthetic_enum_varchar"("code"),
            UNIQUE("text")
        )`),
      synthetic.SQL(ctx),
    );

    const syntheticRF = SQLa.tableColumnsRowFactory(
      synthetic.tableName,
      synthetic.zoSchema.shape,
    );

    ta.assertEquals(
      `INSERT INTO "synthetic_table" ("synthetic_table_id", "text", "varchar_enum_code") VALUES ('synthetic01', 'text', 'code1')`,
      syntheticRF.insertDML({
        synthetic_table_id: "synthetic01",
        text: "text",
        varchar_enum_code: "code1",
      }).SQL(ctx),
    );
  });
});
