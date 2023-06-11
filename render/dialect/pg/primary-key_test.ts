import { testingAsserts as ta } from "../../deps-test.ts";
import { unindentWhitespace as uws } from "../../../lib/universal/whitespace.ts";
import * as tbl from "../../ddl/table/mod.ts";
import * as emit from "../../emit/mod.ts";
import * as mod from "./primary-key.ts";

Deno.test("SQL Aide (SQLa) PostgreSQL primary keys", async (tc) => {
  const pkcf = mod.primaryKeyColumnFactory();
  const keysShape = {
    auto_inc_pk_id: pkcf.serialPrimaryKey(),
  };
  const tableKeysOwner = tbl.tableDefinition(
    "synthetic_table_keys",
    keysShape,
  );
  const ctx = emit.typicalSqlEmitContext({
    sqlDialect: emit.postgreSqlDialect(),
  });
  const ddlOptions = emit.typicalSqlTextSupplierOptions();
  const lintState = emit.typicalSqlLintSummaries(ddlOptions.sqlTextLintState);

  await tc.step("keys' table definition", () => {
    ta.assertEquals(
      emit.SQL(ddlOptions)`
        ${lintState.sqlTextLintSummary}

        ${tableKeysOwner}`.SQL(ctx),
      uws(`
        -- no SQL lint issues (typicalSqlTextLintManager)

        CREATE TABLE "synthetic_table_keys" (
            "auto_inc_pk_id" SERIAL PRIMARY KEY
        );`),
    );
  });
});
