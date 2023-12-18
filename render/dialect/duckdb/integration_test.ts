import { testingAsserts as ta } from "../../deps-test.ts";
import { path } from "../../deps.ts";
import * as pgpass from "../../../lib/postgres/pgpass/pgpass-parse.ts";
import * as ws from "../../../lib/universal/whitespace.ts";
import * as tmpl from "../../emit/mod.ts";
import * as mod from "./integration.ts";

Deno.test("DuckDB CSV Supplier", () => {
  type EmitContext = tmpl.SqlEmitContext & {
    readonly integrations: typeof integrations;
  };
  type SqlTextSupplier = tmpl.SqlTextSupplier<EmitContext>;

  const ib = mod.integrationsBuilder<EmitContext>();
  const integrations = ib.csvTables({
    "SYNTHETIC": ib.factory.csvTable({
      csvSrcFsPath: () => "synthetic.csv",
      tableName: "synthetic_csv_table",
      isTempTable: true,
      extraColumnsSql: [
        "row_number() OVER () as src_file_row_number",
        "(SELECT ingest_session_id from ingest_session LIMIT 1) as ingest_session_id",
      ],
    }),
  });

  const ctx: EmitContext = {
    ...tmpl.typicalSqlEmitContext({ sqlDialect: tmpl.duckDbDialect() }),
    integrations,
  };
  const ddlOptions = tmpl.typicalSqlTextSupplierOptions<typeof ctx>();

  const ddlDefn = tmpl.SQL<typeof ctx>(ddlOptions)`
      ${integrations}`;

  ta.assertEquals(
    ddlDefn.SQL(ctx),
    ws.unindentWhitespace(`
        CREATE TEMPORARY TABLE synthetic_csv_table AS
          SELECT *, row_number() OVER () as src_file_row_number, (SELECT ingest_session_id from ingest_session LIMIT 1) as ingest_session_id
            FROM read_csv_auto('synthetic.csv', header=true);`),
  );
});

