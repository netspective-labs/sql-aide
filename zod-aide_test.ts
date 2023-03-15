import { zod as z } from "./deps.ts";
import { testingAsserts as ta } from "./deps-test.ts";
import * as za from "./zod-aide.ts";

const expectType = <T>(_value: T) => {
  // Do nothing, the TypeScript compiler handles this for us
};

Deno.test("Zod Aide unwrapped clone", () => {
  // these are wrapped in optional, default, and nullable behaviors
  const text = z.string();
  const textOptional = z.string().optional();
  const textDefaultable = z.string().optional().default(
    "textDefaultable defaultValue",
  );
  const textNullable = z.string().nullable();

  // xyzUC is "unwrapped clone" (using Zod lingo), xyzUC is bare clone of xyz
  const textUC = za.clonedZodType(text);
  expectType<z.ZodString>(textUC);
  ta.assert(!text.isOptional());

  const textOptionalUC = za.coreZTA(za.clonedZodType(textOptional));
  expectType<z.ZodString>(textOptionalUC);
  ta.assert(textOptional.isOptional() && !textOptionalUC.isOptional());

  const textDefaultableUC = za.coreZTA(za.clonedZodType(textDefaultable));
  expectType<z.ZodString>(textDefaultableUC);
  ta.assertEquals(
    textDefaultable.parse(undefined),
    "textDefaultable defaultValue",
  );
  ta.assertThrows(() => textDefaultableUC.parse(undefined));

  const textNullableUC = za.coreZTA(za.clonedZodType(textNullable));
  expectType<z.ZodString>(textNullableUC);
  ta.assert(textNullable.isNullable() && !textNullableUC.isNullable());

  // after cloning, adding behaviors like .optional() should still work
  const textDefaultableUCO = za.coreZTA(za.clonedZodType(textDefaultable))
    .optional().default("textDefaultableUCO default value");
  expectType<z.ZodDefault<z.ZodOptional<z.ZodString>>>(textDefaultableUCO);
  ta.assertEquals(
    textDefaultableUCO.parse(undefined),
    "textDefaultableUCO default value",
  );
});

Deno.test("Zod Aide enrichments", async (tc) => {
  type SyntheticEnrichment = {
    property1: string;
    property2: number;
  };

  type SyntheticEnrichmentSupplier = {
    syntheticEnrichment: SyntheticEnrichment;
  };

  const se = za.zodEnrichment<
    SyntheticEnrichment,
    SyntheticEnrichmentSupplier
  >("syntheticEnrichment");

  await tc.step("originals zodEnrichment", async (innerTC) => {
    const unenrichedText = z.string();
    const unenrichedTextOptional = z.string().optional();
    const unenrichedTextDefaultable = z.string().default("defaultValue");
    const unenrichedTextNullable = z.string().nullable();

    const enrichedText = se.withEnrichment(unenrichedText, () => ({
      property1: "enrichedText",
      property2: 1285,
    }));
    const enrichedTextOptional = se.withEnrichment(
      unenrichedTextOptional,
      () => ({
        property1: "enrichedTextOptional",
        property2: 5648,
      }),
    );
    const enrichedTextDefaultable = se.withEnrichment(
      unenrichedTextDefaultable,
      () => ({
        property1: "enrichedTextDefaultable",
        property2: 348,
      }),
    );
    const enrichedTextNullable = se.withEnrichment(
      unenrichedTextNullable,
      () => ({
        property1: "enrichedTextNullable",
        property2: 12398,
      }),
    );

    await innerTC.step("compile-time type safety", () => {
      expectType<z.ZodString & SyntheticEnrichment>(enrichedText);
      expectType<z.ZodOptional<z.ZodString> & SyntheticEnrichment>(
        enrichedTextOptional,
      );
      expectType<z.ZodDefault<z.ZodString> & SyntheticEnrichment>(
        enrichedTextDefaultable,
      );
      expectType<z.ZodNullable<z.ZodString> & SyntheticEnrichment>(
        enrichedTextNullable,
      );
    });

    await innerTC.step("run-time type safety", () => {
      ta.assert(se.isEnrichedType(enrichedText));
      ta.assert(se.isEnrichedType(enrichedTextOptional));
      ta.assert(se.isEnrichedType(enrichedTextDefaultable));
      ta.assert(se.isEnrichedType(enrichedTextNullable));

      ta.assert(se.isEnrichedDef(enrichedText._def));
      ta.assert(se.isEnrichedDef(enrichedTextOptional._def));
      ta.assert(se.isEnrichedDef(enrichedTextDefaultable._def));
      ta.assert(se.isEnrichedDef(enrichedTextNullable._def));
    });

    await innerTC.step("de-enrich (should be run last)", () => {
      // always run this last since it mutates the enrichments
      ta.assert(!se.isEnrichedType(se.deenriched(enrichedText)));
      ta.assert(!se.isEnrichedType(se.deenriched(enrichedTextOptional)));
      ta.assert(!se.isEnrichedType(se.deenriched(enrichedTextDefaultable)));
      ta.assert(!se.isEnrichedType(se.deenriched(enrichedTextNullable)));
    });
  });
});

