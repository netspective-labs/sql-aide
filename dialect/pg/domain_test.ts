import { zod as z } from "../../deps.ts";
import { testingAsserts as ta } from "../../deps-test.ts";
import { unindentWhitespace as uws } from "../../lib/universal/whitespace.ts";
import * as mod from "./domain.ts";
import * as tmpl from "../../emit/mod.ts";

Deno.test("SQL Aide (SQLa) custom data type (domain)", async (tc) => {
  const ctx = tmpl.typicalSqlEmitContext();
  const pgdf = mod.pgDomainsFactory();

  await tc.step("idempotent domain declaration", () => {
    const domain = pgdf.pgDomainDefn(
      pgdf.stringSDF.string(z.string()),
      "custom_type_1",
      {
        isIdempotent: true,
      },
    );
    ta.assertEquals(
      domain.SQL(ctx),
      `BEGIN CREATE DOMAIN custom_type_1 AS TEXT; EXCEPTION WHEN DUPLICATE_OBJECT THEN /* ignore error without warning */ END`,
    );
  });

  await tc.step("idempotent domain declaration with warning", () => {
    const domain = pgdf.pgDomainDefn(
      pgdf.stringSDF.string(z.string()),
      "custom_type_1",
      {
        isIdempotent: true,
        warnOnDuplicate: (identifier) =>
          `domain "${identifier}" already exists, skipping`,
      },
    );
    ta.assertEquals(
      domain.SQL(ctx),
      `BEGIN CREATE DOMAIN custom_type_1 AS TEXT; EXCEPTION WHEN DUPLICATE_OBJECT THEN RAISE NOTICE 'domain "custom_type_1" already exists, skipping'; END`,
    );
  });

  await tc.step(
    "idempotent domain declaration with warning, human friendly format",
    () => {
      const domain = pgdf.pgDomainDefn(
        pgdf.stringSDF.string(z.string()),
        "custom_type_1",
        {
          isIdempotent: true,
          warnOnDuplicate: (identifier) =>
            `domain "${identifier}" already exists, skipping`,
          humanFriendlyFmtIndent: "  ",
        },
      );
      ta.assertEquals(
        domain.SQL(ctx),
        uws(`
          BEGIN
            CREATE DOMAIN custom_type_1 AS TEXT;
          EXCEPTION
            WHEN DUPLICATE_OBJECT THEN
              RAISE NOTICE 'domain "custom_type_1" already exists, skipping';
          END`),
      );
    },
  );

  await tc.step("schema declaration (non-idempotent)", () => {
    const view = pgdf.pgDomainDefn(
      pgdf.numberSDF.integer(z.number()),
      "custom_type_2",
    );
    ta.assertEquals(
      view.SQL(ctx),
      `CREATE DOMAIN custom_type_2 AS INTEGER`,
    );
  });
});
