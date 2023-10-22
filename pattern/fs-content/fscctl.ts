#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run --allow-sys

import { cliffy, path } from "./deps.ts";
import * as an from "../../lib/notebook/action.ts";
import * as nbooks from "./notebooks.ts";
import * as SQLa from "../../render/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export const sqlPkgExtnLoadSqlSupplier = (
  extnIdentity: string,
): SQLa.SqlTextBehaviorSupplier<Any> => {
  const sqlPkgHome = Deno.env.has("SQLPKG_HOME")
    ? Deno.env.get("SQLPKG_HOME")
    : path.fromFileUrl(
      import.meta.resolve(`../../support/bin/sqlpkg`),
    );
  return {
    executeSqlBehavior: () => {
      return {
        SQL: () => `.load ${sqlPkgHome}/${extnIdentity}`,
      };
    },
  };
};

export const prepareOrchestrator = () =>
  new nbooks.SqlNotebooksOrchestrator(
    new nbooks.SqlNotebookHelpers<SQLa.SqlEmitContext>({
      loadExtnSQL: sqlPkgExtnLoadSqlSupplier,
    }),
  );

export function notebookCommand(
  nbName: nbooks.OrchestrableSqlNotebookName,
  nbf: ReturnType<typeof SQLa.sqlNotebookFactory<Any, Any>>,
) {
  return new cliffy.Command()
    .description(`Emit ${nbName} notebook cell(s) SQL`)
    .option("-d, --dest <file:string>", "Save the SQL in the provided filename")
    .arguments("[...cell]")
    .action(async (options, ...cells) => {
      if (cells.length === 0) {
        nbf.kernel.introspectedNB.cells.forEach((cell) =>
          console.log(cell.nbCellID)
        );
        return;
      }

      const sno = prepareOrchestrator();
      const sql = sno.nbh.SQL`${await nbf.SQL(
        { separator: sno.separator },
        ...cells,
      )}`.SQL(sno.nbh.emitCtx);
      if (options.dest) {
        Deno.writeTextFileSync(options.dest, sql);
      } else {
        console.log(sql);
      }
    });
}

async function CLI() {
  const sno = prepareOrchestrator();
  const actionNB = an.ActionNotebook.create();
  const callerName = import.meta.resolve(import.meta.url);
  await new cliffy.Command()
    .name(callerName.slice(callerName.lastIndexOf("/") + 1))
    .version("0.1.0")
    .description("Content Aide")
    .option(
      "--sql-dest <file:string>",
      "Store the generated SQL in the provided filename",
    )
    .option(
      "--sqlite-db <file:string>",
      "Execute the SQL in the provided SQLite database",
      { default: `device-content.sqlite.db` },
    )
    .option("--verbose", "Show what is being done")
    .action(async ({ sqliteDb }) => {
      // deno-fmt-ignore
      const sql = sno.nbh.SQL`
        -- construct all information model objects (initialize the database)
        ${(await sno.constructionNBF.SQL({ separator: sno.separator }))}

        -- store all SQL that is potentially reusable in the database
        ${(await sno.storeNotebookCellsDML())}

        -- insert the SQLPage content and current working directory fs content into the database
        ${(await sno.mutationNBF.SQL({ separator: sno.separator }, "mimeTypesSeedDML", "SQLPageSeedDML", "insertFsContentCWD"))}
        `.SQL(sno.nbh.emitCtx);

      const sqlite3 = () => actionNB.sqlite3({ filename: sqliteDb });

      // first scan all the files and use SQLite extensions to do what's
      // possible in the DB
      await sqlite3().SQL(sql).spawn();

      // now use the data stored in the database to extract content and do
      // what is only possible in Deno, saving the data back to the DB
      const polyglotSQL = sno.nbh.SQL`
        ${await (sno.polyglotNB.postProcessFsContent(async () => {
        return (await sqlite3().SQL(
          sno.queryNB.frontmatterCandidates().SQL(sno.nbh.emitCtx),
        ).json<{ fs_content_id: string; content: string }[]>()) ?? [];
      }))}`;
      await sqlite3().SQL(polyglotSQL.SQL(sno.nbh.emitCtx)).spawn();
    })
    .command("help", new cliffy.HelpCommand().global())
    .command("completions", new cliffy.CompletionsCommand())
    .command(
      "notebook",
      // deno-fmt-ignore
      new cliffy.Command()
        .description("Emit notebook cells SQL")
        .action(() => sno.introspectedCells().forEach((ic) => console.log(`${ic.notebook} ${ic.cell}`)))
        .command("construction", notebookCommand("construction", sno.constructionNBF as Any))
        .command("mutation", notebookCommand("mutation", sno.mutationNBF as Any))
        .command("query", notebookCommand("query", sno.queryNBF as Any))
        .command("polyglot", notebookCommand("polyglot", sno.polyglotNBF as Any)),
    )
    .command(
      "diagram",
      new cliffy.Command()
        .description("Emit Diagram")
        .option(
          "-d, --dest <file:string>",
          "Output destination, STDOUT if not supplied",
        )
        .action((options) => {
          const sno = prepareOrchestrator();
          const diagram = sno.infoSchemaDiagram();
          if (options.dest) {
            Deno.writeTextFileSync(options.dest, diagram);
          } else {
            console.log(diagram);
          }
        }),
    )
    .parse();
}

if (import.meta.main) {
  await CLI();
}
