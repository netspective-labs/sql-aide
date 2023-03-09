import { zod as z } from "./deps.ts";
import { testingAsserts as ta } from "./deps-test.ts";
import * as tmpl from "./sql.ts";
import * as zd from "./domain.ts";
import * as t from "./table.ts";
import { unindentWhitespace as uws } from "./whitespace.ts";

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

const syntheticColumns = {
  text: z.string(),
  text_nullable: z.string().optional(),
  int: z.number(),
  int_nullable: z.number().optional(),
  // TODO: add all the other scalars and types
};

const syntheticSchema = {
  tableWithoutPK: t.tableDefinition("synthetic_table_without_pk", {
    ...syntheticColumns,
  }),
  tableWithAutoIncPK: t.tableDefinition("synthetic_table_with_auto_inc_pk", {
    auto_inc_primary_key: t.autoIncPrimaryKey(),
    ...syntheticColumns,
  }),
  tableWithTextPK: t.tableDefinition("synthetic_table_with_text_pk", {
    text_primary_key: t.primaryKey(),
    ...syntheticColumns,
  }),
};

Deno.test("SQL Aide (SQLa) table structure", async (tc) => {
  /**
   * Test strategy:
   * Step 1. Validate that a table with all columns types except primary keys
   *         can be properly defined and are type-safe.
   * Step 2. Check that auto-inc primary keys can be defined and are type-safe
   * Step 3. Check that text primary keys can be defined and are type-safe
   *
   * General approach is to separate the tests so that no duplicate testing is
   * done (meaning don't just test the same stuff in Step 3 was in 2 and 1).
   */

  await tc.step(
    "[1] valid table and columns (without any PKs)",
    async (innerTC) => {
      const { tableWithoutPK: table } = syntheticSchema;
      ta.assert(zd.isSqlDomainsSupplier(table));
      ta.assert(t.isTableDefinition(table)); // if you don't care which table it is
      ta.assert(t.isTableDefinition(table, "synthetic_table_without_pk")); // if you want Typescript to type-check specific table
      ta.assertEquals(t.isTableDefinition(table, "invalid_table_name"), false);

      await innerTC.step("Type safety", () => {
        expectType<zd.SqlDomain<z.ZodType<string, z.ZodStringDef>, Any>>(
          table.sdSchema.text,
        );
        expectType<
          zd.SqlDomain<
            z.ZodType<string | undefined, z.ZodOptionalDef<z.ZodString>>,
            Any
          >
        >(table.sdSchema.text_nullable);
        expectType<zd.SqlDomain<z.ZodType<number, z.ZodNumberDef>, Any>>(
          table.sdSchema.int,
        );
        expectType<
          zd.SqlDomain<
            z.ZodType<number | undefined, z.ZodOptionalDef<z.ZodNumber>>,
            Any
          >
        >(table.sdSchema.int_nullable);

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
              "text_nullable" TEXT NOT NULL,
              "int" INTEGER NOT NULL,
              "int_nullable" INTEGER NOT NULL
          );`),
        );
      });
    },
  );

  await tc.step("[2] valid auto-inc PK table and columns", async (innerTC) => {
    const { tableWithAutoIncPK: table } = syntheticSchema;
    ta.assert(t.isTableDefinition(table, "synthetic_table_with_auto_inc_pk"));

    await innerTC.step("Type safety", () => {
      // tableDefinition() properly "types" table.primaryKey to be the collection
      // of PKs - since we have a single PK, make sure it has at least that one
      expectType<
        { auto_inc_primary_key: typeof table.primaryKey.auto_inc_primary_key }
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

        CREATE TABLE "synthetic_table_with_auto_inc_pk" (
            "auto_inc_primary_key" INTEGER NOT NULL,
            "text" TEXT NOT NULL,
            "text_nullable" TEXT NOT NULL,
            "int" INTEGER NOT NULL,
            "int_nullable" INTEGER NOT NULL
        );`),
      );
    });
  });

  await tc.step("[3] valid text PK table and columns", async (innerTC) => {
    const { tableWithTextPK: table } = syntheticSchema;
    ta.assert(t.isTableDefinition(table)); // if you don't care which table it is
    ta.assert(t.isTableDefinition(table, "synthetic_table_with_text_pk")); // if you want Typescript to type-check specific table
    ta.assertEquals(t.isTableDefinition(table, "invalid_table_name"), false);

    await innerTC.step("Type safety", () => {
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
            "text_primary_key" TEXT NOT NULL,
            "text" TEXT NOT NULL,
            "text_nullable" TEXT NOT NULL,
            "int" INTEGER NOT NULL,
            "int_nullable" INTEGER NOT NULL
        );`),
      );
    });
  });

  await tc.step("TODO: foreign keys", () => {});
  await tc.step("TODO: indexes", () => {});
  await tc.step("TODO: constraints", () => {});
});
