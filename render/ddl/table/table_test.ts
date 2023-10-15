import { zod as z } from "../../deps.ts";
import { testingAsserts as ta } from "../../deps-test.ts";
import { unindentWhitespace as uws } from "../../../lib/universal/whitespace.ts";
// import * as za from "../../../lib/universal/zod-aide.ts";
import * as d from "../../domain/mod.ts";
import * as tmpl from "../../emit/mod.ts";
import * as mod from "./mod.ts";
import * as dml from "../../dml/mod.ts";
import * as s from "../../dql/select.ts";

// deno-lint-ignore no-explicit-any
type Any = any; // make it easy on linter

const expectType = <T>(_value: T) => {
  // Do nothing, the TypeScript compiler handles this for us
};

type SyntheticContext = tmpl.SqlEmitContext;

const sqlGen = () => {
  const ctx: SyntheticContext = tmpl.typicalSqlEmitContext();
  const ddlOptions = tmpl.typicalSqlTextSupplierOptions();
  const qsContent = tmpl.typicalSqlQualitySystemContent(
    ddlOptions.sqlQualitySystemState,
  );
  return { ctx, ddlOptions, qsContent };
};

const syntheticSchema = () => {
  const tcf = mod.tableColumnFactory<Any, SyntheticContext, d.SqlDomainQS>();
  const pkcFactory = mod.primaryKeyColumnFactory<
    SyntheticContext,
    d.SqlDomainQS
  >();
  const commonColumns = {
    text: z.string().describe(`commonColumns.text description`),
    text_nullable: z.string().describe(
      `commonColumns.text_nullable description`,
    ).optional(),
    int: z.number(),
    int_nullable: z.number().optional(),
    // TODO: add all the other scalars and types
  };
  const housekeeping = {
    columns: {
      created_at: z.date().default(new Date()).optional(),
    },
    // IMPORTANT: pass this into tableColumnsRowFactory(..., { defaultIspOptions: housekeeping.insertStmtPrepOptions })
    insertStmtPrepOptions: <TableName extends string>() => {
      const result: dml.InsertStmtPreparerOptions<
        TableName,
        { created_at?: Date }, // this must match housekeeping.columns so that isColumnEmittable is type-safe
        { created_at?: Date }, // this must match housekeeping.columns so that isColumnEmittable is type-safe
        SyntheticContext,
        d.SqlDomainQS
      > = {
        // created_at should be filled in by the database so we don't want
        // to emit it as part of the insert DML SQL statement
        isColumnEmittable: (name) => name == "created_at" ? false : true,
      };
      return result as dml.InsertStmtPreparerOptions<
        Any,
        Any,
        Any,
        SyntheticContext,
        d.SqlDomainQS
      >;
    },
  };

  const tableWithoutPK = mod.tableDefinition("synthetic_table_without_pk", {
    ...commonColumns,
  });
  const tableWithAutoIncPK = mod.tableDefinition(
    "synthetic_table_with_auto_inc_pk",
    {
      auto_inc_primary_key: pkcFactory.autoIncPrimaryKey(),
      ...commonColumns,
    },
  );
  const tableWithTextPK = mod.tableDefinition("synthetic_table_with_text_pk", {
    text_primary_key: pkcFactory.primaryKey(z.string()),
    ...commonColumns,
  });
  const tableWithOnDemandPK = mod.tableDefinition(
    "synthetic_table_with_uaod_pk",
    {
      ua_on_demand_primary_key: pkcFactory.uaDefaultableTextPrimaryKey(
        z.string().default(() => "ON_DEMAND_PK"),
      ),
      ...commonColumns,
    },
    { descr: "synthetic_table_with_uaod_pk" },
  );
  const tableWithConstraints = mod.tableDefinition(
    "synthetic_table_with_constraints",
    {
      text_primary_key: pkcFactory.primaryKey(z.string()),
      column_unique: tcf.unique(z.string()),
      ...housekeeping.columns,
    },
    {
      // test "manual" creation of constraints
      sqlPartial: (destination) => {
        if (destination == "after all column definitions") {
          return [
            {
              SQL: () =>
                `UNIQUE(column_one_text, column_three_text_digest) /* CUSTOM CONSTRAINT */`,
            },
          ];
        }
      },
      // test "automatic" creation of unique constraints
      constraints: (props, tableName) => {
        const c = mod.tableConstraints(tableName, props);
        return [
          c.unique("column_unique", "created_at"),
          c.uniqueNamed("uniq_constr_name", "text_primary_key", "created_at"),
        ];
      },
      // test "automatic" creation of table indexes
      indexes: (props, tableName) => {
        const tif = mod.tableIndexesFactory(tableName, props);
        return [
          tif.index(undefined, "column_unique", "created_at"),
          tif.index(
            { indexIdentity: "custom_index_name", isUnique: true },
            "text_primary_key",
            "created_at",
          ),
        ];
      },
      qualitySystem: {
        description: "synthetic_table_with_constraints table description",
      },
    },
  );

  return {
    pkcFactory,
    commonColumns,
    housekeeping,
    tableWithoutPK,
    tableWithAutoIncPK,
    tableWithTextPK,
    tableWithOnDemandPK,
    tableWithConstraints,
  };
};

