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
 * methods with the name of each SQLPage content that we want in the database.
 * The SQLPageNotebook.create method "reads" the cells in SqlPageNotebook (each
 * method's result) and generates SQL to insert the content of the page in the
 * database in the format and table expected by SQLPage `sqlpage_files` table.
 *
 * See: https://github.com/lovasoa/SQLpage/tree/main#hosting-sql-files-directly-inside-the-database
 *
 * If you want to store customizations (e.g. handlebar templates, etc.) see:
 * - https://sql.ophir.dev/custom_components.sql
 * - https://github.com/lovasoa/SQLpage/discussions/174
 *
 * If you want to create JSON APIs:
 * https://sql.ophir.dev/documentation.sql?component=json#component
 *
 * If you want to execute commands (assuming appropriate security) in SQLPage:
 * https://sql.ophir.dev/functions.sql?function=exec#function
 *
 * NOTE: we break our PascalCase convention for the name of the class since SQLPage
 *       is a proper noun (product name).
 */
class SQLPageTestNotebook {
  readonly tc: ReturnType<typeof mod.sqliteContent<SQLa.SqlEmitContext>>;
  readonly comps = mod.typicalComponents<string, SQLa.SqlEmitContext>();

  constructor(readonly SQL: ReturnType<typeof SQLa.SQL<SQLa.SqlEmitContext>>) {
    this.tc = mod.sqliteContent<SQLa.SqlEmitContext>(SQL);
  }

  @nbDescr.disregard()
  shell() {
    // deno-fmt-ignore
    return this.SQL`
      ${this.comps.shell({
          title: "Test Center",
          icon: "book",
          link: "/",
          menuItems: [{ caption: "issues" }, { caption: "schema" }]
      })}
    `;
  }

  "index.sql"() {
    // passing in `chainNB.NotebookCellID<SQLPageNotebook>` allows us to restrict
    // menu hrefs to this notebook's cell names (the pages in SQLPage)
    const { list, listItem: li } = mod.typicalComponents<
      chainNB.NotebookCellID<SQLPageTestNotebook>,
      SQLa.SqlEmitContext
    >();

    // deno-fmt-ignore
    return this.SQL`
      ${this.shell()}
      ${list({ items: [
                li({ title: "Bad Item", link: "bad-item.sql" }),
                li({ title: "Ingestion State Schema", link: "schema.sql" }),
               ]})}`;
  }

  "bad-item.sql"() {
    return "this is not a proper return type in SQLPageNotebook so it should generate an alert page in SQLPage (included just for testing)";
  }

  "schema.sql"() {
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
