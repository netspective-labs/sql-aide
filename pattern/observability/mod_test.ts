import { path } from "../../deps.ts";
import { testingAsserts as ta } from "../../deps-test.ts";
import { unindentWhitespace as uws } from "../../lib/universal/whitespace.ts";
import * as SQLa from "../../render/mod.ts";
import * as mod from "./mod.ts";

const relativeFilePath = (name: string) =>
  path.relative(Deno.cwd(), path.fromFileUrl(import.meta.resolve(name)));

const relativeFileContent = (relFilePath: string) =>
  Deno.readTextFileSync(
    path.relative(Deno.cwd(), relativeFilePath(relFilePath)),
  );

const assertFileContent = (relFilePath: string, expected: string) => {
  return ta.assertEquals(relativeFileContent(relFilePath), expected);
};

type SyntheticContext = SQLa.SqlEmitContext;

Deno.test("Observability governance", () => {
  const stso = SQLa.typicalSqlTextSupplierOptions();
  const tg = mod.telemetryGovn(stso);
  const mg = mod.metricsGovn(stso);

  ta.assert(tg);
  ta.assert(mg);
});

Deno.test("Telemetry SQLite", () => {
  const ctx: SyntheticContext = {
    ...SQLa.typicalSqlEmitContext({ sqlDialect: SQLa.sqliteDialect() }),
  };
  const stso = SQLa.typicalSqlTextSupplierOptions<SyntheticContext>();
  const tg = mod.telemetryGovn<SyntheticContext>(stso);
  assertFileContent(
    "./mod_test.telem-sqlite-fixture.sql",
    uws(tg.allSpanObjects.SQL(ctx)),
  );
});

Deno.test("Metrics SQLite", () => {
  const ctx: SyntheticContext = {
    ...SQLa.typicalSqlEmitContext({ sqlDialect: SQLa.sqliteDialect() }),
  };
  const stso = SQLa.typicalSqlTextSupplierOptions<SyntheticContext>();
  const mg = mod.metricsGovn<SyntheticContext>(stso);
  assertFileContent(
    "./mod_test.metrics-sqlite-fixture.sql",
    uws(mg.allMetricsObjects.SQL(ctx)),
  );
});

Deno.test("Telemetry PostgreSQL", () => {
  const ctx: SyntheticContext = {
    ...SQLa.typicalSqlEmitContext({ sqlDialect: SQLa.postgreSqlDialect() }),
  };
  const stso = SQLa.typicalSqlTextSupplierOptions<SyntheticContext>();
  const tg = mod.telemetryGovn<SyntheticContext>(stso);
  assertFileContent(
    "./mod_test.telem-pg-fixture.sql",
    uws(tg.allSpanObjects.SQL(ctx)),
  );
});

Deno.test("Metrics PostgreSQL", () => {
  const ctx: SyntheticContext = {
    ...SQLa.typicalSqlEmitContext({ sqlDialect: SQLa.postgreSqlDialect() }),
  };
  const stso = SQLa.typicalSqlTextSupplierOptions<SyntheticContext>();
  const mg = mod.metricsGovn<SyntheticContext>(stso);
  const msr = mod.metricsPlPgSqlRoutines(ctx);
  const withSPs = SQLa.SQL<SyntheticContext>(stso)`
    ${mg.allMetricsObjects}

    ${msr.insertMetricValueSP}`;
  assertFileContent("./mod_test.metrics-pg-fixture.sql", uws(withSPs.SQL(ctx)));
});
