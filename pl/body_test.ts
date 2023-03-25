import { testingAsserts as ta } from "../deps-test.ts";
import { unindentWhitespace as uws } from "../lib/universal/whitespace.ts";
import * as emit from "../emit/mod.ts";
import * as mod from "./body.ts";

Deno.test("SQL Aide (SQLa) programming language body", async (tc) => {
  const ctx = emit.typicalSqlEmitContext();
  const rawBodySQL = mod.body(ctx);
  const indent = (text: string, indent = "  ") =>
    text.replaceAll(/^/gm, `${indent}`);
  const surroundDo = (content: string) => `DO \$\$\n${content}\n$$`;
  const surroundBeginEnd = (content: string) =>
    indent(`BEGIN\n${indent(content)}\nEND`);
  const surroundDoBESQL = mod.body(ctx, {
    identity: "synthetic",
    surround: (SQL) => surroundDo(surroundBeginEnd(SQL)),
  });

  await tc.step("valid, untyped, PL raw body with no auto-surround", () => {
    const body = rawBodySQL`
      DO $$
        BEGIN
          CREATE DOMAIN dcp_context.execution_context as dcp_extensions.ltree;
        EXCEPTION
          WHEN DUPLICATE_OBJECT THEN
            RAISE NOTICE 'domain "execution_context" already exists, skipping';
        END
      $$`;
    ta.assert(mod.isBody(body));
  });

  await tc.step("valid named PL body with automatic surround SQL", () => {
    const body = surroundDoBESQL`
      CREATE DOMAIN dcp_context.execution_context as dcp_extensions.ltree;
      EXCEPTION
        WHEN DUPLICATE_OBJECT THEN
          RAISE NOTICE 'domain "execution_context" already exists, skipping';`;
    ta.assert(mod.isBody(body));
    ta.assert(body.isValid);
    ta.assertEquals(body.identity, "synthetic");
    ta.assertEquals(
      body.SQL(ctx),
      uws(`
        DO $$
          BEGIN
            CREATE DOMAIN dcp_context.execution_context as dcp_extensions.ltree;
            EXCEPTION
              WHEN DUPLICATE_OBJECT THEN
                RAISE NOTICE 'domain "execution_context" already exists, skipping';
          END
        $$`),
    );
  });
});
