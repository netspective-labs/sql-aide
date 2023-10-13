#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run --allow-sys

import { cliffy, fs } from "./deps.ts";
import * as ft from "../../lib/universal/flexible-text.ts";
import * as sh from "../../lib/sqlite/shell.ts";
import * as notebook from "./notebook.sqla.ts";
import * as m from "./models.sqla.ts";
import * as SQLa from "../../render/mod.ts";
import * as typical from "../../pattern/typical/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export type DryRunnable = { readonly dryRun: boolean };
export type VerboseCapable = { readonly verbose: boolean };

export type Reportable = {
  readonly dryRun?: (message: string) => void;
  readonly verbose?: (message: string) => void;
  readonly log?: (message: string) => void;
  readonly error?: (message: string, error?: Error) => void;
};

export function reportCLI(
  options: Partial<DryRunnable> & Partial<VerboseCapable>,
): Reportable {
  return {
    dryRun: options?.dryRun
      ? ((message: string) => console.log(message))
      : undefined,
    verbose: options?.verbose
      ? ((message: string) => console.log(message))
      : undefined,
    log: (message: string) => console.log(message),
    error: (message: string) => console.error(message),
  };
}

export type ExtensionLoadSqlSupplier<Extension extends string> = (
  extnIdentity: Extension,
) => string;

export const sqlPkgExtnLoadSqlSupplier = (
  extnIdentity: string,
): SQLa.SqlTextBehaviorSupplier<Any> => {
  const sqlPkgHome = Deno.env.has("SQLPKG_HOME")
    ? Deno.env.get("SQLPKG_HOME")
    : `${Deno.env.get("HOME")}/.sqlpkg`;
  return {
    executeSqlBehavior: () => {
      return {
        SQL: () => `.load ${sqlPkgHome}/${extnIdentity}`,
      };
    },
  };
};

const library = (options: { sqliteDb?: string }) => {
  return notebook.library({
    loadExtnSQL: sqlPkgExtnLoadSqlSupplier,
    execDbQueryResult: async (sql, sqliteDb) => {
      return await sh.sqliteCmdAsJSON(
        sqliteDb ?? options?.sqliteDb ?? ":memory:",
        sql,
        {
          onError: (escResult) => {
            console.error(escResult?.stderr());
            console.log(sql);
            return undefined;
          },
        },
      );
    },
  });
};

const emitSQL = async (
  sqlSupplier: Parameters<typeof sh.executeSqliteUA>[1],
  options:
    & { dest?: string | undefined }
    & { sqliteDb?: string | undefined }
    & Partial<DryRunnable>
    & Partial<VerboseCapable>
    & Parameters<typeof sh.executeSqliteUA>[2],
) => {
  if (
    typeof options.dest === "undefined" &&
    typeof options.sqliteDb === "undefined"
  ) {
    console.log(ft.flexibleTextList(sqlSupplier).join("\n"));
    return;
  }

  if (options.dest) {
    await Deno.writeTextFile(
      options.dest,
      ft.flexibleTextList(sqlSupplier).join("\n"),
    );
  }

  if (options.sqliteDb) {
    if (typeof options.optimization === "undefined") {
      options = { ...options, optimization: false };
    }
    await sh.executeSqliteUA(options.sqliteDb!, sqlSupplier, {
      ...options,
      report: reportCLI(options),
    });
  }
};

export function notebookCommand(description: string) {
  // deno-fmt-ignore
  return new cliffy.Command()
    .description(description)
    .option("-d, --dest <file:string>", "Save the SQL in the provided filename")
    .option("--sqlite-db <file:string>", "Execute the SQL in the provided SQLite database")
    .option("--dest-db-sql <SQL:string>", "If using --sqlite-db, emit this SQL after loading into :memory: before writing to DB")
    .option("--no-optimization", "If using --sqlite-db, do not load the SQL into SQLite :memory: db first")
    .option("--remove-dest-first", "If using --sqlite-db, delete the SQLite DB before executing SQL")
    .option("--dump", "Append `.dump` to the end of the SQL to faciliate sending output via pipe")
    .option("--dry-run", "Show what will be done without doing it")
    .option("--verbose", "Show what's being done while doing it");
}

