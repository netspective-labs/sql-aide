import { zod as z } from "../deps.ts";
import { testingAsserts as ta } from "../deps-test.ts";
import { unindentWhitespace as uws } from "../lib/universal/whitespace.ts";
import * as tmpl from "../sql.ts";
import * as t from "./table.ts";
import * as s from "../dql/select.ts";

// deno-lint-ignore no-explicit-any
type Any = any; // make it easy on linter

const expectType = <T>(_value: T) => {
  // Do nothing, the TypeScript compiler handles this for us
};

type SyntheticContext = tmpl.SqlEmitContext;
// const ctx: SyntheticContext = tmpl.typicalSqlEmitContext();

// type HousekeepingColumnsDefns<Context extends tmpl.SqlEmitContext> = {
//   readonly created_at: d.AxiomSqlDomain<Date | undefined, Context>;
// };

// function housekeeping<
//   Context extends tmpl.SqlEmitContext,
// >(): HousekeepingColumnsDefns<Context> {
//   return {
//     created_at: d.createdAt(),
//   };
// }

const sqlGen = () => {
  const ctx: SyntheticContext = tmpl.typicalSqlEmitContext();
  const ddlOptions = tmpl.typicalSqlTextSupplierOptions();
  const lintState = tmpl.typicalSqlLintSummaries(
    ddlOptions.sqlTextLintState,
  );
  return { ctx, ddlOptions, lintState };
};

const syntheticSchema = () => {
  const commonColumns = {
    text: z.string(),
    text_nullable: z.string().optional(),
    int: z.number(),
    int_nullable: z.number().optional(),
    // TODO: add all the other scalars and types
  };

  const tableWithoutPK = t.tableDefinition("synthetic_table_without_pk", {
    ...commonColumns,
  });
  const tableWithAutoIncPK = t.tableDefinition(
    "synthetic_table_with_auto_inc_pk",
    {
      auto_inc_primary_key: t.autoIncPrimaryKey(),
      ...commonColumns,
    },
  );
  const tableWithTextPK = t.tableDefinition("synthetic_table_with_text_pk", {
    text_primary_key: t.primaryKey(),
    ...commonColumns,
  });
  const tableWithOnDemandPK = t.tableDefinition(
    "synthetic_table_with_uaod_pk",
    {
      ua_on_demand_primary_key: t.uaDefaultableTextPrimaryKey(
        z.string().default(() => "ON_DEMAND_PK"),
      ),
      ...commonColumns,
    },
  );

  return {
    commonColumns,
    tableWithoutPK,
    tableWithAutoIncPK,
    tableWithTextPK,
    tableWithOnDemandPK,
  };
};

