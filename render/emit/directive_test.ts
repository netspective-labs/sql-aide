import { testingAsserts as ta } from "../deps-test.ts";
import * as whs from "../../lib/universal/whitespace.ts";
import * as s from "./sql.ts";
import * as mod from "./directive.ts";

Deno.test("detect engine instance directive from query", async (tc) => {
  const ctx = s.typicalSqlEmitContext();
  const sqlEngineDI = mod.sqlEngineDirectiveInspector();

  await tc.step("valid engine instance", () => {
    const osqValidTest: s.SqlTextSupplier<typeof ctx> = {
      SQL: () =>
        whs.unindentWhitespace(`
          USE DATABASE osquery; -- https://osquery.io/\n
          SELECT computer_name, hostname, cpu_brand, cpu_physical_cores, cpu_logical_cores, printf("%.2f", (physical_memory / 1024.0 / 1024.0 / 1024.0)) as memory_gb
            FROM system_info`),
    };
    const result = sqlEngineDI(ctx, osqValidTest);
    ta.assert(result);
    // make sure that the SQL is rewritten - removed `USE DATABASE osquery; -- https://osquery.io/\n` and left everything else
    ta.assert(s.isMutatedSqlTextSupplier(result.sqlTextSupplier));
    ta.assert(
      result.sqlTextSupplier.SQL(ctx),
      whs.unindentWhitespace(`
        SELECT computer_name, hostname, cpu_brand, cpu_physical_cores, cpu_logical_cores, printf("%.2f", (physical_memory / 1024.0 / 1024.0 / 1024.0)) as memory_gb
          FROM system_info`),
    );
    ta.assert(result.engineInstanceID, "osquery");
  });

  await tc.step("bad spec test, misspelled USE DATABASE", () => {
    const badSpecTest: s.SqlTextSupplier<typeof ctx> = {
      SQL: () =>
        whs.unindentWhitespace(`
          USE DATAASE bad_db_name_format
          SELECT this
            FROM that`),
    };
    const result = sqlEngineDI(ctx, badSpecTest);
    ta.assertEquals(result, undefined);
  });
});
