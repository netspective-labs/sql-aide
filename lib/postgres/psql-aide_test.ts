import { testingAsserts as ta } from "./deps-test.ts";
import * as mod from "./psql-aide.ts";

// deno-lint-ignore no-explicit-any
type Any = any;
const { zod: z, ws } = mod;

const expectType = <T>(_value: T) => {
  // Do nothing, the TypeScript compiler handles this for us
};

Deno.test("psql format aide arguments", () => {
  const i = mod.injectables({
    set4: z.date(),
  });
  const { setables: { set4: arg4set4 } } = i;
  const fa = mod.formatArgs({
    arg1: z.string(),
    arg2: z.number(),
    arg3: z.date(),
    arg4: i.setables.set4,
    arg4set4,
  });
  expectType<string[]>(fa.argNames);
  expectType<{ [k: string]: mod.Injectable<string, mod.zod.ZodTypeAny> }>(
    fa.args,
  );
  ta.assertEquals(fa.argNames, ["arg1", "arg2", "arg3", "arg4", "arg4set4"]);
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
      {
        index: 4,
        key: "arg4set4",
        name: "arg4set4",
        specs: ["%5$s", "%5$L", "%5$I"],
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
        this is a test of arg2: ${arg2.s} (simple value)
        this is a test of arg3: ${arg3.I} (quoted identifier)`,
  );
  ta.assertEquals(
    transformed.body,
    ws.unindentWhitespace(`
      this is a test of arg1: %1$L (literal)
      this is a test of arg2: %2$s (simple value)
      this is a test of arg3: %3$I (quoted identifier)`),
  );
  ta.assertEquals(
    transformed.format((par) =>
      Object.values(par.injectables).map((i) => i.name)
    ),
    ws.unindentWhitespace(`
    format($fmtBody$
      this is a test of arg1: %1$L (literal)
      this is a test of arg2: %2$s (simple value)
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
        ${arg1.set({ value: "arg1_default" })}

        ${arg2.set({ value: "arg2_default" })}

        ${arg3.set({ value: "arg3_default" })}

        this is a test of arg1: ${arg1.L} (literal)
        this is a test of arg2: ${arg2.s} (simple value)
        this is a test of arg3: ${arg3.I} (quoted identifier)`,
  );
  ta.assertEquals(
    transformed.body,
    ws.unindentWhitespace(`
      \\if :{?arg1}
      \\else
        \\set arg1 arg1_default
      \\endif

      \\if :{?arg2}
      \\else
        \\set arg2 arg2_default
      \\endif

      \\if :{?arg3}
      \\else
        \\set arg3 arg3_default
      \\endif

      this is a test of arg1: arg1 (literal)
      this is a test of arg2: :'arg2' (simple value)
      this is a test of arg3: :"arg3" (quoted identifier)`),
  );
});

Deno.test("psql aide resolve with embedded formats", () => {
  const transformed = mod.psqlAide(
    {
      setX: z.string().default("default_from_zod"),
      setY: z.number(),
      setZ: z.date(),
    },
    ({ setables: { setX, setY, setZ } }, template) => {
      const fa1 = mod.formatAide(
        {
          setX,
          setY,
          setZ,
          arg1: z.string(),
          arg2: z.number(),
          arg3: z.date(),
        },
        ({ injectables: { setX, setY, setZ, arg1, arg2, arg3 } }, template) =>
          template`
            this is a test of arg1: ${arg1.L} (literal)
            this is a test of arg2: ${arg2.s} (simple value)
            this is a test of arg3: ${arg3.I} (quoted identifier)
            this is a test of setX inside format: ${setX.L} (literal)
            this is a test of setY inside format: ${setY.s} (simple value)
            this is a test of setZ inside format: ${setZ.I} (quoted identifier)`,
      );

      template`
        ${setX.set()}

        ${setY.set({ value: "setY_default" })}

        ${setZ.set({ value: "setZ_default" })}

        this is a test of setX (outer): ${setX.L} (literal)
        this is a test of setY (outer): ${setY.s} (simple value)
        this is a test of setZ (outer): ${setZ.I} (quoted identifier)

        -- formatted
        ${fa1.format()}`;
    },
  );

  ta.assertEquals(
    transformed.body,
    ws.unindentWhitespace(`
      \\if :{?setX}
      \\else
        \\set setX default_from_zod
      \\endif

      \\if :{?setY}
      \\else
        \\set setY setY_default
      \\endif

      \\if :{?setZ}
      \\else
        \\set setZ setZ_default
      \\endif

      this is a test of setX (outer): setX (literal)
      this is a test of setY (outer): :'setY' (simple value)
      this is a test of setZ (outer): :"setZ" (quoted identifier)

      -- formatted
      format($fmtBody$
        this is a test of arg1: %4$L (literal)
        this is a test of arg2: %5$s (simple value)
        this is a test of arg3: %6$I (quoted identifier)
        this is a test of setX inside format: %1$L (literal)
        this is a test of setY inside format: %2$s (simple value)
        this is a test of setZ inside format: %3$I (quoted identifier)
      $fmtBody$, :'setX', :'setY', :'setZ', arg1, arg2, arg3)`),
  );
});