Deno.test("SQL Aide (SQLa) Table structure and DDL", async (tc) => {
  /**
   * Test strategy:
   * Step 1. Validate that a table with all columns types except primary keys
   *         can be properly defined and are type-safe.
   * Step 2. Check that auto-inc primary keys can be defined and are type-safe
   * Step 3. Check that text primary keys can be defined and are type-safe
   * Step 4. Check that UA-defaultable text primary keys can be defined and are type-safe
   *
   * General approach is to separate the tests so that no duplicate testing is
   * done (meaning don't just test the same stuff in Step 3 was in 2 and 1).
   */

  await tc.step(
    "[1] valid table and columns (without any PKs)",
    async (innerTC) => {
      const { tableWithoutPK: table } = syntheticSchema();
      ta.assert(t.isTableDefinition(table)); // if you don't care which table it is
      ta.assert(t.isTableDefinition(table, "synthetic_table_without_pk")); // if you want Typescript to type-check specific table
      ta.assertEquals(t.isTableDefinition(table, "invalid_table_name"), false);

      type TableColumnDefn<
        ColumnName extends string,
        ColumnTsType extends z.ZodTypeAny,
      > = t.TableColumnDefn<
        "synthetic_table_without_pk",
        ColumnName,
        ColumnTsType,
        SyntheticContext
      >;

      await innerTC.step("type safety", () => {
        // the table has the zod shape, domains, and columns all typed so we can
        // access it multiple ways, as shown here
        expectType<TableColumnDefn<"text", z.ZodType<string, z.ZodStringDef>>>(
          table.columns.text,
        );
        expectType<
          TableColumnDefn<
            "text_nullable",
            z.ZodType<string | undefined, z.ZodOptionalDef<z.ZodString>>
          >
        >(table.columns.text_nullable);
        expectType<
          TableColumnDefn<
            "int",
            z.ZodType<number, z.ZodNumberDef, number>
          >
        >(
          table.columns.int,
        );
        expectType<
          TableColumnDefn<
            "int_nullable",
            z.ZodType<number | undefined, z.ZodOptionalDef<z.ZodNumber>>
          >
        >(table.columns.int_nullable);

        type SyntheticSchema = z.infer<typeof table.zSchema>;
        const synthetic: SyntheticSchema = {
          text: "required",
          int: 0,
          text_nullable: undefined,
        };
        expectType<{
          text: string;
          int: number;
          text_nullable?: string | undefined;
          int_nullable?: number | undefined;
        }>(synthetic);
        ta.assert(synthetic);
        ta.assertEquals(synthetic.text, "required");
        ta.assertEquals(table.lintIssues.length, 0);
        ta.assertEquals(synthetic.int, 0);
        ta.assertEquals(synthetic.text_nullable, undefined);
        ta.assertEquals(synthetic.int_nullable, undefined);
      });

      await innerTC.step("SQL DDL with no lint issues", () => {
        const { ctx, ddlOptions, lintState } = sqlGen();
        ta.assertEquals(
          tmpl.SQL(ddlOptions)`
          ${lintState.sqlTextLintSummary}

          ${table}`.SQL(ctx),
          uws(`
          -- no SQL lint issues (typicalSqlTextLintManager)

          CREATE TABLE "synthetic_table_without_pk" (
              "text" TEXT NOT NULL,
              "text_nullable" TEXT,
              "int" INTEGER NOT NULL,
              "int_nullable" INTEGER
          );`),
        );
      });
    },
  );

  await tc.step("[2] valid auto-inc PK table and columns", async (innerTC) => {
    const { tableWithAutoIncPK: table } = syntheticSchema();
    ta.assert(t.isTableDefinition(table, "synthetic_table_with_auto_inc_pk"));

    await innerTC.step("type safety", () => {
      // tableDefinition() properly "types" table.primaryKey to be the collection
      // of PKs - since we have a single PK, make sure it has at least that one
      expectType<
        { auto_inc_primary_key: typeof table.primaryKey.auto_inc_primary_key }
      >(
        table.primaryKey,
      );
    });

    await innerTC.step("primary key definition", () => {
      ta.assertEquals(
        Array.from(Object.values(table.columns)).filter((d) =>
          t.isTablePrimaryKeyColumnDefn(d) ? true : false
        ).map((d) => d.identity),
        ["auto_inc_primary_key"],
      );
    });

    await innerTC.step("SQL DDL with no lint issues", () => {
      const { ctx, ddlOptions, lintState } = sqlGen();
      ta.assertEquals(
        tmpl.SQL(ddlOptions)`
        ${lintState.sqlTextLintSummary}

        ${table}`.SQL(ctx),
        uws(`
        -- no SQL lint issues (typicalSqlTextLintManager)

        CREATE TABLE "synthetic_table_with_auto_inc_pk" (
            "auto_inc_primary_key" INTEGER PRIMARY KEY AUTOINCREMENT,
            "text" TEXT NOT NULL,
            "text_nullable" TEXT,
            "int" INTEGER NOT NULL,
            "int_nullable" INTEGER
        );`),
      );
    });
  });

  await tc.step("[3] valid text PK table and columns", async (innerTC) => {
    const { tableWithTextPK: table } = syntheticSchema();
    ta.assert(t.isTableDefinition(table)); // if you don't care which table it is
    ta.assert(t.isTableDefinition(table, "synthetic_table_with_text_pk")); // if you want Typescript to type-check specific table
    ta.assertEquals(t.isTableDefinition(table, "invalid_table_name"), false);

    await innerTC.step("type safety", () => {
      // tableDefinition() properly "types" table.primaryKey to be the collection
      // of PKs - since we have a single PK, make sure it has at least that one
      expectType<
        { text_primary_key: typeof table.primaryKey.text_primary_key }
      >(
        table.primaryKey,
      );
    });

    await innerTC.step("SQL DDL with no lint issues", () => {
      const { ctx, ddlOptions, lintState } = sqlGen();
      ta.assertEquals(
        tmpl.SQL(ddlOptions)`
        ${lintState.sqlTextLintSummary}

        ${table}`.SQL(ctx),
        uws(`
        -- no SQL lint issues (typicalSqlTextLintManager)

        CREATE TABLE "synthetic_table_with_text_pk" (
            "text_primary_key" TEXT PRIMARY KEY,
            "text" TEXT NOT NULL,
            "text_nullable" TEXT,
            "int" INTEGER NOT NULL,
            "int_nullable" INTEGER
        );`),
      );
    });
  });

  await tc.step(
    "[4] valid defaultable text PK table and columns",
    async (innerTC) => {
      const { tableWithOnDemandPK: table } = syntheticSchema();
      ta.assert(t.isTableDefinition(table)); // if you don't care which table it is
      ta.assert(t.isTableDefinition(table, "synthetic_table_with_uaod_pk")); // if you want Typescript to type-check specific table
      ta.assertEquals(t.isTableDefinition(table, "invalid_table_name"), false);

      await innerTC.step("type safety", () => {
        // tableDefinition() properly "types" table.primaryKey to be the collection
        // of PKs - since we have a single PK, make sure it has at least that one
        expectType<
          {
            ua_on_demand_primary_key:
              typeof table.primaryKey.ua_on_demand_primary_key;
          }
        >(
          table.primaryKey,
        );
      });

      await innerTC.step("SQL DDL with no lint issues", () => {
        const { ctx, ddlOptions, lintState } = sqlGen();
        ta.assertEquals(
          tmpl.SQL(ddlOptions)`
        ${lintState.sqlTextLintSummary}

        ${table}`.SQL(ctx),
          uws(`
        -- no SQL lint issues (typicalSqlTextLintManager)

        CREATE TABLE "synthetic_table_with_uaod_pk" (
            "ua_on_demand_primary_key" TEXT PRIMARY KEY,
            "text" TEXT NOT NULL,
            "text_nullable" TEXT,
            "int" INTEGER NOT NULL,
            "int_nullable" INTEGER
        );`),
        );
      });
    },
  );

  await tc.step("TODO: indexes", () => {});
  await tc.step("TODO: constraints", () => {});
  await tc.step("TODO: lint messages", () => {});
});

