#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run --allow-sys

import { cliffy, frontmatter as fm, path } from "./deps.ts";
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
      const initSQL = sno.nbh.SQL`
        -- because no specific SQL cell is named, send all the all information
        -- model objects (initialize the database) in the 'construction' NB
        ${await sno.constructionNBF.SQL({ separator: sno.separator })}

        -- store all SQL that is potentially reusable in the database
        ${await sno.storeNotebookCellsDML()}

        -- insert the SQLPage content and current working directory fs content into the database
        ${await sno.mutationNBF.SQL({ separator: sno.separator }, "mimeTypesSeedDML", "SQLPageSeedDML")}

        -- insert the fs content for the given path into the database
        ${await sno.mutationNB.insertFsContent(rootPath)}
        `;

      const sqlite3 = (identity: string) =>
        cmdNB.sqlite3({ filename: sqliteDb, identity });

      // - Pass 1 sends all the SQL DDL and creates tables plus scans all the
      //   files and uses SQLite extensions to insert what's possible from the
      //   DB itself (using fileio_ls, fileio_read, etc.). SQLite does not have
      //   frontmatter extensions so Pass2 handles what cannot be done in DB.
      // - Pass 2 finds all frontmatter candidates from Pass1, returning SQL
      //   result as JSON rows array to STDOUT. Pass 2 has no side effects.
      // - Pass 3 generates `UPDATE` SQL DML for all frontmatter candidates and
      //   then executes the DML from Pass 2 which mutates the database.
      // If you want to capture any SQL or spawn logs, use Command loggers.
      // TODO: there is a lot direct SQL injection so let's figure out if bind
      //       variables and prepared statements through SQLite shell are safer
      //       or faster?
      // deno-fmt-ignore
      await sno.nbh.renderSqlCmd()
        .SQL(initSQL)
        .pipe(sqlite3("pass 1"))
          .pipe(sqlite3("pass 2"))
            .SQL(`SELECT fs_content_id, content
                    FROM fs_content
                  WHERE (file_extn = '.md' OR file_extn = '.mdx')
                    AND content IS NOT NULL
                    AND content_fm_body_attrs IS NULL
                    AND frontmatter IS NULL;`)
            .outputJSON() // adds "--json" arg to SQLite pass 2
            .pipe(sqlite3("pass 3"), {
              // safeStdIn will be called with STDOUT from previous SQL statement;
              // we will take result of `SELECT fs_content_id, content...` and
              // convert it JSON then loop through each row to prepare SQL
              // DML (`UPDATE`) to set the frontmatter. The function prepares the
              // SQL and hands it to another SQLite shell for execution.
              // deno-lint-ignore require-await
              safeStdIn: async (sc, writer) => {
                const { quotedLiteral } = sno.nbh.emitCtx.sqlTextEmitOptions;
                const te = new TextEncoder();
                sc.array<{ fs_content_id: string; content: string }>().forEach((fmc) => {
                  if (fm.test(fmc.content)) {
                    const parsedFM = fm.extract(fmc.content);
                    // each writer.write() call adds content into the SQLite stdin
                    // stream that will be sent to Deno.Command
                    writer.write(te.encode(
                      `UPDATE fs_content SET
                          frontmatter = ${quotedLiteral(JSON.stringify(parsedFM.attrs))[1]},
                          content_fm_body_attrs = ${quotedLiteral(JSON.stringify(parsedFM))[1]}
                      WHERE fs_content_id = '${fmc.fs_content_id}';\n`));
                  }
                });
              },
            }).execute();
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
