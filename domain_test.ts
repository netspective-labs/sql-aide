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
    ta.assert(domains.sdSchema);

    await innerTC.step("type safety", () => {
      ta.assert(
        !domains.sdSchema.text.isNullable(),
        "text column should not be nullable",
      );
      ta.assert(
        domains.sdSchema.text_nullable.isNullable(),
        "text_nullable column should be nullable",
      );

      expectType<d.SqlDomain<z.ZodType<string, z.ZodStringDef>, Any, Any>>(
        domains.sdSchema.text,
      );
      expectType<
        d.SqlDomain<
          z.ZodType<string | undefined, z.ZodOptionalDef<z.ZodString>>,
          Any,
          Any
        >
      >(domains.sdSchema.text_nullable);
      expectType<d.SqlDomain<z.ZodType<number, z.ZodNumberDef>, Any, Any>>(
        domains.sdSchema.int,
      );
      expectType<
        d.SqlDomain<
          z.ZodType<number | undefined, z.ZodOptionalDef<z.ZodNumber>>,
          Any,
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
        Array.from(Object.values(domains.sdSchema)).map((d) => ({
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
    const srcDomains = d.sqlReferencableDomains({
      text1_src_required: z.string().describe("srcDomains.text1"),
      text2_src_nullable: z.string().optional().describe(
        "srcDomains.text2_src_nullable",
      ),
      int1_src_required: z.number().describe("srcDomains.int1"),
      int2_src_nullable: z.number().optional().describe(
        "srcDomains.int2_src_nullable",
      ),
      // TODO: add all the other scalars and types
    });

    await innerTC.step("refs source type safety", () => {
      expectType<{
        text1_src_required: () => z.ZodString;
        text2_src_nullable: () => z.ZodString;
        int1_src_required: () => z.ZodNumber;
        int2_src_nullable: () => z.ZodNumber;
      }>(srcDomains.infer);
    });

    await innerTC.step("refs destination type safety", async (innerInnerTC) => {
      const srcRefs = srcDomains.infer;
      const refDomains = d.sqlDomains({
        non_ref_text: z.string(),
        non_ref_int: z.number(),
        ref_text1_required_in_src_and_dest: srcRefs.text1_src_required()
          .describe(
            "refDomains.ref_text1_required",
          ),
        ref_text1_nullable: srcRefs.text1_src_required().optional().describe(
          "refDomains.ref_text1_nullable",
        ),
        ref_text2_dest_not_nullable: srcRefs.text2_src_nullable()
          .describe("refDomains.ref_text2_dest_not_nullable"),
        ref_text2_dest_nullable: srcRefs.text2_src_nullable()
          .optional().describe("refDomains.ref_text2_dest_nullable"),
        non_ref_text_nullable: z.string().optional(),
        non_ref_int_nullable: z.number().optional(),
      });

      await innerInnerTC.step("equivalence but not identical", () => {
        // need to make sure references don't just return their original sources
        // but instead create new copies
        ta.assert(
          (srcDomains.zSchema.shape.text1_src_required as Any) !==
            (refDomains.zSchema.shape
              .ref_text1_required_in_src_and_dest as Any),
        );
        ta.assert(
          srcDomains.zSchema.shape.text1_src_required.description ==
            "srcDomains.text1",
        );
        ta.assert(
          refDomains.zSchema.shape.ref_text1_required_in_src_and_dest
            .description ==
            "refDomains.ref_text1_required",
        );
      });

      await innerInnerTC.step("type expectations", () => {
        const { shape, keys: shapeKeys } = refDomains.zSchema._getCached();
        ta.assertEquals(shapeKeys.length, 8);
        expectType<{
          non_ref_text: z.ZodString;
          non_ref_int: z.ZodNumber;
          ref_text1_required_in_src_and_dest: z.ZodString;
          ref_text1_nullable: z.ZodOptional<z.ZodString>;
          ref_text2_dest_not_nullable: z.ZodString;
          ref_text2_dest_nullable: z.ZodOptional<z.ZodString>;
          non_ref_text_nullable: z.ZodOptional<z.ZodString>;
          non_ref_int_nullable: z.ZodOptional<z.ZodNumber>;
        }>(shape);

        expectType<{
          ref_text1_required_in_src_and_dest: d.SqlDomain<
            z.ZodType<string, z.ZodStringDef>,
            SyntheticContext,
            "ref_text1_required"
          >;
          // ref_text1_nullable: d.SqlDomain<
          //   z.ZodOptional<z.ZodString>,
          //   SyntheticContext,
          //   "ref_text1_nullable"
          // >;
          // ref_text2_dest_not_nullable: d.SqlDomain<z.ZodType<string, z.ZodStringDef>, Any, Any>;
          // ref_text2_dest_nullable: d.SqlDomain<z.ZodType<string, z.ZodStringDef>, Any, Any>;
        }>(
          refDomains.sdSchema,
        );

        type SyntheticSchema = z.infer<typeof refDomains.zSchema>;
        const synthetic: SyntheticSchema = {
          non_ref_text: "non-ref-text-value",
          non_ref_int: 23567,
          ref_text1_required_in_src_and_dest: "ref-text1",
          ref_text2_dest_not_nullable:
            "ref-text2 must be non-nullable in destination even though it's nullable in the source",
          ref_text2_dest_nullable: undefined, // this one is OK to be undefined since it's marked as such in the destination
        };
        ta.assert(synthetic);
        expectType<{
          ref_text1_required_in_src_and_dest: string;
          ref_text2_dest_not_nullable: string;
          ref_text1_nullable?: string | undefined;
          ref_text2_dest_nullable?: string | undefined;
        }>(synthetic);
      });

      await innerInnerTC.step("TODO: referenced/references graph", () => {
        // TODO: add test cases to make sure all the refs are proper
        // console.dir(d.globalDefaultDomainsGraph, { depth: 5 });
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
      const sqlDomain = d.sqlDomain<z.ZodNumber, Context, string>(zodSchema);
      const customSD:
        & d.SqlDomain<z.ZodNumber, Context, Any>
        & MyCustomColumnDefn = {
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
      const trickTypeScript = d.sqlDomainZTE.withEnrichment(
        zodSchema,
        () => customSD,
      );
      expectType<
        & z.ZodNumber
        & d.SqlDomain<z.ZodNumber, Context, Any>
        & MyCustomColumnDefn
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
    ta.assert(domains.sdSchema);
    ta.assert(isMyCustomColumnDefn(domains.sdSchema.custom_domain));

    await innerTC.step("type safety", () => {
      expectType<d.SqlDomain<z.ZodType<number, z.ZodNumberDef>, Any, Any>>(
        domains.sdSchema.custom_domain,
      );
      expectType<d.SqlDomain<z.ZodType<string, z.ZodStringDef>, Any, Any>>(
        domains.sdSchema.text,
      );
      expectType<
        d.SqlDomain<
          z.ZodType<string | undefined, z.ZodOptionalDef<z.ZodString>>,
          Any,
          Any
        >
      >(domains.sdSchema.text_nullable);
      expectType<d.SqlDomain<z.ZodType<number, z.ZodNumberDef>, Any, Any>>(
        domains.sdSchema.int,
      );
      expectType<
        d.SqlDomain<
          z.ZodType<number | undefined, z.ZodOptionalDef<z.ZodNumber>>,
          Any,
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
        Array.from(Object.values(domains.sdSchema)).map((d) => ({
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