Deno.test("DuckDB SQLite SQL Supplier", () => {
  type EmitContext = tmpl.SqlEmitContext & {
    readonly integrations: typeof integrations;
    readonly resolve: (fsPath: string) => string;
  };
  type SqlTextSupplier = tmpl.SqlTextSupplier<EmitContext>;

  const integrations = mod.sqliteIntegrations({
    "synthetic_sqlite_instance": mod.sqliteIntegration({
      sqliteDbFsPath: () => "./synthetic.sqlite.db",
      attachAs: "synthetic_sqlite_instance",
    }),
  });

  /**
   * On a regular basis, go to PayPal activity download and ingest only sales.
   * We export all activity from PayPal on a private machine, store it in a file
   * that is Git-ignored. We ingest all positive Gross (just sales, not payments
   * by us to our service providers) and convert data to be properly typed.
   * TRY_CAST will either succeed in the conversion or assign NULL.
   */
  const paypalActivitySales: SqlTextSupplier = {
    SQL: ({ resolve }) => {
      // deno-fmt-ignore
      return ws.unindentWhitespace(/*sql*/`
          -- we're going to put the table directly into SQLite via attached "synthetic_sqlite_instance"
          DROP TABLE IF EXISTS synthetic_sqlite_instance.financial_paypal_activity_sales;
          DESCRIBE SELECT * FROM read_csv_auto('${resolve("./sensitive-paypal@company.com-activity-all.csv")}');
          CREATE TABLE synthetic_sqlite_instance.financial_paypal_activity_sales AS
              -- DuckDB does a good job of converting "Date" and "Time" into proper types but we want a combined field
              SELECT strptime("Date" || ' ' || "Time" || ' ' || "TimeZone", '%Y-%m-%d %H:%M:%S %Z')::TIMESTAMPTZ as paid_at,
                     name as name, "From Email Address" as from_email_address, currency as currency,
                     TRY_CAST(REPLACE(gross, ',', '') as DOUBLE) as gross_sale_amount,
                     TRY_CAST(REPLACE(fee, ',', '') as DOUBLE) as paypal_fee_amount,
                     TRY_CAST(REPLACE(net, ',', '') as DOUBLE) as net_sale_amount
                FROM read_csv_auto('${resolve("./sensitive-paypal@company.com-activity-all.csv")}')
               WHERE gross_sale_amount >= 0`);
    },
  };

  /**
   * it probably makes sense to create this as a VIEW in SQLite synthetic_sqlite_instance
   * rather than a table but it's a good example of how to take aggregates and
   * make them easy to query in publications.
   */
  const paypalMonthlySalesSummary: SqlTextSupplier = {
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

  const ctx: EmitContext = {
    ...tmpl.typicalSqlEmitContext({ sqlDialect: tmpl.duckDbDialect() }),
    integrations,
    resolve: (fsPath) => fsPath,
  };
  const ddlOptions = tmpl.typicalSqlTextSupplierOptions<EmitContext>();

  // ${ctx.extensions} will automatically generate the INSTALL sqlite; ATTACH...
  const ddlDefn = tmpl.SQL<EmitContext>(ddlOptions)`
    ${integrations}

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
  type EmitContext = tmpl.SqlEmitContext & {
    readonly integrations: typeof integrations;
  };
  type SqlTextSupplier = tmpl.SqlTextSupplier<EmitContext>;

  /**
   * Read some synthetic PostgreSQL backend connection parameters from a synthetic
   * `.pgpass` which can be parsed by SQLa/lib/postgres/pgpass utility.
   */
  const pgPassFixture = await pgpass.parse(
    path.fromFileUrl(import.meta.resolve("./mod_test-fixture-pgpass.txt")),
  );
  const pgPassConn = pgPassFixture.connsDict.get("SYNTHETIC_GITLAB");
  ta.assert(pgPassConn);
  const ib = mod.integrationsBuilder<EmitContext>();
  const integrations = ib.postgreSQL({
    "SYNTHETIC_GITLAB": ib.factory.postgreSQL<"issues">({
      pgpassConn: () => pgPassConn,
    }),
  });

  pgPassFixture.issues.forEach((i) =>
    console.warn(`${i.message} (${i.srcLineNumber}, ${i.error})`)
  );

  const fixture: SqlTextSupplier = {
    SQL: ({ integrations }) => {
      const from = integrations.SYNTHETIC_GITLAB.from("issues") ?? "??";
      // deno-fmt-ignore
      return ws.unindentWhitespace(/*sql*/`
        select count(*) from ${typeof from === "string" ? from : from.SQL(ctx)}`)
    },
  };

  const ctx: EmitContext = {
    ...tmpl.typicalSqlEmitContext({ sqlDialect: tmpl.duckDbDialect() }),
    integrations,
  };
  const ddlOptions = tmpl.typicalSqlTextSupplierOptions<EmitContext>();

  const ddlDefn = tmpl.SQL<EmitContext>(ddlOptions)`
    ${integrations}

    ${fixture}`;

  ta.assertEquals(
    ddlDefn.SQL(ctx),
    ws.unindentWhitespace(`
      INSTALL postgres; LOAD postgres;

      select count(*) from postgres_scan('dbname=gitlabhq_production user=gitlab password=synthetic_passwd host=127.0.0.1 port=5033', 'public', 'issues');`),
  );
});

Deno.test("DuckDB Excel Supplier", () => {
  type EmitContext = tmpl.SqlEmitContext & {
    readonly integrations: typeof integrations;
  };
  type SqlTextSupplier = tmpl.SqlTextSupplier<EmitContext>;

  const ib = mod.integrationsBuilder<EmitContext>();
  const integrations = ib.excel({
    "SYNTHETIC": ib.factory.excel<"Sheet1">({
      xlsFsPath: () => "synthetic.xls",
    }),
  });

  const fixture: SqlTextSupplier = {
    SQL: (ctx) => {
      // deno-fmt-ignore
      return ws.unindentWhitespace(/*sql*/`
        SELECT * FROM ${integrations.SYNTHETIC.from("Sheet1").SQL(ctx)}`)
    },
  };

  const ctx: EmitContext = {
    ...tmpl.typicalSqlEmitContext({ sqlDialect: tmpl.duckDbDialect() }),
    integrations,
  };
  const ddlOptions = tmpl.typicalSqlTextSupplierOptions<typeof ctx>();

  const ddlDefn = tmpl.SQL<typeof ctx>(ddlOptions)`
      ${integrations}

      ${fixture}`;

  ta.assertEquals(
    ddlDefn.SQL(ctx),
    ws.unindentWhitespace(`
        INSTALL spatial; LOAD spatial;

        SELECT * FROM st_read('synthetic.xls', layer='Sheet1');`),
  );
});
