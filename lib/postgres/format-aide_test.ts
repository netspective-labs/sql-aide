import { testingAsserts as ta } from "./deps-test.ts";
import * as mod from "./format-aide.ts";

const { zod: z, ws } = mod;

Deno.test("psql format aide arguments", () => {
  const fa = mod.formatArgs({
    arg1: z.string(),
    arg2: z.number(),
    arg3: z.date(),
  });
  ta.assertEquals(fa.argNames, ["arg1", "arg2", "arg3"]);
  ta.assertEquals(
    Object.entries(fa.args).map(([k, v]) => ({
      key: k,
      index: v.index,
      name: v.name,
      type: v.type.constructor.name,
      specs: [v.s(), v.L(), v.I()],
    })),
    [
      {
        key: "arg1",
        index: 0,
        name: "arg1",
        type: "ZodString",
        specs: ["%1$s", "%1$L", "%1$I"],
      },
      {
        key: "arg2",
        index: 1,
        name: "arg2",
        type: "ZodNumber",
        specs: ["%2$s", "%2$L", "%2$I"],
      },
      {
        key: "arg3",
        index: 2,
        name: "arg3",
        type: "ZodDate",
        specs: ["%3$s", "%3$L", "%3$I"],
      },
    ],
  );
});

Deno.test("psql format aide resolve", () => {
  const transformed = mod.formatAide(
    {
      arg1: z.string(),
      arg2: z.number(),
      arg3: z.date(),
    },
    ({ args: { arg1, arg2, arg3 } }, template) =>
      template`
        this is a test of arg1: ${arg1.L} (literal)
        this is a test of arg2: ${arg2.s} (quoted value)
        this is a test of arg3: ${arg3.I} (quoted identifier)`,
  );
  ta.assertEquals(
    transformed.body,
    ws.unindentWhitespace(`
      this is a test of arg1: %1$L (literal)
      this is a test of arg2: %2$s (quoted value)
      this is a test of arg3: %3$I (quoted identifier)`),
  );
  ta.assertEquals(
    transformed.format(),
    ws.unindentWhitespace(`
    format($fmtBody$
      this is a test of arg1: %1$L (literal)
      this is a test of arg2: %2$s (quoted value)
      this is a test of arg3: %3$I (quoted identifier)
    $fmtBody$, arg1, arg2, arg3)`),
  );
});
