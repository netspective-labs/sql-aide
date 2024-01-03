import { path } from "../../deps.ts";
import { testingAsserts as ta } from "../../deps-test.ts";
import * as SQLa from "../../render/mod.ts";
import * as mod from "./mod.ts";

class SQLPageTestNotebook extends mod.SQLPageNotebook<SQLa.SqlEmitContext> {
  constructor(readonly SQL: ReturnType<typeof SQLa.SQL<SQLa.SqlEmitContext>>) {
    super(SQL);
  }

  // this "index.sql" overrides the default "index.sql" in SQLPageNotebook
  "index.sql"() {
    return this.SQL`
        SELECT
          'list' as component,
          'Get started: where to go from here ?' as title,
          'Here are some useful links to get you started with SQLPage.' as description;
        SELECT 'Information Schema (test)' as title,
          'info-schema.sql' as link,
          'TODO' as description,
          'blue' as color,
          'download' as icon;`;
  }

  "bad-item.sql"() {
    return "this is not a proper return type in SQLPageNotebook so it should generate an alert page in SQLPage (included just for testing)";
  }

  // the remainder of the SQLPage files will come from SQLPageNotebook cells
}

Deno.test("SQLPage Notebook", async () => {
  const ctx = SQLa.typicalSqlEmitContext();
  const ddlOptions = SQLa.typicalSqlTextSupplierOptions();

  const nb = mod.sqlPageNotebook(
    () => new SQLPageTestNotebook(SQLa.SQL(ddlOptions)),
    () => ctx,
  );

  ta.assertEquals(
    (await nb.SQL()).map((c) => c.SQL(ctx)).join("\n"),
    await Deno.readTextFile(
      path.fromFileUrl(import.meta.resolve("./mod_test-fixture.sql")),
    ),
  );
});
