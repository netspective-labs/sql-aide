import { path } from "../../deps.ts";
import { testingAsserts as ta } from "../../deps-test.ts";
import * as chainNB from "../../lib/notebook/chain-of-responsibility.ts";
import * as SQLa from "../../render/mod.ts";
import * as mod from "./mod.ts";

const nbDescr = new chainNB.NotebookDescriptor<
  SQLPageTestNotebook,
  chainNB.NotebookCell<
    SQLPageTestNotebook,
    chainNB.NotebookCellID<SQLPageTestNotebook>
  >
>();

/**
 * Encapsulates [SQLPage](https://sql.ophir.dev/) content. SqlPageNotebook has
 * methods with the name of each [SQLPage](https://sql.ophir.dev/) content that
 * we want in the database. The MutationSqlNotebook sqlPageSeedDML method
 * "reads" the cells in the SqlPageNotebook (each method's result) and
 * generates SQL to insert the content of the page in the database in the format
 * and table expected by [SQLPage](https://sql.ophir.dev/).
 * NOTE: we break our PascalCase convention for the name of the class since SQLPage
 *       is a proper noun (product name).
 */
class SQLPageTestNotebook {
  readonly tc: ReturnType<typeof mod.typicalContent<SQLa.SqlEmitContext>>;

  constructor(readonly SQL: ReturnType<typeof SQLa.SQL<SQLa.SqlEmitContext>>) {
    this.tc = mod.typicalContent(SQL);
  }

  "index.sql"() {
    const { list, listItem: item } = mod.typicalComponents();

    // deno-fmt-ignore
    return this.SQL`
      ${list({ title: "Get started: where to go from here ?",
               items: [item({ title: "Information Schema (test)", link: "info-schema.sql" })]})}`;
  }

  "bad-item.sql"() {
    return "this is not a proper return type in SQLPageNotebook so it should generate an alert page in SQLPage (included just for testing)";
  }

  "info-schema.sql"() {
    return this.tc.infoSchemaSQL();
  }

  // the remainder of the SQLPage files will come from SQLPageNotebook cells
}

Deno.test("SQLPage Notebook", async () => {
  const ctx = SQLa.typicalSqlEmitContext();
  const ddlOptions = SQLa.typicalSqlTextSupplierOptions();

  const nb = mod.sqlPageNotebook(
    SQLPageTestNotebook.prototype,
    () => new SQLPageTestNotebook(SQLa.SQL(ddlOptions)),
    () => ctx,
    nbDescr,
  );

  const SQL = await nb.SQL(ctx);
  // await Deno.writeTextFile(
  //   path.fromFileUrl(import.meta.resolve("./mod_test-fixture.sql")),
  //   SQL,
  // );
  // sqlite3 ":memory:" < pattern/sqlpage/mod_test-fixture.sql
  ta.assertEquals(
    SQL,
    await Deno.readTextFile(
      path.fromFileUrl(import.meta.resolve("./mod_test-fixture.sql")),
    ),
  );
});
