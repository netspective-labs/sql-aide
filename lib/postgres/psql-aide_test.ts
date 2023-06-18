import { testingAsserts as ta } from "./deps-test.ts";
import * as mod from "./psql-aide.ts";

// deno-lint-ignore no-explicit-any
type Any = any;
const { zod: z, ws } = mod;

const expectType = <T>(_value: T) => {
  // Do nothing, the TypeScript compiler handles this for us
};

Deno.test("psql format aide arguments", () => {
  const fa = mod.formatArgs({
    arg1: z.string(),
    arg2: z.number(),
    arg3: z.date(),
    arg4: mod.setable("arg4", z.string(), -1),
  });
  expectType<string[]>(fa.argNames);
  expectType<{ [k: string]: mod.Injectable<string, mod.zod.ZodTypeAny> }>(
    fa.args,
  );
  ta.assertEquals(fa.argNames, ["arg1", "arg2", "arg3", "arg4"]);
  ta.assertEquals(
    Object.entries(fa.args).map(([k, v]) => ({
      key: k,
      index: v.index,
      name: v.name,
      type: v.type.constructor.name,
      specs: [v.s(), v.L(), v.I()],
      isSetable: mod.isSetable(v.type),
    })),
    [
      {
        key: "arg1",
        index: 0,
        name: "arg1",
        type: "ZodString",
        specs: ["%1$s", "%1$L", "%1$I"],
        isSetable: false,
      },
      {
        key: "arg2",
        index: 1,
        name: "arg2",
        type: "ZodNumber",
        specs: ["%2$s", "%2$L", "%2$I"],
        isSetable: false,
      },
      {
        key: "arg3",
        index: 2,
        name: "arg3",
        type: "ZodDate",
        specs: ["%3$s", "%3$L", "%3$I"],
        isSetable: false,
      },
      {
        key: "arg4",
        index: 3,
        name: "arg4",
        specs: ["%4$s", "%4$L", "%4$I"],
        type: "Object",
        isSetable: true,
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
    ({ injectables: { arg1, arg2, arg3 } }, template) =>
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
    transformed.format((par) =>
      Object.values(par.injectables).map((i) => i.name)
    ),
    ws.unindentWhitespace(`
    format($fmtBody$
      this is a test of arg1: %1$L (literal)
      this is a test of arg2: %2$s (quoted value)
      this is a test of arg3: %3$I (quoted identifier)
    $fmtBody$, arg1, arg2, arg3)`),
  );
});

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
    ({ setables: { arg1, arg2, arg3 } }, template) =>
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
