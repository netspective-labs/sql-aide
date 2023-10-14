import { zod as z } from "../deps.ts";
import { testingAsserts as ta } from "../deps-test.ts";
import { unindentWhitespace as uws } from "../../lib/universal/whitespace.ts";
import * as tmpl from "../emit/mod.ts";
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
const factory = ds.sqlDomainsFactory<
  Any,
  SyntheticContext,
  d.SqlDomainQS,
  ds.SqlDomainsQS<d.SqlDomainQS>
>();

const sqlGen = () => {
  const ctx: SyntheticContext = {
    ...tmpl.typicalSqlEmitContext(),
    customContextProp1: "customContextProp1Value",
    executedAt: new Date(),
  };
  const ddlOptions = tmpl.typicalSqlTextSupplierOptions<SyntheticContext>();
  const qsContent = tmpl.typicalSqlQualitySystemContent<SyntheticContext>(
    ddlOptions.sqlQualitySystemState,
  );
  return { ctx, ddlOptions, qsContent };
};

Deno.test("SQLa native Zod domains (without references)", async (tc) => {
  await tc.step("typical Zod scalars as SQL domains", async (innerTC) => {
    const domains = factory.sqlDomains({
      text: z.string(),
      text_array: z.array(z.string()),
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
      ta.assert(domains.zoSchema); // zSchema is the Zod schema (untouched)
      ta.assert(domains.zbSchema); // zbSchema is the Zod schema with each property wrapped in Zod baggage proxy
    });

    await innerTC.step("object type safety", () => {
      expectType<{
        text:
          & z.ZodString
          & d.SqlDomainSupplier<
            z.ZodString,
            "text",
            SyntheticContext,
            d.SqlDomainQS
          >;
        text_array:
          & z.ZodArray<z.ZodString>
          & d.SqlDomainSupplier<
            z.ZodArray<z.ZodString>,
            "text_array",
            SyntheticContext,
            d.SqlDomainQS
          >;
        text_nullable:
          & z.ZodOptional<z.ZodString>
          & d.SqlDomainSupplier<
            z.ZodOptional<z.ZodString>,
            "text_nullable",
            SyntheticContext,
            d.SqlDomainQS
          >;
        text_defaultable:
          & z.ZodDefault<z.ZodString>
          & d.SqlDomainSupplier<
            z.ZodDefault<z.ZodString>,
            "text_defaultable",
            SyntheticContext,
            d.SqlDomainQS
          >;
        text_optional_defaultable:
          & z.ZodDefault<z.ZodOptional<z.ZodString>>
          & d.SqlDomainSupplier<
            z.ZodDefault<z.ZodOptional<z.ZodString>>,
            "text_optional_defaultable",
            SyntheticContext,
            d.SqlDomainQS
          >;
        text_defaultable_optional:
          & z.ZodOptional<z.ZodDefault<z.ZodString>>
          & d.SqlDomainSupplier<
            z.ZodOptional<z.ZodDefault<z.ZodString>>,
            "text_defaultable_optional",
            SyntheticContext,
            d.SqlDomainQS
          >;
        int:
          & z.ZodNumber
          & d.SqlDomainSupplier<
            z.ZodNumber,
            "int",
            SyntheticContext,
            d.SqlDomainQS
          >;
        int_nullable:
          & z.ZodOptional<z.ZodNumber>
          & d.SqlDomainSupplier<
            z.ZodOptional<z.ZodNumber>,
            "int",
            SyntheticContext,
            d.SqlDomainQS
          >;
      }>(domains.zbSchema);

      type SyntheticSchema = z.infer<typeof domains.zoSchema>;
      const synthetic: SyntheticSchema = {
        text: "text-required",
        text_array: ["text-required"],
        int: 0,
        text_defaultable: "text_defaultable-value",
        text_optional_defaultable: "text_optional_defaultable-value",
      };
      expectType<{
        text: string;
        text_array: Array<string>;
        text_defaultable: string;
        text_optional_defaultable: string;
        int: number;
        text_nullable?: string | undefined;
        text_defaultable_optional?: string | undefined;
        int_nullable?: number | undefined;
      }>(synthetic);
      ta.assert(domains.zoSchema.parse(synthetic));
    });

    await innerTC.step("SQL types", () => {
      const { ctx } = sqlGen();
      ta.assertEquals(
        Array.from(Object.values(domains.zbSchema)).map((d) => ({
          identifier: d?.sqlDomain.identity,
          sqlDataType: d?.sqlDomain.sqlDataType("create table column").SQL(ctx),
        })),
        [
          { identifier: "text", sqlDataType: "TEXT" },
          { identifier: "text_array", sqlDataType: "TEXT[]" },
          { identifier: "text_nullable", sqlDataType: "TEXT" },
          { identifier: "text_defaultable", sqlDataType: "TEXT" },
          { identifier: "text_optional_defaultable", sqlDataType: "TEXT" },
          { identifier: "text_defaultable_optional", sqlDataType: "TEXT" },
          { identifier: "int", sqlDataType: "INTEGER" },
          { identifier: "int_nullable", sqlDataType: "INTEGER" },
        ],
      );
    });

    await innerTC.step("type-safe symbols", () => {
      const { ctx, ddlOptions } = sqlGen();
      const { symbolSuppliers: ss, symbols: s, identifiers } = domains;
      const i = identifiers(ctx);
      const symsFixture = tmpl.SQL(ddlOptions)`
        select ${ss.text_nullable}, ${s.text_optional_defaultable}, ${i.int}
          from Y`;
      ta.assertEquals(
        symsFixture.SQL(ctx),
        uws(`
          select "text_nullable", "text_optional_defaultable", "int"
            from Y`),
      );
    });

    await innerTC.step("qualified names injections", () => {
      const syntheticNS: tmpl.SqlNamespaceSupplier = {
        sqlNamespace: "synthetic",
        qualifiedNames: (ctx, baseNS) => {
          const ns = baseNS ?? ctx.sqlNamingStrategy(ctx);
          const nsQualifier = tmpl.qualifyName(ns.schemaName("synthetic"));
          return tmpl.qualifiedNamingStrategy(ns, nsQualifier);
        },
      };

      const { ctx, ddlOptions } = sqlGen();
      const qn = domains.qualifiedIdentifiers(ctx, {
        quoteIdentifiers: true,
        qnss: syntheticNS,
      });
      const injectionsFixture = tmpl.SQL(ddlOptions)`
        select ${qn.text_nullable}, ${qn.text_optional_defaultable}
          from ${qn}`;
      ta.assertEquals(
        injectionsFixture.SQL(ctx),
        uws(`
          select "synthetic"."text_nullable", "synthetic"."text_optional_defaultable"
            from "synthetic"."anonymous1"`),
      );
    });
  });
});

