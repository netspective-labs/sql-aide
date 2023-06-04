import { testingAsserts as ta } from "../../deps-test.ts";
import * as mod from "./atc.ts";

Deno.test("osQueryATCConfigSupplier with auto-generated queries", () => {
  function* tables() {
    yield {
      tableName: "test_table",
      columns: [{ columnName: "column1" }, { columnName: "column2" }],
    };
    yield {
      tableName: "test_table2",
      columns: [{ columnName: "column2_1" }, { columnName: "column2_2" }],
    };
  }
  const configSupplier = mod.osQueryATCConfigSupplier(tables());

  ta.assertEquals(
    configSupplier((
      suggested: string,
      atcPartial: Omit<mod.OsQueryAutoTableConstrRecord, "path">,
    ) => ({
      osQueryTableName: suggested,
      atcRec: { ...atcPartial, path: "./sqlite-src.db" },
    })),
    {
      auto_table_construction: {
        test_table: {
          query: "select column1, column2 from test_table",
          columns: ["column1", "column2"],
          path: "./sqlite-src.db",
        },
        test_table2: {
          query: "select column2_1, column2_2 from test_table2",
          columns: ["column2_1", "column2_2"],
          path: "./sqlite-src.db",
        },
      },
    },
  );
});

Deno.test("osQueryATCConfigSupplier with custom query", () => {
  function* tables() {
    yield {
      tableName: "test_table",
      columns: [{ columnName: "column1" }, { columnName: "column2" }],
      query:
        "select column1 as 'special1', column2 as 'special2' from test_table",
    };
  }

  const atcRecConfig = (
    suggested: string,
    atcPartial: Omit<mod.OsQueryAutoTableConstrRecord, "path">,
  ) => ({
    osQueryTableName: suggested,
    atcRec: { ...atcPartial, path: "./sqlite-src.db" },
  });

  const configSupplier = mod.osQueryATCConfigSupplier(tables());
  const config: mod.OsQueryAutoTableConstrConfig = configSupplier(atcRecConfig);

  const expected: mod.OsQueryAutoTableConstrConfig = {
    auto_table_construction: {
      test_table: {
        query:
          "select column1 as 'special1', column2 as 'special2' from test_table",
        columns: ["column1", "column2"],
        path: "./sqlite-src.db",
      },
    },
  };

  ta.assertEquals(config, expected);
});
