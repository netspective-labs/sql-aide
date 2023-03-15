import { zod as z } from "../deps.ts";
import { testingAsserts as ta } from "../deps-test.ts";
import * as tmpl from "../sql.ts";
import * as d from "./domain.ts";
import * as ds from "./domains.ts";

// deno-lint-ignore no-explicit-any
type Any = any; // make it easy on linter

const expectType = <T>(_value: T) => {
  // Do nothing, the TypeScript compiler handles this for us
};

type SyntheticContext = tmpl.SqlEmitContext & {
  readonly customContextProp1: string;
  readonly executedAt: Date;
};
const factory = ds.sqlDomainsFactory<Any, SyntheticContext>();

const sqlGen = () => {
  const ctx: SyntheticContext = {
    ...tmpl.typicalSqlEmitContext(),
    customContextProp1: "customContextProp1Value",
    executedAt: new Date(),
  };
  const ddlOptions = tmpl.typicalSqlTextSupplierOptions();
  const lintState = tmpl.typicalSqlLintSummaries(
    ddlOptions.sqlTextLintState,
  );
  return { ctx, ddlOptions, lintState };
};

Deno.test("SQLa native Zod domains", async (tc) => {
  await tc.step("typical Zod scalars as SQL domains", async (innerTC) => {
    const domains = factory.sqlDomains({
      text: z.string(),
      text_nullable: z.string().optional(),
      text_defaultable: z.string().default("text_defaultable-defaultValue"),
      text_optional_defaultable: z.string().optional().default(
        "text_defaultable-defaultValue",
      ),
      text_defaultable_optional: z.string().default(
        "text_defaultable-defaultValue",
      ).optional(),
      int: z.number(),
      int_nullable: z.number().optional(),
      // TODO: add all the other scalars and types
    });

    await innerTC.step("objects and shapes", () => {
      ta.assert(domains.zSchema); // zSchema is the Zod schema (untouched)
      ta.assert(domains.zbSchema); // zbSchema is the Zod schema with each property wrapped in Zod baggage proxy
      ta.assert(domains.sdSchema); // zbSchema is the Zod schema with each property's SqlDomain instance
    });

    await innerTC.step("object type safety", () => {
      expectType<{
        text: d.SqlDomain<z.ZodString, SyntheticContext, "text">;
        text_nullable: d.SqlDomain<
          z.ZodOptional<z.ZodString>,
          SyntheticContext,
          "text_nullable"
        >;
        text_defaultable: d.SqlDomain<
          z.ZodDefault<z.ZodString>,
          SyntheticContext,
          "text_defaultable"
        >;
        text_optional_defaultable: d.SqlDomain<
          z.ZodDefault<z.ZodOptional<z.ZodString>>,
          SyntheticContext,
          "text_optional_defaultable"
        >;
        text_defaultable_optional: d.SqlDomain<
          z.ZodOptional<z.ZodDefault<z.ZodString>>,
          SyntheticContext,
          "text_defaultable_optional"
        >;
        int: d.SqlDomain<z.ZodNumber, SyntheticContext, "int">;
        int_nullable: d.SqlDomain<
          z.ZodOptional<z.ZodNumber>,
          SyntheticContext,
          "int_nullable"
        >;
      }>(domains.sdSchema);

      type SyntheticSchema = z.infer<typeof domains.zSchema>;
      const synthetic: SyntheticSchema = {
        text: "text-required",
        int: 0,
        text_defaultable: "text_defaultable-value",
        text_optional_defaultable: "text_optional_defaultable-value",
      };
      expectType<{
        text: string;
        text_defaultable: string;
        text_optional_defaultable: string;
        int: number;
        text_nullable?: string | undefined;
        text_defaultable_optional?: string | undefined;
        int_nullable?: number | undefined;
      }>(synthetic);
      ta.assert(domains.zSchema.parse(synthetic));
    });

    await innerTC.step("SQL types", () => {
      const { ctx } = sqlGen();
      ta.assertEquals(
        Array.from(Object.values(domains.sdSchema)).map((d) => ({
          identifier: d?.identity,
          sqlDataType: d?.sqlDataType("create table column").SQL(ctx),
        })),
        [
          { identifier: "text", sqlDataType: "TEXT" },
          { identifier: "text_nullable", sqlDataType: "TEXT" },
          { identifier: "text_defaultable", sqlDataType: "TEXT" },
          { identifier: "text_optional_defaultable", sqlDataType: "TEXT" },
          { identifier: "text_defaultable_optional", sqlDataType: "TEXT" },
          { identifier: "int", sqlDataType: "INTEGER" },
          { identifier: "int_nullable", sqlDataType: "INTEGER" },
        ],
      );
    });
  });
});