Deno.test("SQLa native Zod domains (with references)", async (tc) => {
  const srcDomains = factory.sqlReferencableDomains({
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

  await tc.step("refs source type safety", () => {
    expectType<{
      text1_src_required: () => z.ZodString;
      text2_src_nullable: () => z.ZodString;
      int1_src_required: () => z.ZodNumber;
      int2_src_nullable: () => z.ZodNumber;
    }>(srcDomains.infer);
  });
  const srcRefs = srcDomains.infer;
  const refDomains = factory.sqlDomains({
    non_ref_text: z.string(),
    non_ref_array: z.array(z.string()),
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

  await tc.step("equivalence but not identical", () => {
    // need to make sure references don't just return their original sources
    // but instead create new copies
    ta.assert(
      (srcDomains.zoSchema.shape.text1_src_required as Any) !==
        (refDomains.zoSchema.shape
          .ref_text1_required_in_src_and_dest as Any),
    );
  });

  await tc.step("properties transferred", () => {
    ta.assertEquals(
      srcDomains.zoSchema.shape.text1_src_required.description,
      "srcDomains.text1",
    );
    ta.assertEquals(
      refDomains.zoSchema.shape.ref_text1_required_in_src_and_dest.description,
      "refDomains.ref_text1_required",
    );
    ta.assertEquals(
      refDomains.zoSchema.shape.ref_text1_nullable.description,
      "refDomains.ref_text1_nullable",
    );
  });

  await tc.step("type expectations", () => {
    const { shape, keys: shapeKeys } = refDomains.zoSchema._getCached();
    ta.assertEquals(shapeKeys.length, 9);
    expectType<{
      non_ref_text: z.ZodString;
      non_ref_array: z.ZodArray<z.ZodString>;
      non_ref_int: z.ZodNumber;
      ref_text1_required_in_src_and_dest: z.ZodString;
      ref_text1_nullable: z.ZodOptional<z.ZodString>;
      ref_text2_dest_not_nullable: z.ZodString;
      ref_text2_dest_nullable: z.ZodOptional<z.ZodString>;
      non_ref_text_nullable: z.ZodOptional<z.ZodString>;
      non_ref_int_nullable: z.ZodOptional<z.ZodNumber>;
    }>(shape);

    expectType<{
      ref_text1_required_in_src_and_dest:
        & z.ZodString
        & d.SqlDomainSupplier<
          z.ZodString,
          "ref_text1_required_in_src_and_dest",
          SyntheticContext,
          d.SqlDomainQS
        >;
      ref_text1_nullable:
        & z.ZodOptional<z.ZodString>
        & d.SqlDomainSupplier<
          z.ZodOptional<z.ZodString>,
          "ref_text1_nullable",
          SyntheticContext,
          d.SqlDomainQS
        >;
      ref_text2_dest_not_nullable:
        & z.ZodString
        & d.SqlDomainSupplier<
          z.ZodString,
          "ref_text2_dest_not_nullable",
          SyntheticContext,
          d.SqlDomainQS
        >;
      ref_text2_dest_nullable:
        & z.ZodOptional<z.ZodString>
        & d.SqlDomainSupplier<
          z.ZodOptional<z.ZodString>,
          "ref_text2_dest_nullable",
          SyntheticContext,
          d.SqlDomainQS
        >;
    }>(
      refDomains.zbSchema,
    );

    type SyntheticSchema = z.infer<typeof refDomains.zoSchema>;
    const synthetic: SyntheticSchema = {
      non_ref_text: "non-ref-text-value",
      non_ref_array: ["non-ref-text-value"],
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

  await tc.step("TODO: referenced/references graph", () => {
    // TODO: add test cases to make sure all the refs are proper
    // console.dir(d.globalDefaultDomainsGraph, { depth: 5 });
  });
});