Deno.test("Zod Aide ZodType Baggage", async (tc) => {
  type SyntheticBaggage = {
    property1: string;
    property2: number;
  };

  type SyntheticBaggageSupplier = {
    syntheticBaggage: SyntheticBaggage;
  };

  const sb = za.zodBaggage<SyntheticBaggage, SyntheticBaggageSupplier>(
    "syntheticBaggage",
  );

  await tc.step("originals zodEnrichment", async (innerTC) => {
    const unenrichedText = z.string();
    const unenrichedTextOptional = z.string().optional();
    const unenrichedTextDefaultable = z.string().default("defaultValue");
    const unenrichedTextOptionalDefaultable = z.string().optional().default(
      "defaultValue",
    );
    const unenrichedTextNullable = z.string().nullable();

    const baggageText = sb.zodTypeBaggage(unenrichedText, {
      property1: "baggageText",
      property2: 1285,
    });
    const baggageTextOptional = sb.zodTypeBaggage(unenrichedTextOptional);
    const baggageTextDefaultable = sb.zodTypeBaggage(unenrichedTextDefaultable);
    const baggageTextOptionalDefaultable = sb.introspectableZodTypeBaggage(
      unenrichedTextOptionalDefaultable,
      {
        property1: "baggageTextOptionalDefaultable",
        property2: 456,
      },
    );
    const baggageTextNullable = sb.zodTypeBaggage(unenrichedTextNullable);

    baggageTextOptional.syntheticBaggage = {
      property1: "baggageTextOptional",
      property2: 5648,
    };
    baggageTextDefaultable.syntheticBaggage = {
      property1: "baggageTextDefaultable",
      property2: 348,
    };
    baggageTextNullable.syntheticBaggage = {
      property1: "baggageTextNullable",
      property2: 12398,
    };

    await innerTC.step("compile-time type safety", () => {
      expectType<z.ZodString & SyntheticBaggageSupplier>(baggageText);
      expectType<z.ZodOptional<z.ZodString> & SyntheticBaggageSupplier>(
        baggageTextOptional,
      );
      expectType<z.ZodDefault<z.ZodString> & SyntheticBaggageSupplier>(
        baggageTextDefaultable,
      );
      expectType<
        z.ZodDefault<z.ZodOptional<z.ZodString>> & SyntheticBaggageSupplier
      >(baggageTextOptionalDefaultable);
      expectType<{
        readonly proxiedZodType: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        readonly coreZTA: () => z.ZodString;
        readonly wrappedZTAs: () => z.ZodTypeAny[];
        readonly cloned: () => z.ZodDefault<z.ZodOptional<z.ZodString>>;
        readonly clonedCoreZTA: () => z.ZodString;
      }>(baggageTextOptionalDefaultable.zodIntrospection);
      expectType<z.ZodNullable<z.ZodString> & SyntheticBaggageSupplier>(
        baggageTextNullable,
      );
    });

    await innerTC.step("run-time type safety", () => {
      ta.assert(sb.isBaggageSupplier(baggageText));
      ta.assert(sb.isBaggageSupplier(baggageTextOptional));
      ta.assert(sb.isBaggageSupplier(baggageTextDefaultable));
      ta.assert(sb.isBaggageSupplier(baggageTextOptionalDefaultable));
      ta.assert(sb.isBaggageSupplier(baggageTextNullable));

      ta.assertEquals(baggageText.syntheticBaggage, {
        property1: "baggageText",
        property2: 1285,
      });
      ta.assertEquals(baggageTextOptional.syntheticBaggage, {
        property1: "baggageTextOptional",
        property2: 5648,
      });
      ta.assertEquals(baggageTextDefaultable.syntheticBaggage, {
        property1: "baggageTextDefaultable",
        property2: 348,
      });
      ta.assertEquals(baggageTextOptionalDefaultable.syntheticBaggage, {
        property1: "baggageTextOptionalDefaultable",
        property2: 456,
      });
      ta.assertEquals(
        baggageTextOptionalDefaultable.zodIntrospection.wrappedZTAs().map((
          zta,
        ) => zta._def.typeName),
        ["ZodString", "ZodOptional", "ZodDefault"],
      );
      ta.assertEquals(baggageTextNullable.syntheticBaggage, {
        property1: "baggageTextNullable",
        property2: 12398,
      });
    });
  });
});

Deno.test("Zod Schema Proxy", () => {
  const syntheticSchema = z.object({
    text: z.string(),
    url: z.string().url(),
    number: z.number(),
  });

  const proxiedSchema = za.zodSchemaProxy(syntheticSchema, {
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
