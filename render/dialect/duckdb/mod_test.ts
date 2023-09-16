import { testingAsserts as ta } from "../../deps-test.ts";
import { path } from "../../deps.ts";
import * as pgpass from "../../../lib/postgres/pgpass/pgpass-parse.ts";
import * as ws from "../../../lib/universal/whitespace.ts";
import * as tmpl from "../../emit/mod.ts";
import * as mod from "./mod.ts";

Deno.test("DuckDB SQLite SQL Supplier", () => {
  /**
   * On a regular basis, go to PayPal activity download and ingest only sales.
   * We export all activity from PayPal on a private machine, store it in a file
   * that is Git-ignored. We ingest all positive Gross (just sales, not payments
   * by us to our service providers) and convert data to be properly typed.
   * TRY_CAST will either succeed in the conversion or assign NULL.
   */
  const paypalActivitySales: mod.DuckDbSqlTextSupplier = {
    SQL: ({ contentFsPath }) => {
      // deno-fmt-ignore
      return ws.unindentWhitespace(/*sql*/`
          -- we're going to put the table directly into SQLite via attached "synthetic_sqlite_instance"
          DROP TABLE IF EXISTS synthetic_sqlite_instance.financial_paypal_activity_sales;
          DESCRIBE SELECT * FROM read_csv_auto('${contentFsPath({ identity: "./sensitive-paypal@company.com-activity-all.csv" })}');
          CREATE TABLE synthetic_sqlite_instance.financial_paypal_activity_sales AS
              -- DuckDB does a good job of converting "Date" and "Time" into proper types but we want a combined field
              SELECT strptime("Date" || ' ' || "Time" || ' ' || "TimeZone", '%Y-%m-%d %H:%M:%S %Z')::TIMESTAMPTZ as paid_at,
                     name as name, "From Email Address" as from_email_address, currency as currency,
                     TRY_CAST(REPLACE(gross, ',', '') as DOUBLE) as gross_sale_amount,
                     TRY_CAST(REPLACE(fee, ',', '') as DOUBLE) as paypal_fee_amount,
                     TRY_CAST(REPLACE(net, ',', '') as DOUBLE) as net_sale_amount
                FROM read_csv_auto('${contentFsPath({ identity: "./sensitive-paypal@company.com-activity-all.csv" })}')
               WHERE gross_sale_amount >= 0`);
    },
  };

  /**
   * it probably makes sense to create this as a VIEW in SQLite synthetic_sqlite_instance
   * rather than a table but it's a good example of how to take aggregates and
   * make them easy to query in publications.
   */
  const paypalMonthlySalesSummary: mod.DuckDbSqlTextSupplier = {
    SQL: () => {
      // deno-fmt-ignore
      return ws.unindentWhitespace(/*sql*/`
          CREATE TABLE synthetic_sqlite_instance.financial_paypal_activity_sales_monthly AS
              SELECT date_trunc('month', paid_at::TIMESTAMPTZ) AS month,
                     count(net_sale_amount) as sales_count,
                     ceiling(sum(net_sale_amount)) AS net_sales_amount,
                     ceiling(avg(net_sale_amount)) as avg_sales_amount
                FROM synthetic_sqlite_instance.financial_paypal_activity_sales
               GROUP BY month`);
    },
  };

  // this is a SqlTextSupplier instance and if it's passed in as a template
  // expression it will emit `ATTACH` SQL and automatically register itself
  // in the template stateful context
  const syntheticSqliteASE = mod.attachableSqliteEngine({
    identifier: "synthetic_sqlite_instance",
    sqliteDbFsPath: "./synthetic.sqlite.db",
  });

  const ctx = mod.duckDbSqlEmitContext((provenance) => provenance.identity, {
    sqliteBackends: new Map([[
      syntheticSqliteASE.identifier,
      syntheticSqliteASE,
    ]]),
  });
  const ddlOptions = tmpl.typicalSqlTextSupplierOptions<
    mod.DuckDbSqlEmitContext
  >();

  // ${ctx.extensions} will automatically generate the INSTALL sqlite; ATTACH...
  const ddlDefn = tmpl.SQL<mod.DuckDbSqlEmitContext>(ddlOptions)`
    ${ctx.extensions()}

    ${paypalActivitySales}

    ${paypalMonthlySalesSummary}`;

  ta.assertEquals(
    ddlDefn.SQL(ctx),
    ws.unindentWhitespace(/* sql */ `
        INSTALL sqlite;
        ATTACH './synthetic.sqlite.db' AS synthetic_sqlite_instance (TYPE sqlite);

        -- we're going to put the table directly into SQLite via attached "synthetic_sqlite_instance"
        DROP TABLE IF EXISTS synthetic_sqlite_instance.financial_paypal_activity_sales;
        DESCRIBE SELECT * FROM read_csv_auto('./sensitive-paypal@company.com-activity-all.csv');
        CREATE TABLE synthetic_sqlite_instance.financial_paypal_activity_sales AS
            -- DuckDB does a good job of converting "Date" and "Time" into proper types but we want a combined field
            SELECT strptime("Date" || ' ' || "Time" || ' ' || "TimeZone", '%Y-%m-%d %H:%M:%S %Z')::TIMESTAMPTZ as paid_at,
                   name as name, "From Email Address" as from_email_address, currency as currency,
                   TRY_CAST(REPLACE(gross, ',', '') as DOUBLE) as gross_sale_amount,
                   TRY_CAST(REPLACE(fee, ',', '') as DOUBLE) as paypal_fee_amount,
                   TRY_CAST(REPLACE(net, ',', '') as DOUBLE) as net_sale_amount
              FROM read_csv_auto('./sensitive-paypal@company.com-activity-all.csv')
             WHERE gross_sale_amount >= 0;

        CREATE TABLE synthetic_sqlite_instance.financial_paypal_activity_sales_monthly AS
            SELECT date_trunc('month', paid_at::TIMESTAMPTZ) AS month,
                   count(net_sale_amount) as sales_count,
                   ceiling(sum(net_sale_amount)) AS net_sales_amount,
                   ceiling(avg(net_sale_amount)) as avg_sales_amount
              FROM synthetic_sqlite_instance.financial_paypal_activity_sales
             GROUP BY month;`),
  );
});

