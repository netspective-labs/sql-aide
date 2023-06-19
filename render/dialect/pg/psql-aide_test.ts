import { testingAsserts as ta } from "../../deps-test.ts";
import * as pa from "../../../lib/postgres/psql-aide.ts";
import * as emit from "../../emit/mod.ts";
import * as mod from "./psql-aide.ts";

// deno-lint-ignore no-explicit-any
type Any = any;
const { zod: z, ws } = pa;

Deno.test("psql format aide resolve", () => {
  const formatText = mod.pgFormatText(
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
    formatText.body,
    ws.unindentWhitespace(`
      this is a test of arg1: %1$L (literal)
      this is a test of arg2: %2$s (simple value)
      this is a test of arg3: %3$I (quoted identifier)`),
  );
  ta.assertEquals(
    formatText.SQL(emit.typicalSqlEmitContext()),
    ws.unindentWhitespace(`
      format($fmtBody$
        this is a test of arg1: %1$L (literal)
        this is a test of arg2: %2$s (simple value)
        this is a test of arg3: %3$I (quoted identifier)
      $fmtBody$, arg1, arg2, arg3)`),
  );
});

Deno.test("psql aide resolve", () => {
  const psql = mod.psqlText(
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
    psql.SQL(emit.typicalSqlEmitContext()),
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
  const psql = mod.psqlText(
    {
      setX: z.string().default("default_from_zod"),
      setY: z.number(),
      setZ: z.date(),
    },
    ({ setables: { setX, setY, setZ } }, template) => {
      const fa1 = pa.formatAide(
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
    psql.SQL(emit.typicalSqlEmitContext()),
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
