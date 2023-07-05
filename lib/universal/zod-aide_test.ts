import { zod as z } from "../../deps.ts";
import { testingAsserts as ta } from "../../deps-test.ts";
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
  const { zodTypeBaggageProxy: proxy } = sb;

  await tc.step("originals with baggage", async (innerTC) => {
    await innerTC.step("scalar proxy", () => {
      const baggageText = proxy(z.string());
      baggageText.syntheticBaggage = {
        property1: "baggageText",
        property2: 1285,
      };
      expectType<z.ZodString & SyntheticBaggageSupplier>(baggageText);
      ta.assertEquals(baggageText.syntheticBaggage, {
        property1: "baggageText",
        property2: 1285,
      });

      let baggageText2 = proxy(z.string());
      expectType<z.ZodString & SyntheticBaggageSupplier>(baggageText2);
      ta.assertEquals(baggageText2.syntheticBaggage, undefined);

      baggageText2 = proxy(baggageText);
      expectType<z.ZodString & SyntheticBaggageSupplier>(baggageText2);
      ta.assertEquals(baggageText2.syntheticBaggage, {
        property1: "baggageText",
        property2: 1285,
      });
    });

    await innerTC.step("optional applied to scalar proxy", () => {
      const baggageText = proxy(z.string(), {
        property1: "baggageText",
        property2: 34345,
      }).optional();
      expectType<z.ZodOptional<z.ZodString>>(baggageText);
      expectType<z.ZodOptional<z.ZodString & SyntheticBaggageSupplier>>(
        proxy(baggageText),
      );
      ta.assertEquals(proxy(baggageText).syntheticBaggage, {
        property1: "baggageText",
        property2: 34345,
      });

      const baggageText2 = proxy(baggageText);
      expectType<z.ZodOptional<z.ZodString & SyntheticBaggageSupplier>>(
        baggageText2,
      );
      ta.assertEquals(baggageText2.syntheticBaggage, {
        property1: "baggageText",
        property2: 34345,
      });
      ta.assert(baggageText2.isOptional());
    });

    await innerTC.step("default applied to scalar proxy", () => {
      const baggageText = proxy(z.string(), {
        property1: "baggageText",
        property2: 23456,
      }).default("baggageTextDefault");
      expectType<z.ZodDefault<z.ZodString>>(baggageText);
      expectType<z.ZodDefault<z.ZodString & SyntheticBaggageSupplier>>(
        proxy(baggageText),
      );
      ta.assertEquals(proxy(baggageText).syntheticBaggage, {
        property1: "baggageText",
        property2: 23456,
      });

      const baggageText2 = proxy(baggageText);
      expectType<z.ZodDefault<z.ZodString & SyntheticBaggageSupplier>>(
        baggageText2,
      );
      ta.assertEquals(baggageText2.syntheticBaggage, {
        property1: "baggageText",
        property2: 23456,
      });
      ta.assertEquals(baggageText2.parse(undefined), "baggageTextDefault");
    });

    await innerTC.step("optional applied to default scalar proxy", () => {
      const baggageText = proxy(z.string(), {
        property1: "baggageText",
        property2: 5678,
      }).default("baggageTextDefault").optional();
      expectType<z.ZodOptional<z.ZodDefault<z.ZodString>>>(baggageText);
      expectType<
        z.ZodOptional<z.ZodDefault<z.ZodString & SyntheticBaggageSupplier>>
      >(
        proxy(baggageText),
      );
      ta.assertEquals(proxy(baggageText).syntheticBaggage, {
        property1: "baggageText",
        property2: 5678,
      });

      const baggageText2 = proxy(baggageText);
      expectType<
        z.ZodOptional<z.ZodDefault<z.ZodString & SyntheticBaggageSupplier>>
      >(
        baggageText2,
      );
      ta.assertEquals(baggageText2.syntheticBaggage, {
        property1: "baggageText",
        property2: 5678,
      });
      ta.assertEquals(baggageText2.parse(undefined), undefined);
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
  // TODO: figure out why this is breaking ta.assertEquals(parsedSynthetic.aliasForText(), "Sample text");
  ta.assert(parsedSynthetic.text); // the Zod Schema is accessible
});