Deno.test("SQL Aide (SQLa) Table references (foreign keys) DDL", async (tc) => {
  const {
    tableWithOnDemandPK,
    tableWithAutoIncPK,
  } = syntheticSchema();
  const table = t.tableDefinition(
    "synthetic_table_with_foreign_keys",
    {
      auto_inc_primary_key: t.autoIncPrimaryKey(),
      fk_text_primary_key: tableWithOnDemandPK.infer
        .ua_on_demand_primary_key(),
      fk_int_primary_key: tableWithAutoIncPK.infer.auto_inc_primary_key(),
      fk_text_primary_key_nullable: tableWithOnDemandPK.infer
        .ua_on_demand_primary_key().optional(),
      fk_int_primary_key_nullable: tableWithAutoIncPK.infer
        .auto_inc_primary_key().optional(),
    },
  );

  await tc.step("type safety", () => {
    ta.assertEquals(Array.from(Object.keys(table.columns)), [
      "auto_inc_primary_key",
      "fk_text_primary_key",
      "fk_int_primary_key",
      "fk_text_primary_key_nullable",
      "fk_int_primary_key_nullable",
    ]);
    ta.assertEquals(Array.from(Object.keys(table.primaryKey)), [
      "auto_inc_primary_key",
    ]);
    ta.assertEquals(Array.from(Object.keys(table.foreignKeys)), [
      "fk_text_primary_key",
      "fk_int_primary_key",
      "fk_text_primary_key_nullable",
      "fk_int_primary_key_nullable",
    ]);
    ta.assertEquals(Array.from(Object.keys(table.infer)), [
      "auto_inc_primary_key",
      "fk_text_primary_key",
      "fk_int_primary_key",
      "fk_text_primary_key_nullable",
      "fk_int_primary_key_nullable",
    ]);

    type SyntheticType = z.infer<typeof table.zSchema>;
    const synthetic: SyntheticType = {
      auto_inc_primary_key: 0,
      fk_text_primary_key: "required",
      fk_int_primary_key: -12,
    };
    expectType<{
      fk_text_primary_key: string;
      fk_int_primary_key: number;
      auto_inc_primary_key?: number | undefined;
      fk_text_primary_key_nullable?: string | undefined;
      fk_int_primary_key_nullable?: number | undefined;
    }>(synthetic);

    // TODO: fix this so we don't just use typeof to find the proper type
    expectType(table.foreignKeys);
    // expectType<
    //   t.TableColumnDefn<
    //     "synthetic_table_with_uaod_pk",
    //     "ua_on_demand_primary_key",
    //     z.ZodType<string, z.ZodDefaultDef<z.ZodString>, string>,
    //     SyntheticContext
    //   >
    // >(
    //   table.columns.fk_text_primary_key,
    // );
  });

  await tc.step("SQL DDL with no lint issues", () => {
    // const { ctx, ddlOptions, lintState } = sqlGen();
    // Deno.writeTextFileSync(
    //   "DELETE_ME_DEBUG.txt",
    //   Deno.inspect(table, { depth: 10 }),
    // );
    // console.log(table.SQL(ctx));
    // ta.assertEquals(
    //   tmpl.SQL(ddlOptions)`
    // ${lintState.sqlTextLintSummary}

    // ${table}`.SQL(ctx),
    //   uws(`
    //   -- no SQL lint issues (typicalSqlTextLintManager)

    //   CREATE TABLE "synthetic_table_with_foreign_keys" (
    //       "auto_inc_primary_key" INTEGER PRIMARY KEY AUTOINCREMENT,
    //       "fk_text_primary_key" TEXT NOT NULL,
    //       "fk_int_primary_key" INTEGER NOT NULL,
    //       "fk_text_primary_key_nullable" TEXT,
    //       "fk_int_primary_key_nullable" INTEGER,
    //       FOREIGN KEY("fk_text_primary_key") REFERENCES "synthetic_table_with_uaod_pk"("ua_on_demand_primary_key"),
    //       FOREIGN KEY("fk_int_primary_key") REFERENCES "synthetic_table_with_auto_inc_pk"("auto_inc_primary_key"),
    //       FOREIGN KEY("fk_text_primary_key_nullable") REFERENCES "synthetic_table_with_uaod_pk"("ua_on_demand_primary_key"),
    //       FOREIGN KEY("fk_int_primary_key_nullable") REFERENCES "synthetic_table_with_auto_inc_pk"("auto_inc_primary_key")
    //   );`),
    // );
  });

  await tc.step("TODO: tables graph", () => {
  });
});

