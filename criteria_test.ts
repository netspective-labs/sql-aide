import { testingAsserts as ta } from "./deps-test.ts";
import * as mod from "./criteria.ts";
import * as tmpl from "./sql.ts";

Deno.test("SQL Aide (SQLa) where-like criteria SQL fragments", async (tc) => {
  const ctx = tmpl.typicalSqlEmitContext();
  type Context = typeof ctx;
  const fch = mod.filterCriteriaHelpers();
  type FilterableRecord = mod.FilterableRecordValues<{
    customer_id?: number;
    first_name: string;
    last_name: string;
    address?: string;
    zip_code?: number;
  }, Context>;
  const fc = mod.filterCriteriaPreparer<FilterableRecord, Context>(
    (group) => {
      if (group === "primary-keys") {
        return ["customer_id"];
      }
      return ["customer_id", "first_name", "last_name", "address", "zip_code"];
    },
  );

  await tc.step("some implicit equals with no NULL values", () => {
    const where = mod.filterCriteriaSQL(fc(ctx, {
      customer_id: 1,
      first_name: "Shahid",
      last_name: fch.or("Shah"),
    }));
    ta.assertEquals(
      where.SQL(ctx),
      `"customer_id" = 1 AND "first_name" = 'Shahid' OR "last_name" = 'Shah'`,
    );
  });

  await tc.step("some explicit equals with explicit NULL for zip_code", () => {
    const where = mod.filterCriteriaSQL(fc(ctx, {
      first_name: "Shahid",
      last_name: fch.or(fch.is("=", "Shah")),
      zip_code: undefined,
    }));
    ta.assertEquals(
      where.SQL(ctx),
      `"first_name" = 'Shahid' OR "last_name" = 'Shah' AND "zip_code" IS NULL`,
    );
  });

  await tc.step(
    "TODO: some explicit equals with explicit IS NOT NULL for zip_code",
    () => {
      const _where = mod.filterCriteriaSQL(fc(ctx, {
        first_name: "Shahid",
        last_name: fch.or(fch.is("=", "Shah")),
        zip_code: fch.not(undefined),
      }));
      // TODO:
      // ta.assertEquals(
      //   where.SQL(ctx),
      //   `"first_name" = 'Shahid' OR "last_name" = 'Shah' AND "zip_code" IS NOT NULL`,
      // );
    },
  );
});