Deno.test("SQL Aide (SQLa) Table structure and DDL", async (tc) => {
  /**
   * Test strategy:
   * Step 0. Validate all column identifiers match their Zod object property names
   * Step 1. Validate that a table with all columns types except primary keys
   *         can be properly defined and are type-safe.
   * Step 2. Check that auto-inc primary keys can be defined and are type-safe
   * Step 3. Check that text primary keys can be defined and are type-safe
   * Step 4. Check that UA-defaultable text primary keys can be defined and are type-safe
   *
   * General approach is to separate the tests so that no duplicate testing is
   * done (meaning don't just test the same stuff in Step 3 was in 2 and 1).
   */

  await tc.step("identifiers", () => {
    const { tableWithoutPK, tableWithAutoIncPK, tableWithTextPK } =
      syntheticSchema();
    const { ctx } = sqlGen();
    ta.assertEquals(
      Array.from(Object.values(tableWithoutPK.columns)).map((c) => ({
        identifier: c.identity,
        symbol: c.sqlSymbol(ctx),
      })),
      [
        { identifier: "text", symbol: `"text"` },
        { identifier: "text_nullable", symbol: `"text_nullable"` },
        { identifier: "int", symbol: `"int"` },
        { identifier: "int_nullable", symbol: `"int_nullable"` },
      ],
    );
    ta.assertEquals(
      Array.from(Object.values(tableWithAutoIncPK.columns)).map((c) => ({
        identifier: c.identity,
        symbol: c.sqlSymbol(ctx),
      })),
      [
        {
          identifier: "auto_inc_primary_key",
          symbol: `"auto_inc_primary_key"`,
        },
        { identifier: "text", symbol: `"text"` },
        { identifier: "text_nullable", symbol: `"text_nullable"` },
        { identifier: "int", symbol: `"int"` },
        { identifier: "int_nullable", symbol: `"int_nullable"` },
      ],
    );
    ta.assertEquals(
      Array.from(Object.values(tableWithTextPK.columns)).map((c) => ({
        identifier: c.identity,
        symbol: c.sqlSymbol(ctx),
      })),
      [
        {
          identifier: "text_primary_key",
          symbol: `"text_primary_key"`,
        },
        { identifier: "text", symbol: `"text"` },
        { identifier: "text_nullable", symbol: `"text_nullable"` },
        { identifier: "int", symbol: `"int"` },
        { identifier: "int_nullable", symbol: `"int_nullable"` },
      ],
    );
  });

  await tc.step(
    "[1] valid table and columns (without any PKs)",
    async (innerTC) => {
      const { tableWithoutPK: table } = syntheticSchema();
      ta.assert(mod.isTableDefinition(table)); // if you don't care which table it is
      ta.assert(mod.isTableDefinition(table, "synthetic_table_without_pk")); // if you want Typescript to type-check specific table
      ta.assertEquals(
        mod.isTableDefinition(table, "invalid_table_name"),
        false,
      );

      type TableColumnDefn<
        ColumnName extends string,
        ColumnTsType extends z.ZodTypeAny,
      > = mod.TableColumnDefn<
        "synthetic_table_without_pk",
        ColumnName,
        ColumnTsType,
        SyntheticContext,
        d.SqlDomainQS
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

        type SyntheticSchema = z.infer<typeof table.zoSchema>;
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

      await innerTC.step(
        "SQL DDL with no lint issues and no documentation",
        () => {
          const { ctx, ddlOptions, qsContent } = sqlGen();
          ta.assertEquals(
            tmpl.SQL(ddlOptions)`
          ${qsContent.sqlTextLintSummary}

          ${table}

          ${qsContent.sqlObjectsComments}`.SQL(ctx),
            uws(`
              -- no SQL lint issues (typicalSqlTextLintManager)

              CREATE TABLE "synthetic_table_without_pk" (
                  "text" TEXT NOT NULL,
                  "text_nullable" TEXT,
                  "int" INTEGER NOT NULL,
                  "int_nullable" INTEGER
              );

              COMMENT ON column "synthetic_table_without_pk"."text" IS 'commonColumns.text description';
              COMMENT ON column "synthetic_table_without_pk"."text_nullable" IS 'commonColumns.text_nullable description';`),
          );
        },
      );
    },
  );

  await tc.step("[2] valid auto-inc PK table and columns", async (innerTC) => {
    const { tableWithAutoIncPK: table } = syntheticSchema();
    ta.assert(mod.isTableDefinition(table, "synthetic_table_with_auto_inc_pk"));

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
          mod.isTablePrimaryKeyColumnDefn(d) ? true : false
        ).map((d) => d.identity),
        ["auto_inc_primary_key"],
      );
    });

    await innerTC.step("SQL DDL with no lint issues", () => {
      const { ctx, ddlOptions, qsContent } = sqlGen();
      ta.assertEquals(
        tmpl.SQL(ddlOptions)`
        ${qsContent.sqlTextLintSummary}

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
    ta.assert(mod.isTableDefinition(table)); // if you don't care which table it is
    ta.assert(mod.isTableDefinition(table, "synthetic_table_with_text_pk")); // if you want Typescript to type-check specific table
    ta.assertEquals(mod.isTableDefinition(table, "invalid_table_name"), false);

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
      const { ctx, ddlOptions, qsContent } = sqlGen();
      ta.assertEquals(
        tmpl.SQL(ddlOptions)`
        ${qsContent.sqlTextLintSummary}

        ${table}`.SQL(ctx),
        uws(`
        -- no SQL lint issues (typicalSqlTextLintManager)

        CREATE TABLE "synthetic_table_with_text_pk" (
            "text_primary_key" TEXT PRIMARY KEY NOT NULL,
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
      ta.assert(mod.isTableDefinition(table)); // if you don't care which table it is
      ta.assert(mod.isTableDefinition(table, "synthetic_table_with_uaod_pk")); // if you want Typescript to type-check specific table
      ta.assertEquals(
        mod.isTableDefinition(table, "invalid_table_name"),
        false,
      );

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

      await innerTC.step(
        "SQL DDL with no lint issues, with documentation",
        () => {
          const { ctx, ddlOptions, qsContent } = sqlGen();
          ta.assertEquals(
            tmpl.SQL(ddlOptions)`
        ${qsContent.sqlTextLintSummary}

        ${table}

        ${qsContent.sqlObjectsComments}`.SQL(ctx),
            uws(`
            -- no SQL lint issues (typicalSqlTextLintManager)

            CREATE TABLE "synthetic_table_with_uaod_pk" (
                "ua_on_demand_primary_key" TEXT PRIMARY KEY NOT NULL DEFAULT 'ON_DEMAND_PK',
                "text" TEXT NOT NULL,
                "text_nullable" TEXT,
                "int" INTEGER NOT NULL,
                "int_nullable" INTEGER
            );

            COMMENT ON table "synthetic_table_with_uaod_pk" IS 'synthetic_table_with_uaod_pk';
            COMMENT ON column "synthetic_table_with_uaod_pk"."text" IS 'commonColumns.text description';
            COMMENT ON column "synthetic_table_with_uaod_pk"."text_nullable" IS 'commonColumns.text_nullable description';`),
          );
        },
      );
    },
  );

  await tc.step("TODO: indexes", () => {});
  await tc.step("TODO: lint messages", () => {});
});

