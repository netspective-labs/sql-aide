import { zod as z } from "../deps.ts";
import { testingAsserts as ta } from "../deps-test.ts";
import { unindentWhitespace as uws } from "../lib/universal/whitespace.ts";
import * as mod from "./select.ts";
import * as tmpl from "../sql.ts";
import * as cr from "./criteria.ts";

Deno.test("SQL Aide (SQLa) custom SELECT statement", async (tc) => {
  const ctx = tmpl.typicalSqlEmitContext();
  const SQL = mod.untypedSelect(ctx, {
    firstTokenGuard: (firstToken) =>
      firstToken.toLocaleUpperCase() == "SELECT"
        ? true
        : { lintIssue: "SELECT expected as first word" },
  });

  await tc.step("invalid SELECT statement (misspelled token)", () => {
    const select = SQL`
      SELExT CustomerName, City
        FROM Customers`;
    ta.assert(!select.isValid);
  });

  await tc.step("valid, untyped, SELECT statement", () => {
    const select = SQL`
      SELECT CustomerName, City
        FROM Customers`;
    ta.assert(select.isValid);
  });

  await tc.step("valid named SELECT statement with typed column names", () => {
    const select = mod.typedSelect(
      {
        customer_name: z.string(),
        order_count: z.number().optional(),
        city: z.string(),
      },
      ctx,
      { selectStmtName: "ss_name" },
    )`
      SELECT customer_name, order_count, city
        FROM customers`;
    ta.assert(select.isValid);
    ta.assertEquals(select.selectStmtName, "ss_name");
    ta.assertEquals(
      Array.from(Object.values(select.zbSchema)).map((d) =>
        d.sqlDomain.identity
      ),
      [
        "customer_name",
        "order_count",
        "city",
      ],
    );
    ta.assertEquals(
      select.SQL(ctx),
      uws(`
        SELECT customer_name, order_count, city
          FROM customers`),
    );
  });
});

Deno.test("SQL Aide (SQLa) typed entity SELECT statement", async (tc) => {
  const ctx = tmpl.typicalSqlEmitContext();
  type Context = typeof ctx;
  const sch = mod.selectCriteriaHelpers();
  type EntityName = "customers";
  type EntireRecord = cr.FilterableRecordValues<{
    customer_id?: number;
    first_name: string;
    last_name: string;
    address?: string;
    zip_code?: number;
  }, Context>;
  type FilterableRecord = EntireRecord;
  const essp = mod.entitySelectStmtPreparer<
    EntityName,
    FilterableRecord,
    EntireRecord,
    typeof ctx
  >(
    "customers",
    cr.filterCriteriaPreparer((group) => {
      if (group === "primary-keys") {
        return ["customer_id"];
      }
      return ["customer_id", "first_name", "last_name", "address", "zip_code"];
    }),
  );

  await tc.step("return *", () => {
    const select = essp({
      customer_id: 1,
      first_name: sch.is("=", "Shahid"),
      last_name: "Shah",
    }, { returning: "*" });
    ta.assertEquals(
      select.SQL(ctx),
      `SELECT * FROM "customers" WHERE "customer_id" = 1 AND "first_name" = 'Shahid' AND "last_name" = 'Shah'`,
    );
  });

  await tc.step("return primary key(s)", () => {
    const select = essp({
      first_name: "Shahid",
      last_name: "Shah",
    }, { sqlFmt: "multi-line" });
    ta.assertEquals(
      select.SQL(ctx),
      uws(`
        SELECT "customer_id"
          FROM "customers"
         WHERE "first_name" = 'Shahid' AND "last_name" = 'Shah'`),
    );
  });

  await tc.step("return primary key(s), explicit NULL for zip_code", () => {
    const select = essp({
      first_name: "Shahid",
      last_name: sch.or("Shah"),
      zip_code: undefined,
    }, { sqlFmt: "multi-line" });
    ta.assertEquals(
      select.SQL(ctx),
      uws(`
        SELECT "customer_id"
          FROM "customers"
         WHERE "first_name" = 'Shahid' OR "last_name" = 'Shah' AND "zip_code" IS NULL`),
    );
  });

  await tc.step("return specific custom columns (explicit return)", () => {
    const select = essp({
      first_name: "Shahid",
      last_name: "Shah",
    }, { returning: ["first_name", "last_name"] });
    ta.assertEquals(
      select.SQL(ctx),
      `SELECT "first_name", "last_name" FROM "customers" WHERE "first_name" = 'Shahid' AND "last_name" = 'Shah'`,
    );
  });

  await tc.step(
    "return specific custom columns (implicit return via value decorator)",
    () => {
      const select = essp({
        first_name: sch.return("Shahid"),
        last_name: sch.return("Shah"),
      });
      ta.assertEquals(
        select.SQL(ctx),
        `SELECT "first_name", "last_name" FROM "customers" WHERE "first_name" = 'Shahid' AND "last_name" = 'Shah'`,
      );
    },
  );
});
