#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run --allow-sys

import { cliffy, path } from "./deps.ts";
import * as cmdNB from "../../lib/notebook/command.ts";
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
    .type(
      "CellID",
      new cliffy.EnumType(
        nbf.kernel.introspectedNB.cells.map((c) => c.nbCellID),
      ),
    )
    .description(`Emit ${nbName} notebook cell(s) SQL`)
    .option("-d, --dest <file:string>", "Save the SQL in the provided filename")
    .arguments("[...cell:CellID]")
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
  const { nbh } = sno;

  const callerName = import.meta.resolve(import.meta.url);
  await new cliffy.Command()
    .name(callerName.slice(callerName.lastIndexOf("/") + 1))
    .version("0.1.0")
    .description("Content Aide")
    .option(
      "--root-path <file:string>",
      "Walk the file starting at this path",
      { default: Deno.cwd() },
    )
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
    .action(async ({ sqliteDb, rootPath }) => {
      // TODO: figure out how to check whether migrations are done already
      // and pass in the migrations table to the first SQL chains so that
      // they do not perform tasks that have already been performed.

      // deno-fmt-ignore
      const initSQL = nbh.SQL`
        -- because no specific SQL cell is named, send all the all information
        -- model objects (initialize the database) in the 'construction' NB
        ${await sno.constructionNBF.SQL({ separator: sno.separator })}

        -- store all SQL that is potentially reusable in the database
        ${await sno.storeNotebookCellsDML()}

        -- insert MIME types seed data and SQLPage content
        ${await sno.mutationNBF.SQL({ separator: sno.separator }, "mimeTypesSeedDML", "SQLPageSeedDML")}

        -- insert the fs content for the given path
        ${await sno.mutationNB.insertFsContent(rootPath)}
        `;

      // - First sqlite3 command sends all the SQL DDL and creates tables plus
      //   scans all the files by using SQLite extensions to insert what's
      //   possible from the DB itself (using fileio_ls, fileio_read, etc.).
      // If you want to capture any SQL or spawn logs, use Command loggers.
      await nbh.renderSqlCmd()
        .SQL(initSQL)
        .pipe(cmdNB.sqlite3({ filename: sqliteDb })) // takes initSQL and runs it through sqlite
        .execute();

      // - SQLite does not have frontmatter extensions so Pass 2 handles what
      //   cannot be done in DB using polyglotNB.mutateFrontmatterCommands.
      await sno.polyglotNB.frontmatterMutationCommands(sqliteDb).execute();
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
        .command("polyglot", notebookCommand("polyglot", sno.polyglotNBF as Any))
        .command("assurance", notebookCommand("assurance", sno.assuranceNBF as Any)),
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