Deno.test("SQL Aide (SQLa) Table references (foreign keys) DDL", async (tc) => {
  const {
    pkcFactory,
    tableWithOnDemandPK,
    tableWithAutoIncPK,
  } = syntheticSchema();

  const selfRef = <ZTA extends z.ZodTypeAny>(zodType: ZTA) =>
    mod.selfRef<
      ZTA,
      SyntheticContext,
      d.SqlDomainQS,
      d.SqlDomainsQS<d.SqlDomainQS>
    >(
      zodType,
      d.sqlDomainsFactory<
        Any,
        SyntheticContext,
        d.SqlDomainQS,
        d.SqlDomainsQS<d.SqlDomainQS>
      >(),
    );

  const auto_inc_primary_key = pkcFactory.autoIncPrimaryKey();
  const table = mod.tableDefinition(
    "synthetic_table_with_foreign_keys",
    {
      auto_inc_primary_key,
      fk_text_primary_key: tableWithOnDemandPK.references
        .ua_on_demand_primary_key(),
      fk_int_primary_key: tableWithAutoIncPK.belongsTo.auto_inc_primary_key(),
      fk_text_primary_key_nullable: tableWithOnDemandPK.references
        .ua_on_demand_primary_key().optional(),
      fk_int_primary_key_nullable: tableWithAutoIncPK.references
        .auto_inc_primary_key().optional(),
      parent_auto_inc_primary_key: selfRef(auto_inc_primary_key).optional(),
    },
  );

  await tc.step("references compile-time type safety", () => {
    expectType<{
      ua_on_demand_primary_key: () => z.ZodString;
      // TODO:        & d.SqlDomainSupplier<z.ZodString, Any, SyntheticContext>;
    }>(tableWithOnDemandPK.references);

    expectType<{
      auto_inc_primary_key: () => z.ZodNumber;
      // TODO:      & d.SqlDomainSupplier<z.ZodNumber, Any, SyntheticContext>;
    }>(tableWithAutoIncPK.references);

    expectType<z.ZodString>(
      tableWithOnDemandPK.references.ua_on_demand_primary_key(),
    );
    expectType<z.ZodNumber>(
      tableWithAutoIncPK.references.auto_inc_primary_key(),
    );
    expectType<z.ZodOptional<z.ZodString>>(
      tableWithOnDemandPK.references.ua_on_demand_primary_key().optional(),
    );
    expectType<z.ZodOptional<z.ZodNumber>>(
      tableWithAutoIncPK.references.auto_inc_primary_key().optional(),
    );
  });

  await tc.step("references run-time assurance", () => {
    ta.assertEquals(Array.from(Object.keys(tableWithAutoIncPK.references)), [
      "auto_inc_primary_key",
      "text",
      "text_nullable",
      "int",
      "int_nullable",
    ]);

    ta.assertEquals(Array.from(Object.keys(tableWithOnDemandPK.references)), [
      "ua_on_demand_primary_key",
      "text",
      "text_nullable",
      "int",
      "int_nullable",
    ]);
  });

  await tc.step("reference compile-time type safety", () => {
    type SyntheticType = z.infer<typeof table.zoSchema>;
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

    // za.writeDebugFile(`DELETE_ME_DEBUG_table_test.txt`, table);

    // TODO: fix this so we don't just use typeof to find the proper type
    // expectType<{
    //   fk_text_primary_key: () => Any;
    // }>(table.foreignKeys);
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

  await tc.step("table components run-time assurance", () => {
    ta.assertEquals(Array.from(Object.keys(table.columns)), [
      "auto_inc_primary_key",
      "fk_text_primary_key",
      "fk_int_primary_key",
      "fk_text_primary_key_nullable",
      "fk_int_primary_key_nullable",
      "parent_auto_inc_primary_key",
    ]);
    ta.assertEquals(Array.from(Object.keys(table.primaryKey)), [
      "auto_inc_primary_key",
    ]);
    ta.assertEquals(Array.from(Object.keys(table.references)), [
      "auto_inc_primary_key",
      "fk_text_primary_key",
      "fk_int_primary_key",
      "fk_text_primary_key_nullable",
      "fk_int_primary_key_nullable",
      "parent_auto_inc_primary_key",
    ]);
    ta.assertEquals(Array.from(Object.keys(table.foreignKeys)), [
      "fk_text_primary_key",
      "fk_int_primary_key",
      "fk_text_primary_key_nullable",
      "fk_int_primary_key_nullable",
      "parent_auto_inc_primary_key",
    ]);
  });

  await tc.step("SQL DDL with no lint issues", () => {
    const { ctx, ddlOptions, qsContent } = sqlGen();
    ta.assertEquals(
      tmpl.SQL(ddlOptions)`
    ${qsContent.sqlTextLintSummary}

    ${table}`.SQL(ctx),
      uws(`
      -- no SQL lint issues (typicalSqlTextLintManager)

      CREATE TABLE "synthetic_table_with_foreign_keys" (
          "auto_inc_primary_key" INTEGER PRIMARY KEY AUTOINCREMENT,
          "fk_text_primary_key" TEXT NOT NULL,
          "fk_int_primary_key" INTEGER NOT NULL,
          "fk_text_primary_key_nullable" TEXT,
          "fk_int_primary_key_nullable" INTEGER,
          "parent_auto_inc_primary_key" INTEGER,
          FOREIGN KEY("fk_text_primary_key") REFERENCES "synthetic_table_with_uaod_pk"("ua_on_demand_primary_key"),
          FOREIGN KEY("fk_int_primary_key") REFERENCES "synthetic_table_with_auto_inc_pk"("auto_inc_primary_key"),
          FOREIGN KEY("fk_text_primary_key_nullable") REFERENCES "synthetic_table_with_uaod_pk"("ua_on_demand_primary_key"),
          FOREIGN KEY("fk_int_primary_key_nullable") REFERENCES "synthetic_table_with_auto_inc_pk"("auto_inc_primary_key"),
          FOREIGN KEY("parent_auto_inc_primary_key") REFERENCES "synthetic_table_with_foreign_keys"("auto_inc_primary_key")
      );`),
    );
  });

  await tc.step("TODO: tables graph", () => {
  });
});

Deno.test("SQL Aide (SQLa) Table DDL Constraints and documentation", async (tc) => {
  const { tableWithConstraints: table } = syntheticSchema();

  await tc.step("SQL DDL with no lint issues", () => {
    const { ctx, ddlOptions, qsContent } = sqlGen();
    ta.assertEquals(
      tmpl.SQL(ddlOptions)`
    ${qsContent.sqlTextLintSummary}

    ${table}

    ${table.indexes}

    ${qsContent.sqlObjectsComments}`.SQL(ctx),
      uws(`
      -- no SQL lint issues (typicalSqlTextLintManager)

      CREATE TABLE "synthetic_table_with_constraints" (
          "text_primary_key" TEXT PRIMARY KEY NOT NULL,
          "column_unique" TEXT /* UNIQUE COLUMN */ NOT NULL,
          "created_at" DATE,
          UNIQUE("column_unique"),
          UNIQUE("column_unique", "created_at"),
          UNIQUE("text_primary_key", "created_at"),
          UNIQUE(column_one_text, column_three_text_digest) /* CUSTOM CONSTRAINT */
      );

      CREATE INDEX "idx_synthetic_table_with_constraints__column_unique__created_at" ON "synthetic_table_with_constraints"("column_unique", "created_at");
      CREATE UNIQUE INDEX custom_index_name ON "synthetic_table_with_constraints"("text_primary_key", "created_at");

      COMMENT ON table "synthetic_table_with_constraints" IS 'synthetic_table_with_constraints table description';`),
    );
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
      ta.assert(mod.isTableDefinition(table, "synthetic_table_without_pk"));
      const tableRF = mod.tableColumnsRowFactory(
        "synthetic_table_without_pk",
        table.zoSchema.shape,
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
      ta.assert(
        mod.isTableDefinition(table, "synthetic_table_with_auto_inc_pk"),
      );
      const tableRF = mod.tableColumnsRowFactory(
        "synthetic_table_with_auto_inc_pk",
        table.zoSchema.shape,
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

      await innerTC.step("SQL DML basic with multiple rows", () => {
        const { ctx } = sqlGen();
        ta.assertEquals(
          tableRF.insertDML([{ text: "text", int: 423 }, {
            text: "text2",
            int: 455,
          }]).SQL(ctx),
          uws(`
            INSERT INTO "synthetic_table_with_auto_inc_pk" ("text", "text_nullable", "int", "int_nullable")
                   VALUES ('text', NULL, 423, NULL),
                          ('text2', NULL, 455, NULL)`),
        );
      });

      await innerTC.step("SQL DML with SQL text supplier property", () => {
        const { ctx } = sqlGen();
        ta.assertEquals(
          tableRF.insertDML({
            text: "text",
            int: { SQL: () => `select dynamic from somewhere` },
          }).SQL(ctx),
          `INSERT INTO "synthetic_table_with_auto_inc_pk" ("text", "text_nullable", "int", "int_nullable") VALUES ('text', NULL, (select dynamic from somewhere), NULL)`,
        );
      });

      await innerTC.step("SQL DML with SQLa select property", () => {
        const { ctx } = sqlGen();
        const tableRow = tableRF.insertDML({
          text: "text",
          int: 57,
        });

        const tableSF = mod.tableSelectFactory(
          table.tableName,
          table.zoSchema.shape,
        );

        ta.assertEquals(
          tableRF.insertDML({
            text: "text",
            int: tableSF.select(tableRow.insertable),
          }).SQL(ctx),
          `INSERT INTO "synthetic_table_with_auto_inc_pk" ("text", "text_nullable", "int", "int_nullable") VALUES ('text', NULL, (SELECT "auto_inc_primary_key" FROM "synthetic_table_with_auto_inc_pk" WHERE "text" = 'text' AND "int" = 57), NULL)`,
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
              // will try to find name of object first, you can use symbols too
              text: s.untypedSelect(ctx, {
                symbolsFirst: true,
              })`select ${table.symbols.text} from ${table}`, // the value will be a SQL expression
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
      ta.assert(mod.isTableDefinition(table, "synthetic_table_with_text_pk")); // if you want Typescript to type-check specific table

      const tableRF = mod.tableColumnsRowFactory(
        "synthetic_table_with_text_pk",
        table.zoSchema.shape,
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
      ta.assert(mod.isTableDefinition(table, "synthetic_table_with_uaod_pk"));

      const tableRF = mod.tableColumnsRowFactory(
        table.tableName,
        table.zoSchema.shape,
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
      ta.assert(mod.isTableDefinition(table, "synthetic_table_with_uaod_pk"));
      const tableSF = mod.tableSelectFactory(
        table.tableName,
        table.zoSchema.shape,
      );

      await innerTC.step("type safety", () => {
        const insertable = tableSF.prepareFilterable({
          text: "text",
          int: 423,
          uaOnDemandPrimaryKey: "test",
        });
        expectType<
          string | tmpl.SqlTextSupplier<tmpl.SqlEmitContext> | undefined
        >(
          insertable.text,
        );
        expectType<
          number | tmpl.SqlTextSupplier<tmpl.SqlEmitContext> | undefined
        >(
          insertable.int,
        );
      });

      await innerTC.step("SQL DQL", () => {
        const { ctx } = sqlGen();
        ta.assertEquals(
          tableSF.select({
            text: "text",
            int: 423,
            ua_on_demand_primary_key: "test",
          }).SQL(ctx),
          `SELECT "ua_on_demand_primary_key" FROM "synthetic_table_with_uaod_pk" WHERE "ua_on_demand_primary_key" = 'test' AND "text" = 'text' AND "int" = 423`,
        );
      });
    },
  );
});
