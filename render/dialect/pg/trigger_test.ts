import { testingAsserts as ta } from "../../deps-test.ts";
import { unindentWhitespace as uws } from "../../../lib/universal/whitespace.ts";
import * as mod from "./trigger.ts";
import * as emit from "../../emit/mod.ts";

Deno.test("SQL Aide (SQLa) triggers", async (tc) => {
  const ctx = emit.typicalSqlEmitContext();

  await tc.step("create SQL trigger", () => {
    const trigger = mod.sqlTriggerDefinition(
      "synthetic_trigger",
      "synthetic_table1",
      "AFTER",
      ["DELETE", "UPDATE"],
      uws(`
      BEGIN
        EXECUTE FUNCTION synthetic_trigger_fun();
      END`),
    );
    ta.assertEquals(
      trigger.SQL(ctx),
      uws(`
          CREATE TRIGGER "synthetic_trigger"
          AFTER DELETE OR UPDATE ON "synthetic_table1"
          FOR EACH ROW
          BEGIN
            EXECUTE FUNCTION synthetic_trigger_fun();
          END`),
    );
  });

  await tc.step("drop first then create then drop", () => {
    const trigger = mod.sqlTriggerDefinition(
      "synthetic_trigger",
      "synthetic_table1",
      "AFTER",
      "INSERT",
      uws(`
      BEGIN
        EXECUTE FUNCTION synthetic_trigger_fun();
      END`),
      {
        embeddedStsOptions: emit.typicalSqlTextSupplierOptions(),
        before: (triggerName) =>
          mod.dropTrigger(triggerName, "synthetic_table1"),
        quoteIdentifiers: false,
      },
    );
    ta.assertEquals(
      trigger.SQL(ctx),
      uws(`
          DROP TRIGGER IF EXISTS synthetic_trigger ON synthetic_table1;
          CREATE TRIGGER synthetic_trigger
          AFTER INSERT ON synthetic_table1
          FOR EACH ROW
          BEGIN
            EXECUTE FUNCTION synthetic_trigger_fun();
          END`),
    );

    ta.assertEquals(
      trigger.drop().SQL(ctx),
      `DROP TRIGGER IF EXISTS synthetic_trigger ON synthetic_table1`,
    );
    ta.assertEquals(
      trigger.drop({ ifExists: false }).SQL(ctx),
      `DROP TRIGGER synthetic_trigger ON synthetic_table1`,
    );
  });
});