Deno.test("SQL Aide (SQLa) Table DML Insert Statement", async (tc) => {
  /**
   * Test strategy:
   * Step 1. Validate Insert DML for a table without primary keys.
   * Step 2. Validate Insert DML for a table with auto-inc primary key.
   * Step 3. Validate Insert DML for a table with text primary key.
   * Step 4. Validate Insert DML for a table with defaultable primary key.
   *
   * General approach is to separate the tests so that no duplicate testing is
   * done (meaning don't just test the same stuff in Step 3 was in 2 and 1).
   */

  await tc.step(
    "[1] valid insert statement for a table without primary keys",
    async (innerTC) => {
      const { tableWithoutPK: table } = syntheticSchema();
      ta.assert(t.isTableDefinition(table, "synthetic_table_without_pk"));
      const tableRF = t.tableColumnsRowFactory(
        "synthetic_table_without_pk",
        table.zSchema.shape,
      );

      await innerTC.step("type safety", () => {
        const insertable = tableRF.prepareInsertable({
          text: "text",
          int: 423,
        });
        expectType<string | tmpl.SqlTextSupplier<tmpl.SqlEmitContext>>(
          insertable.text,
        );
        expectType<number | tmpl.SqlTextSupplier<tmpl.SqlEmitContext>>(
          insertable.int,
        );
      });

      await innerTC.step("SQL DML raw without Zod parse", () => {
        const { ctx } = sqlGen();
        const insertable = tableRF.prepareInsertable({
          text: "text",
          int: 423,
        });
        ta.assert(insertable);
        ta.assertEquals(
          tableRF.insertRawDML(insertable).SQL(ctx),
          `INSERT INTO "synthetic_table_without_pk" ("text", "text_nullable", "int", "int_nullable") VALUES ('text', NULL, 423, NULL)`,
        );
      });
    },
  );

  await tc.step(
    "[2] valid insert statement for a table with auto-inc primary key",
    async (innerTC) => {
      const { tableWithAutoIncPK: table } = syntheticSchema();
      ta.assert(t.isTableDefinition(table, "synthetic_table_with_auto_inc_pk"));
      const tableRF = t.tableColumnsRowFactory(
        "synthetic_table_with_auto_inc_pk",
        table.zSchema.shape,
      );

      await innerTC.step("type safety", () => {
        const insertable = tableRF.prepareInsertable({
          // autoInc should not show up here, it's not "insertable"
          text: "text",
          int: 423,
        });
        ta.assert(insertable);
        expectType<string | tmpl.SqlTextSupplier<tmpl.SqlEmitContext>>(
          insertable.text,
        );
        expectType<number | tmpl.SqlTextSupplier<tmpl.SqlEmitContext>>(
          insertable.int,
        );
      });

      await innerTC.step("SQL DML basic", () => {
        const { ctx } = sqlGen();
        ta.assertEquals(
          tableRF.insertDML({ text: "text", int: 423 }).SQL(ctx),
          `INSERT INTO "synthetic_table_with_auto_inc_pk" ("text", "text_nullable", "int", "int_nullable") VALUES ('text', NULL, 423, NULL)`,
        );
      });

      await innerTC.step(
        "SQL DML with SQL expression as insertable value",
        () => {
          const { ctx } = sqlGen();
          ta.assertEquals(
            // we use .insertRawDML() because Zod parse will fail on SQL expression
            tableRF.insertRawDML({
              // { symbolsFirst: true } means that ${XYZ} in dql.select()`${XYZ}`
              // will try to find name of object first
              text: s.untypedSelect(ctx, {
                symbolsFirst: true,
              })`select ${table.sdSchema.text} from ${table}`, // the value will be a SQL expression
              int: 477,
            }).SQL(ctx),
            `INSERT INTO "synthetic_table_with_auto_inc_pk" ("text", "text_nullable", "int", "int_nullable") VALUES ((select "text" from "synthetic_table_with_auto_inc_pk"), NULL, 477, NULL)`,
          );
        },
      );

      await innerTC.step(
        "SQL DML returning all inserted values",
        () => {
          const { ctx } = sqlGen();
          ta.assertEquals(
            tableRF.insertDML({ text: "text", int: 423 }, { returning: "*" })
              .SQL(ctx),
            `INSERT INTO "synthetic_table_with_auto_inc_pk" ("text", "text_nullable", "int", "int_nullable") VALUES ('text', NULL, 423, NULL) RETURNING *`,
          );
        },
      );

      await innerTC.step(
        "SQL DML returning inserted primary key values",
        () => {
          const { ctx } = sqlGen();
          ta.assertEquals(
            tableRF.insertDML({ text: "text", int: 423 }, {
              returning: "primary-keys",
            }).SQL(ctx),
            `INSERT INTO "synthetic_table_with_auto_inc_pk" ("text", "text_nullable", "int", "int_nullable") VALUES ('text', NULL, 423, NULL) RETURNING "auto_inc_primary_key"`,
          );
        },
      );

      await innerTC.step(
        "SQL DML returning specific column and ignoring on conflict",
        () => {
          const { ctx } = sqlGen();
          ta.assertEquals(
            tableRF.insertDML({ text: "text-value", int: 7123 }, {
              returning: { columns: ["text"] },
              onConflict: {
                SQL: () => `ON CONFLICT ("synthetic_table1_id") IGNORE`,
              },
            }).SQL(ctx),
            `INSERT INTO "synthetic_table_with_auto_inc_pk" ("text", "text_nullable", "int", "int_nullable") VALUES ('text-value', NULL, 7123, NULL) ON CONFLICT ("synthetic_table1_id") IGNORE RETURNING "text"`,
          );
        },
      );

      await innerTC.step(
        "SQL DML returning specific expression and ignoring on conflict",
        () => {
          const { ctx } = sqlGen();
          ta.assertEquals(
            tableRF.insertDML({ text: "text-value", int: 7123 }, {
              returning: { exprs: [`"text" || 'something else'`] },
              onConflict: {
                SQL: () => `ON CONFLICT ("synthetic_table1_id") IGNORE`,
              },
            }).SQL(ctx),
            `INSERT INTO "synthetic_table_with_auto_inc_pk" ("text", "text_nullable", "int", "int_nullable") VALUES ('text-value', NULL, 7123, NULL) ON CONFLICT ("synthetic_table1_id") IGNORE RETURNING "text" || 'something else'`,
          );
        },
      );
    },
  );

  await tc.step(
    "[3] valid insert statement for a table with text primary key",
    async (innerTC) => {
      const { tableWithTextPK: table } = syntheticSchema();
      ta.assert(t.isTableDefinition(table, "synthetic_table_with_text_pk")); // if you want Typescript to type-check specific table

      const tableRF = t.tableColumnsRowFactory(
        "synthetic_table_with_text_pk",
        table.zSchema.shape,
      );

      await innerTC.step("type safety", () => {
        const insertable = tableRF.prepareInsertable({
          textPrimaryKey: "PK-value",
          text: "text",
          int: 423,
        });
        expectType<string | tmpl.SqlTextSupplier<tmpl.SqlEmitContext>>(
          insertable.text_primary_key,
        );
        expectType<string | tmpl.SqlTextSupplier<tmpl.SqlEmitContext>>(
          insertable.text,
        );
        expectType<number | tmpl.SqlTextSupplier<tmpl.SqlEmitContext>>(
          insertable.int,
        );
      });

      await innerTC.step("SQL DML", () => {
        const { ctx } = sqlGen();
        const insertable = tableRF.prepareInsertable({
          textPrimaryKey: "PK-value",
          text: "text",
          int: 423,
        });
        ta.assert(insertable);
        ta.assertEquals(
          tableRF.insertDML(insertable).SQL(ctx),
          `INSERT INTO "synthetic_table_with_text_pk" ("text_primary_key", "text", "text_nullable", "int", "int_nullable") VALUES ('PK-value', 'text', NULL, 423, NULL)`,
        );
      });
    },
  );

  await tc.step(
    "[4] valid insert statement for a table with UA-defaultable (on demand) text primary key",
    async (innerTC) => {
      const { tableWithOnDemandPK: table } = syntheticSchema();
      ta.assert(t.isTableDefinition(table, "synthetic_table_with_uaod_pk"));

      const tableRF = t.tableColumnsRowFactory(
        table.tableName,
        table.zSchema.shape,
      );

      await innerTC.step("type safety", () => {
        const insertable = tableRF.prepareInsertable({
          text: "text",
          int: 423,
        });
        expectType<
          string | tmpl.SqlTextSupplier<tmpl.SqlEmitContext> | undefined
        >(
          insertable.ua_on_demand_primary_key,
        );
        expectType<string | tmpl.SqlTextSupplier<tmpl.SqlEmitContext>>(
          insertable.text,
        );
        expectType<number | tmpl.SqlTextSupplier<tmpl.SqlEmitContext>>(
          insertable.int,
        );
      });

      await innerTC.step("SQL DML", () => {
        const { ctx } = sqlGen();
        ta.assertEquals(
          tableRF.insertDML({ text: "text", int: 423 }).SQL(ctx),
          `INSERT INTO "synthetic_table_with_uaod_pk" ("ua_on_demand_primary_key", "text", "text_nullable", "int", "int_nullable") VALUES ('ON_DEMAND_PK', 'text', NULL, 423, NULL)`,
        );
      });
    },
  );
});

Deno.test("SQL Aide (SQLa) Table DQL Select Statement", async (tc) => {
  await tc.step(
    "valid select statement for a table",
    async (innerTC) => {
      const { tableWithOnDemandPK: table } = syntheticSchema();
      ta.assert(t.isTableDefinition(table, "synthetic_table_with_uaod_pk"));
      const tableSF = t.tableSelectFactory(
        table.tableName,
        table.zSchema.shape,
      );

      await innerTC.step("type safety", () => {
        const insertable = tableSF.prepareFilterable({
          text: "text",
          int: 423,
        });
        expectType<string | tmpl.SqlTextSupplier<tmpl.SqlEmitContext>>(
          insertable.text,
        );
        expectType<number | tmpl.SqlTextSupplier<tmpl.SqlEmitContext>>(
          insertable.int,
        );
      });

      await innerTC.step("SQL DQL", () => {
        const { ctx } = sqlGen();
        ta.assertEquals(
          tableSF.select({ text: "text", int: 423 }).SQL(ctx),
          `SELECT "ua_on_demand_primary_key" FROM "synthetic_table_with_uaod_pk" WHERE "text" = 'text' AND "int" = 423`,
        );
      });
    },
  );
});
