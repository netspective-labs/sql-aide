#!/usr/bin/env -S deno run --allow-all

import $ from "https://deno.land/x/dax@0.30.1/mod.ts";
import { testingAsserts as ta } from "../../deps-test.ts";
import * as ws from "../../lib/universal/whitespace.ts";
import * as SQLa from "../../render/mod.ts";
import * as tp from "../typical/mod.ts";
import * as mod from "./models.ts";

const relativeFilePath = (name: string) => {
  const absPath = $.path.fromFileUrl(import.meta.resolve(name));
  return $.path.relative(Deno.cwd(), absPath);
};

const relativeFileContent = (name: string) => {
  const absPath = $.path.fromFileUrl(import.meta.resolve(name));
  return Deno.readTextFileSync($.path.relative(Deno.cwd(), absPath));
};

type EmitContext = typeof ctx;
const ctx = SQLa.typicalSqlEmitContext({
  sqlDialect: SQLa.postgreSqlDialect(),
});
const gts = tp.governedTemplateState<
  tp.TypicalDomainQS,
  tp.TypicalDomainsQS,
  EmitContext
>();

function sqlDDL() {
  return SQLa.SQL<EmitContext>(gts.ddlOptions)`
    ${mod.sqlDDL()}
    `;
}

if (import.meta.main) {
  await tp.typicalCLI({
    resolve: (specifier) =>
      specifier ? import.meta.resolve(specifier) : import.meta.url,
    prepareSQL: () => ws.unindentWhitespace(sqlDDL().SQL(ctx)),
    prepareDiagram: () => {
      return tp.diaPUML.plantUmlIE(ctx, function* () {
        for (const table of mod.allContentTables) {
          if (SQLa.isGraphEntityDefinitionSupplier(table)) {
            yield table.graphEntityDefn();
          }
        }
      }, tp.diaPUML.typicalPlantUmlIeOptions()).content;
    },
  }).commands.command("driver", tp.sqliteDriverCommand(sqlDDL, ctx)).command(
    "test-fixtures",
    new tp.cli.Command()
      .description("Emit all test fixtures")
      .action(async () => {
        const CLI = relativeFilePath("./models_test.ts");
        const [sql, puml, sh] = [".sql", ".puml", ".sh"].map((extn) =>
          relativeFilePath(`./models_test.fixture${extn}`)
        );
        Deno.writeTextFileSync(sql, await $`./${CLI} sql`.text());
        Deno.writeTextFileSync(puml, await $`./${CLI} diagram`.text());
        Deno.writeTextFileSync(sh, await $`./${CLI} driver`.text());
        [sql, puml, sh].forEach((f) => console.log(f));
      }),
  ).parse(Deno.args);
}

/**
 * This is an "end-to-end" test strategy; we generate our fixtures whenever
 * our information model (schema) changes and git-track those files so that
 * if SQLa or other library changes impact what's generated we'll know because
 * the Deno test will fail.
 *
 * to re-generate all fixtures
 * $ ./models_test.ts test-fixtures
 *
 * to re-generate the fixtures one at a time:
 * $ ./models_test.ts sql --dest models_test.fixture.sql
 * $ ./models_test.ts diagram --dest models_test.fixture.puml
 * $ ./models_test.ts driver --dest ./models_test.fixture.sh && chmod +x ./models_test.fixture.sh
 */
Deno.test("Information Assurance Pattern", async (tc) => {
  const CLI = relativeFilePath("./models_test.ts");

  await tc.step("CLI SQL content", async () => {
    const output = await $`./${CLI} sql`.text();
    ta.assertEquals(
      output,
      relativeFileContent("./models_test.fixture.sql"),
    );
  });

  await tc.step("CLI diagram", async () => {
    const output = await $`./${CLI} diagram`.text();
    ta.assertEquals(
      output,
      relativeFileContent("./models_test.fixture.puml"),
    );
  });

  await tc.step("CLI driver content", async () => {
    const output = await $`./${CLI} driver`.text();
    ta.assertEquals(
      output,
      relativeFileContent("./models_test.fixture.sh"),
    );
  });

  /**
   * Execute the "driver" so that it creates an in-memory SQLite database and
   * returns the total number of objects found in the SQLite ephemeral DB. If
   * the count is equivalent to our expectation it means everything worked.
   */
  await tc.step("CLI driver execution result", async () => {
    const sh = relativeFilePath("./models_test.fixture.sh");
    // TODO: right now we just check the total count of object but this should be
    // improved to actually check the names of each table, view, etc.
    // deno-fmt-ignore
    const output = await $`./${sh} :memory: "select count(*) as objects_count from sqlite_master"`.text();
    ta.assertEquals(output, "13");
  });

  // deno-lint-ignore require-await
  await tc.step("Typescript SQL", async () => {
    const output = sqlDDL().SQL(ctx);
    ta.assertEquals(
      output,
      relativeFileContent("./models_test.fixture.sql"),
    );
  });
});
