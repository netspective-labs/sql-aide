import { zod as z } from "../../deps.ts";
import { testingAsserts as ta } from "../../deps-test.ts";
import { unindentWhitespace as uws } from "../../lib/universal/whitespace.ts";
import * as SQLa from "../../render/mod.ts";
import * as mod from "./state-table.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

const ctx = SQLa.typicalSqlEmitContext();

Deno.test("State Table Test", async (tc) => {
  // Create a state table using the factory
  const syntheticStateTableModel = mod.stateTable("synthetic_table", {
    synthetic_table_id: mod.textPrimaryKey(),
    my_column1: z.string(),
    my_column2: z.string(),
  });

  await tc.step("table definition", () => {
    ta.assert(SQLa.isTableDefinition(syntheticStateTableModel));
    ta.assert(mod.isStateTableDefn(syntheticStateTableModel));
    ta.assert(syntheticStateTableModel);
    // Add more assertions as needed
  });

  await tc.step("table creation SQL", () => {
    ta.assertEquals(
      syntheticStateTableModel.SQL(ctx),
      uws(`
      CREATE TABLE IF NOT EXISTS "synthetic_table" (
          "synthetic_table_id" TEXT PRIMARY KEY NOT NULL,
          "my_column1" TEXT NOT NULL,
          "my_column2" TEXT NOT NULL,
          "from_state" TEXT NOT NULL,
          "to_state" TEXT NOT NULL,
          "transition_result" TEXT NOT NULL,
          "transition_reason" TEXT NOT NULL,
          "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          "created_by" TEXT DEFAULT 'UNKNOWN',
          "updated_at" TIMESTAMPTZ,
          "updated_by" TEXT,
          "deleted_at" TIMESTAMPTZ,
          "deleted_by" TEXT,
          "activity_log" TEXT
      )`),
    );
  });

  await tc.step("insert values into table rows", () => {
    ta.assertEquals(
      `INSERT INTO "synthetic_table" ("synthetic_table_id", "my_column1", "my_column2", "from_state", "to_state", "transition_result", "transition_reason", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by", "activity_log") VALUES ('123456', 'sample value1', 'sample value2', 'state1', 'state2', 'result', 'reason', NULL, NULL, NULL, NULL, NULL, NULL)`,
      syntheticStateTableModel.insertDML({
        synthetic_table_id: "123456",
        my_column1: "sample value1",
        my_column2: "sample value2",
        from_state: "state1",
        to_state: "state2",
        transition_result: "result",
        transition_reason: "reason",
      }).SQL(ctx),
    );
  });
});

Deno.test("State Tables Factory Test", async (tc) => {
  const factory = mod.stateTablesFactory();
  const syntheticStateTableModel = factory.createStateTable(
    "synthetic_table2",
    {
      synthetic_table2_id: mod.textPrimaryKey(),
      my_column1: z.string(),
      my_column2: z.string(),
    },
    ["my_column1", "my_column2", "from_state", "to_state"],
  );

  await tc.step("table definition", () => {
    ta.assert(SQLa.isTableDefinition(syntheticStateTableModel));
    ta.assert(mod.isStateTableDefn(syntheticStateTableModel));
    ta.assert(syntheticStateTableModel);
    // Add more assertions as needed
  });

  await tc.step("table creation SQL", () => {
    ta.assertEquals(
      syntheticStateTableModel.SQL(ctx),
      uws(`
      CREATE TABLE IF NOT EXISTS "synthetic_table2" (
          "synthetic_table2_id" TEXT PRIMARY KEY NOT NULL,
          "my_column1" TEXT NOT NULL,
          "my_column2" TEXT NOT NULL,
          "from_state" TEXT NOT NULL,
          "to_state" TEXT NOT NULL,
          "transition_result" TEXT NOT NULL,
          "transition_reason" TEXT NOT NULL,
          "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          "created_by" TEXT DEFAULT 'UNKNOWN',
          "updated_at" TIMESTAMPTZ,
          "updated_by" TEXT,
          "deleted_at" TIMESTAMPTZ,
          "deleted_by" TEXT,
          "activity_log" TEXT,
          UNIQUE("my_column1", "my_column2", "from_state", "to_state")
      )`),
    );
  });

  await tc.step("insert values into table rows", () => {
    ta.assertEquals(
      `INSERT INTO "synthetic_table2" ("synthetic_table2_id", "my_column1", "my_column2", "from_state", "to_state", "transition_result", "transition_reason", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by", "activity_log") VALUES ('987654', 'sample value1', 'sample value2', 'state1', 'state2', 'result', 'reason', NULL, NULL, NULL, NULL, NULL, NULL)`,
      syntheticStateTableModel.insertDML({
        synthetic_table2_id: "987654",
        my_column1: "sample value1",
        my_column2: "sample value2",
        from_state: "state1",
        to_state: "state2",
        transition_result: "result",
        transition_reason: "reason",
      }).SQL(ctx),
    );
  });

  // Add more tests for other functionalities provided by stateTablesFactory if needed
});
