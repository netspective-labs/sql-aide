import { testingAsserts as ta } from "./deps-test.ts";
import * as mod from "./psql-aide.ts";

const { zod: z, ws } = mod;

Deno.test("psql aide injectables", () => {
  const i = mod.injectables({
    arg1: z.string(),
    arg2: z.number(),
    arg3: z.date(),
  });
  ta.assertEquals(
    Object.entries(i.injectables).map(([k, v]) => ({
      key: k,
      name: v.name,
      type: v.type.constructor.name,
      specs: [v.s(), v.L(), v.I()],
    })),
    [
      {
        key: "arg1",
        name: "arg1",
        type: "ZodString",
        specs: [":'arg1'", "arg1", ':"arg1"'],
      },
      {
        key: "arg2",
        name: "arg2",
        type: "ZodNumber",
        specs: [":'arg2'", "arg2", ':"arg2"'],
      },
      {
        key: "arg3",
        name: "arg3",
        type: "ZodDate",
        specs: [":'arg3'", "arg3", ':"arg3"'],
      },
    ],
  );
});

Deno.test("psql aide resolve", () => {
  const transformed = mod.psqlAide(
    {
      arg1: z.string(),
      arg2: z.number(),
      arg3: z.date(),
    },
    ({ injectables: { arg1, arg2, arg3 } }, template) =>
      template`
        ${arg1.set}
        ${arg2.set}
        ${arg3.set}

        this is a test of arg1: ${arg1.L} (literal)
        this is a test of arg2: ${arg2.s} (quoted value)
        this is a test of arg3: ${arg3.I} (quoted identifier)`,
  );
  ta.assertEquals(
    transformed.body,
    ws.unindentWhitespace(`
      \\set arg1
      \\set arg2
      \\set arg3

      this is a test of arg1: arg1 (literal)
      this is a test of arg2: :'arg2' (quoted value)
      this is a test of arg3: :"arg3" (quoted identifier)`),
  );
});
