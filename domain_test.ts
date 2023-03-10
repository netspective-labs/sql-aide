import { zod as z } from "./deps.ts";
import { testingAsserts as ta } from "./deps-test.ts";
import * as tmpl from "./sql.ts";
import * as d from "./domain.ts";

// deno-lint-ignore no-explicit-any
type Any = any; // make it easy on linter

const expectType = <T>(_value: T) => {
  // Do nothing, the TypeScript compiler handles this for us
};

type SyntheticContext = tmpl.SqlEmitContext;

const sqlGen = () => {
  const ctx: SyntheticContext = tmpl.typicalSqlEmitContext();
  const ddlOptions = tmpl.typicalSqlTextSupplierOptions();
  const lintState = tmpl.typicalSqlLintSummaries(
    ddlOptions.sqlTextLintState,
  );
  return { ctx, ddlOptions, lintState };
};

Deno.test("Zod-based SQL domains", async (tc) => {
  await tc.step("valid domains", async (innerTC) => {
    const domains = d.sqlDomains({
      text: z.string(),
      text_nullable: z.string().optional(),
      int: z.number(),
      int_nullable: z.number().optional(),
      // TODO: add all the other scalars and types
    });
    ta.assert(d.isSqlDomainsSupplier(domains));

    await innerTC.step("Type safety", () => {
      expectType<d.SqlDomain<z.ZodType<string, z.ZodStringDef>, Any>>(
        domains.sdSchema.text,
      );
      expectType<
        d.SqlDomain<
          z.ZodType<string | undefined, z.ZodOptionalDef<z.ZodString>>,
          Any
        >
      >(domains.sdSchema.text_nullable);
      expectType<d.SqlDomain<z.ZodType<number, z.ZodNumberDef>, Any>>(
        domains.sdSchema.int,
      );
      expectType<
        d.SqlDomain<
          z.ZodType<number | undefined, z.ZodOptionalDef<z.ZodNumber>>,
          Any
        >
      >(domains.sdSchema.int_nullable);

      type SyntheticSchema = z.infer<typeof domains.zSchema>;
      const synthetic: SyntheticSchema = {
        text: "required",
        int: 0,
      };
      expectType<{
        text: string;
        int: number;
        text_nullable?: string | undefined;
        int_nullable?: number | undefined;
      }>(synthetic);
      ta.assert(synthetic);
      ta.assertEquals(synthetic.text, "required");
      ta.assertEquals(domains.lintIssues.length, 0);
      ta.assertEquals(synthetic.int, 0);
      ta.assertEquals(synthetic.text_nullable, undefined);
      ta.assertEquals(synthetic.int_nullable, undefined);
    });

    await innerTC.step("SQL types", () => {
      const { ctx } = sqlGen();
      ta.assertEquals(
        domains.domains.map((d) => ({
          identifier: d.identity,
          sqlDataType: d.sqlDataType("create table column").SQL(ctx),
        })),
        [
          { identifier: "text", sqlDataType: "TEXT" },
          { identifier: "text_nullable", sqlDataType: "TEXT" },
          { identifier: "int", sqlDataType: "INTEGER" },
          { identifier: "int_nullable", sqlDataType: "INTEGER" },
        ],
      );
    });
  });
});

Deno.test("Zod Schema Proxy", () => {
  const syntheticSchema = z.object({
    text: z.string(),
    url: z.string().url(),
    number: z.number(),
  });

  const proxiedSchema = d.zodSchemaProxy(syntheticSchema, {
    // First argument to argument will be Zod-parsed value
    isText: (synthetic, value: string) => {
      return synthetic.text === value;
    },

    isNumberInRange: (synthetic) => {
      return synthetic.number >= 10 && synthetic.number <= 100;
    },

    // `this` which will be the parsed value
    aliasForText() {
      return this.text;
    },
  });

  const parsedSynthetic = proxiedSchema.parse({
    text: "Sample text",
    url: "https://github.com/shah",
    number: 52,
  });

  // First argument to argument will be Zod-parsed value, start with second
  ta.assert(parsedSynthetic.isText("Sample text"));
  ta.assertEquals(parsedSynthetic.aliasForText(), "Sample text");
  ta.assert(parsedSynthetic.text); // the Zod Schema is accessible
});