export function notebookEntriesCommand() {
  // deno-fmt-ignore
  return notebookCommand("Emit one or more SQL entries to STDOUT or SQLite database when generated SQL does not have parameters")
    .option("-s, --separators", "Include comments before each SQL block")
    .arguments("[sql-identity...]")
    .action(async (options, ...sqlIdentities) => {
      const l = library(options);
      if(sqlIdentities.length == 0) {
        console.log(Object.keys(l.entries).join("\n"))
      } else {
        emitSQL(await l.SQL(options, ...sqlIdentities as (keyof typeof l.entries)[]), options)
      }
    });
}

export function sqlCommand() {
  const customCmds = ["insertMonitoredContent"];

  // deno-fmt-ignore
  let result: Any = notebookCommand("Emit single SQL entry to STDOUT or SQLite database when generated SQL has arguments")
    .action((options) => {
      const l = library(options);
      console.log(Object.keys(l.entries).map(si => customCmds.find((cc) => cc == si) ? `${si} (has args)` : si).join("\n"));
    });
  result = result.command(
    "insertMonitoredContent",
    notebookCommand("Insert monitored content")
      .option(
        "--blobs-reg-ex <reg-ex:string>",
        "Include content blobs in registry for files matching reg-ex",
      )
      .action((options) => {
        const l = library(options);
        const ctx = m.sqlEmitContext();
        emitSQL(
          l.entries.insertMonitoredContent(options).SQL(ctx),
          options,
        );
      }),
  );

  const l = library({ sqliteDb: ":memory:" });
  for (
    const si of Object.keys(l.entries).filter((k) =>
      customCmds.find((cc) => cc == k) ? false : true
    )
  ) {
    result = result.command(
      si,
      notebookCommand(si)
        .action(async (options) => {
          emitSQL(
            await l.SQL(options, si as keyof typeof l.entries),
            options,
          );
        }),
    );
  }
  return result as ReturnType<typeof notebookCommand>;
}

export function diagramCommand() {
  // deno-fmt-ignore
  return new cliffy.Command()
    .description("Emit Diagram")
    .option("-d, --dest <file:string>", "Output destination, STDOUT if not supplied")
    .action((options) => {
      const models = m.models();
      const ctx = SQLa.typicalSqlEmitContext({
        sqlDialect: SQLa.sqliteDialect(),
      });
      const diagram = ft.flexibleTextList(() => {
        return typical.diaPUML.plantUmlIE(ctx, function* () {
          for (const table of models.contentTables) {
            if (SQLa.isGraphEntityDefinitionSupplier(table)) {
              yield table.graphEntityDefn();
            }
          }
        }, typical.diaPUML.typicalPlantUmlIeOptions()).content;
      }).join("\n");
      if (options.dest) {
        Deno.writeTextFileSync(options.dest, diagram);
      } else {
        console.log(diagram);
      }
    });
}

export async function defaultAction(
  options: { sqliteDb: string; blobsRegEx: string },
) {
  const { sqliteDb, blobsRegEx } = options;
  const l = library(options);
  const ctx = m.sqlEmitContext();
  if (!fs.existsSync(sqliteDb)) {
    await emitSQL(await l.SQL({}, "init", "mimeTypesSeedDML"), {
      sqliteDb,
      optimization: true, // should only be used on `init` (or new DB)
      verbose: false,
    });
  }
  const imcSQL = l.entries.insertMonitoredContent({ blobsRegEx }).SQL(
    ctx,
  );
  await emitSQL(imcSQL, { sqliteDb, verbose: false });

  // this command will used the data prepared above and do post-processing that
  // cannot be done in SQLite CLI so we do it in TypeScript
  const ppfsc = await l.postProcessFsContent();
  if (ppfsc) {
    await emitSQL(function* () {
      yield ppfsc.SQL(ctx);
      // add any other processing necessary
    }, { sqliteDb, verbose: false });
  }
}

const callerName = import.meta.resolve(import.meta.url);
new cliffy.Command()
  .name(callerName.slice(callerName.lastIndexOf("/") + 1))
  .version("0.1.0")
  .description("Content Aide")
  .option(
    "--sqlite-db <file:string>",
    "Execute the SQL in the provided SQLite database",
    { default: `device-content.sqlite.db` },
  )
  .option(
    "--blobs-reg-ex <reg-ex:string>",
    "Include content blobs for files matching reg-ex",
    {
      default: "\\.(md|mdx|html)$",
    },
  )
  .action(async (options) => await defaultAction(options))
  .command("help", new cliffy.HelpCommand().global())
  .command("completions", new cliffy.CompletionsCommand())
  .command("diagram", diagramCommand())
  .command("notebook", notebookEntriesCommand())
  .command("sql", sqlCommand())
  .parse();
