#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run --allow-sys

import { cliffy, path } from "./deps.ts";
import * as ft from "../../lib/universal/flexible-text.ts";
import * as sh from "../../lib/sqlite/shell.ts";
import * as nbooks from "./notebooks.ts";
import * as SQLa from "../../render/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export class SqliteError extends Error {
  constructor(readonly sql: ft.FlexibleTextSupplierSync, message: string) {
    super(message);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SqliteError);
    }

    this.name = "SqliteError";
  }
}

export async function execDbQueryResult<Shape>(
  sql: ft.FlexibleTextSupplierSync,
  sqliteDb?: string,
) {
  let sqliteErr: SqliteError | undefined = undefined;
  const scaj = await sh.sqliteCmdAsJSON<Shape>(
    sqliteDb ?? ":memory:",
    sql,
    {
      onError: (escResult) => {
        sqliteErr = new SqliteError(sql, escResult.stderr());
        console.error(sqliteErr);
        return undefined;
      },
    },
  );
  return sqliteErr ?? scaj;
}

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

export const emitSQL = async (
  sqlSupplier: Parameters<typeof sh.executeSqliteUA>[1],
  options:
    & {
      readonly sqlDest?: string | undefined;
      readonly sqliteDb?: string | undefined;
      readonly verbose?: boolean;
    }
    & Parameters<typeof sh.executeSqliteUA>[2],
) => {
  if (
    typeof options.sqlDest === "undefined" &&
    typeof options.sqliteDb === "undefined"
  ) {
    console.log(ft.flexibleTextList(sqlSupplier).join("\n"));
    return;
  }

  if (options.sqlDest) {
    await Deno.writeTextFile(
      options.sqlDest,
      ft.flexibleTextList(sqlSupplier).join("\n"),
    );
  }

  if (options.sqliteDb) {
    if (typeof options.optimization === "undefined") {
      options = { ...options, optimization: false };
    }
    await sh.executeSqliteUA(options.sqliteDb!, sqlSupplier, {
      ...options,
      report: {
        verbose: options?.verbose
          ? ((message: string) => console.log(message))
          : undefined,
        log: (message: string) => console.log(message),
        error: (message: string) => console.error(message),
      },
    });
  }
};

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
          console.log(cell.nbShapeCell)
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
      "--sql-dest <file:string>",
      "Store the generated SQL in the provided filename",
    )
    .option(
      "--sqlite-db <file:string>",
      "Execute the SQL in the provided SQLite database",
      { default: `device-content.sqlite.db` },
    )
    .option("--verbose", "Show what is being done")
    .action(async (options) => {
      // deno-fmt-ignore
      const sql = sno.nbh.SQL`
        -- construct all information model objects (initialize the database)
        ${(await sno.constructionNBF.SQL({ separator: sno.separator }))}

        -- store all SQL that is potentially reusable in the database
        ${(await sno.storeNotebookCellsDML())}

        -- insert the SQLPage content and current working directory fs content into the database
        ${(await sno.mutationNBF.SQL({ separator: sno.separator }, "mimeTypesSeedDML", "SQLPageSeedDML", "insertFsContentCWD"))}
        `.SQL(sno.nbh.emitCtx);

      await emitSQL(sql, options);

      const polyglotSQL = sno.nbh.SQL`
        ${await (sno.polyglotNB.postProcessFsContent(async () => {
        return await execDbQueryResult<
          { fs_content_id: string; content: string }
        >(
          sno.queryNB.frontmatterCandidates().SQL(sno.nbh.emitCtx),
          options.sqliteDb,
        ) ??
          [];
      }))}`;
      await emitSQL(polyglotSQL.SQL(sno.nbh.emitCtx), options);
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
