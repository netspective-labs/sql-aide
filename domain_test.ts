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
  await tc.step("native zod domains", async (innerTC) => {
    const domains = d.sqlDomains({
      text: z.string(),
      text_nullable: z.string().optional(),
      int: z.number(),
      int_nullable: z.number().optional(),
      // TODO: add all the other scalars and types
    });
    ta.assert(d.isSqlDomainsSupplier(domains));

    await innerTC.step("type safety", () => {
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

  await tc.step("references", async (innerTC) => {
    const srcDomains = d.sqlDomains({
      text1: z.string().describe("srcDomains.text1"),
      text2_src_nullable: z.string().optional().describe(
        "srcDomains.text2_src_nullable",
      ),
      int1: z.number().describe("srcDomains.int1"),
      int2_src_nullable: z.number().optional().describe(
        "srcDomains.int2_src_nullable",
      ),
      // TODO: add all the other scalars and types
    });

    await innerTC.step("src type safety", () => {
      expectType<z.ZodType<string, z.ZodStringDef, string> & d.ReferenceSource>(
        srcDomains.references.text1(),
      );
      expectType<z.ZodString>(srcDomains.references.text2_src_nullable());
      expectType<z.ZodType<number, z.ZodNumberDef, number> & d.ReferenceSource>(
        srcDomains.references.int1(),
      );
      expectType<z.ZodNumber & d.ReferenceSource>(
        srcDomains.references.int2_src_nullable(),
      );
    });

    await innerTC.step("destination type safety", async (innerInnerTC) => {
      const refDomains = d.sqlDomains({
        ref_text1: srcDomains.references.text1().describe(
          "refDomains.ref_text1",
        ),
        ref_text1_nullable: srcDomains.references.text1().optional().describe(
          "refDomains.ref_text1_nullable",
        ),
        ref_text2_dest_not_nullable: srcDomains.references.text2_src_nullable()
          .describe("refDomains.ref_text2_dest_not_nullable"),
        ref_text2_dest_nullable: srcDomains.references.text2_src_nullable()
          .optional().describe("refDomains.ref_text2_dest_nullable"),
      });

      await innerInnerTC.step("equivalence but not identical", () => {
        // need to make sure references don't just return their original sources
        // but instead create new copies
        ta.assert(
          (srcDomains.zSchema.shape.text1 as Any) !==
            (refDomains.zSchema.shape.ref_text1 as Any),
        );
        ta.assert(
          srcDomains.zSchema.shape.text1.description ==
            "srcDomains.text1",
        );
        ta.assert(
          refDomains.zSchema.shape.ref_text1.description ==
            "refDomains.ref_text1",
        );
      });

      await innerInnerTC.step("type expectations", () => {
        expectType<d.SqlDomain<z.ZodType<string, z.ZodStringDef>, Any>>(
          refDomains.sdSchema.ref_text1,
        );
        expectType<
          d.SqlDomain<
            z.ZodType<
              string | undefined,
              z.ZodOptionalDef<
                z.ZodType<string, z.ZodStringDef, string> & d.ReferenceSource
              >,
              string | undefined
            >,
            tmpl.SqlEmitContext,
            string
          >
        >(refDomains.sdSchema.ref_text1_nullable);
        expectType<
          d.SqlDomain<
            z.ZodType<string, z.ZodStringDef, string>,
            tmpl.SqlEmitContext,
            string
          >
        >(
          refDomains.sdSchema.ref_text2_dest_not_nullable,
        );
        expectType<
          d.SqlDomain<
            z.ZodType<
              string | undefined,
              z.ZodOptionalDef<z.ZodString & d.ReferenceSource>,
              string | undefined
            >,
            tmpl.SqlEmitContext,
            string
          >
        >(
          refDomains.sdSchema.ref_text2_dest_nullable,
        );

        type SyntheticSchema = z.infer<typeof refDomains.zSchema>;
        const synthetic: SyntheticSchema = {
          ref_text1: "ref-text1",
          ref_text2_dest_not_nullable:
            "ref-text2 must be non-nullable in destination even though it's nullable in the source",
          ref_text2_dest_nullable: undefined, // this one is OK to be undefined since it's marked as such in the destination
        };
        ta.assert(synthetic);
        expectType<SyntheticSchema>(synthetic);
      });

      await innerInnerTC.step("TODO: referenced/references graph", () => {
        // TODO: add test cases to make sure all the refs are proper
      });
    });
  });

  await tc.step("native zod domains plus a custom domain", async (innerTC) => {
    type MyCustomColumnDefn = {
      readonly isCustomProperty1: true;
      readonly customPropertyValue: number;
    };
    const isMyCustomColumnDefn = (o: unknown): o is MyCustomColumnDefn => {
      return (o && typeof o === "object" && "isCustomProperty1" in o &&
          "customPropertyValue" in o &&
          typeof o.customPropertyValue === "number")
        ? true
        : false;
    };

    function customDomain<Context extends tmpl.SqlEmitContext>() {
      const zodSchema = z.number();
      const sqlDomain = d.sqlDomain<z.ZodNumber, Context>(zodSchema);
      const customSD: d.SqlDomain<z.ZodNumber, Context> & MyCustomColumnDefn = {
        ...sqlDomain,
        isCustomProperty1: true,
        customPropertyValue: 2459,
      };
      ta.assert(isMyCustomColumnDefn(customSD));

      // we're "wrapping" a Zod type so we mutate the zod schema to hold our
      // custom properties in a single object and then just return the zod
      // schema so it can be used as-is; we need to "teach" (or "trick")
      // TypeScript into thinking that the mutated zod object is a
      // MyCustomColumnDefn in case any further strongly typed actions need to
      // take place (like downstream type-building)
      const trickTypeScript = d.zodTypeSqlDomain<
        z.ZodNumber,
        typeof customSD,
        Context,
        string
      >(zodSchema, customSD);
      expectType<
        z.ZodNumber & d.SqlDomain<z.ZodNumber, Context> & MyCustomColumnDefn
      >(trickTypeScript);
      return trickTypeScript;
    }

    const domains = d.sqlDomains({
      custom_domain: customDomain(),
      text: z.string(),
      text_nullable: z.string().optional(),
      int: z.number(),
      int_nullable: z.number().optional(),
      // TODO: add all the other scalars and types
    });
    ta.assert(d.isSqlDomainsSupplier(domains));
    ta.assert(isMyCustomColumnDefn(domains.sdSchema.custom_domain));

    await innerTC.step("type safety", () => {
      expectType<d.SqlDomain<z.ZodType<number, z.ZodNumberDef>, Any>>(
        domains.sdSchema.custom_domain,
      );
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
        custom_domain: 283476,
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
      ta.assertEquals(synthetic.custom_domain, 283476);
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
          { identifier: "custom_domain", sqlDataType: "INTEGER" },
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
