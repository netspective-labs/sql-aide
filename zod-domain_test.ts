import { zod as z } from "./deps.ts";
import { testingAsserts as ta } from "./deps-test.ts";
import * as zd from "./zod-domain.ts";

Deno.test("Zod-based SQL domains", async (tc) => {
  await tc.step("valid domains", () => {
    const syntheticSchema = zd.sqlDomains({
      text: z.string(),
      text_nullable: z.string().optional(),
      int: z.number(),
      int_nullable: z.number().optional(),
      // TODO: add all the other scalars and types
    });
    ta.assert(zd.isSqlDomainsSupplier(syntheticSchema));

    type SyntheticSchema = z.infer<typeof syntheticSchema.schema>;
    const synthetic: SyntheticSchema = {
      text: "required",
      int: 0,
    };
    ta.assert(synthetic);
    ta.assertEquals(synthetic.text, "required");
    ta.assertEquals(syntheticSchema.lintIssues.length, 0);
    ta.assertEquals(synthetic.int, 0);
    ta.assertEquals(synthetic.text_nullable, undefined);
    ta.assertEquals(synthetic.int_nullable, undefined);
  });
});

Deno.test("Zod Schema Proxy", () => {
  const syntheticSchema = z.object({
    text: z.string(),
    url: z.string().url(),
    number: z.number(),
  });

  const proxiedSchema = zd.zodSchemaProxy(syntheticSchema, {
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