Deno.test("DuckDB PostgreSQL SQL Supplier", async () => {
  /**
   * Read some synthetic PostgreSQL backend connection parameters from a synthetic
   * `.pgpass` which can be parsed by SQLa/lib/postgres/pgpass utility.
   */
  const pgPassFixture = await pgpass.parse(
    path.fromFileUrl(import.meta.resolve("./mod_test-fixture-pgpass.txt")),
  );
  pgPassFixture.issues.forEach((i) =>
    console.warn(`${i.message} (${i.srcLineNumber}, ${i.error})`)
  );

  const fixture: mod.DuckDbSqlTextSupplier = {
    // deno-fmt-ignore
    SQL: ({ postgreSqlBackends }) => ws.unindentWhitespace(/*sql*/`
        select count(*) from ${postgreSqlBackends.get("SYNTHETIC_GITLAB")?.from("issues") ?? "??"}`),
  };

  const ctx = mod.duckDbSqlEmitContext(
    (provenance) => import.meta.resolve(provenance.identity),
    {
      postgreSqlBackends: pgPassFixture.conns.reduce(
        (catalog, conn) => {
          catalog.set(
            conn.connDescr.id,
            mod.attachablePostgreSqlEngine({
              identifier: conn.connDescr.id,
              pgpassConn: conn,
            }),
          );
          return catalog;
        },
        new Map<string, mod.AttachablePostgreSqlEngine>(),
      ),
    },
  );
  const ddlOptions = tmpl.typicalSqlTextSupplierOptions<
    mod.DuckDbSqlEmitContext
  >();

  const ddlDefn = tmpl.SQL<mod.DuckDbSqlEmitContext>(ddlOptions)`
    ${ctx.extensions({ emitPostgreSqlASE: () => true })}

    ${fixture}`;

  ta.assertEquals(
    ddlDefn.SQL(ctx),
    ws.unindentWhitespace(`
      INSTALL postgres; LOAD postgres;

      select count(*) from postgres_scan('dbname=gitlabhq_production user=gitlab password=synthetic_passwd host=127.0.0.1 port=5033', 'public', 'issues');`),
  );
});

Deno.test("DuckDB Excel Supplier", () => {
  const fixture: mod.DuckDbSqlTextSupplier = {
    // deno-fmt-ignore
    SQL: ({ excelBackends }) => ws.unindentWhitespace(/*sql*/`
        SELECT * FROM ${excelBackends.get("SYNTHETIC")?.from("Sheet1") ?? "??"}`),
  };

  const ctx = mod.duckDbSqlEmitContext((provenance) => provenance.identity, {
    excelBackends: new Map([[
      "SYNTHETIC",
      mod.attachableExcelEngine({ identifier: "synthetic.xls" }),
    ]]),
  });
  const ddlOptions = tmpl.typicalSqlTextSupplierOptions<
    mod.DuckDbSqlEmitContext
  >();

  const ddlDefn = tmpl.SQL<mod.DuckDbSqlEmitContext>(ddlOptions)`
      ${ctx.extensions({ emitExcelASE: () => true })}

      ${fixture}`;

  ta.assertEquals(
    ddlDefn.SQL(ctx),
    ws.unindentWhitespace(`
        INSTALL spatial; LOAD spatial;

        SELECT * FROM st_read('synthetic.xls', layer='Sheet1');`),
  );
});
