#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run

import { cliffy } from "./deps.ts";
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
    await sh.executeSqliteUA(options.sqliteDb, sqlSupplier, {
      ...options,
      report: reportCLI(options),
    });
  }
};

export function notebookCommand() {
  // deno-fmt-ignore
  return new cliffy.Command()
    .description("Emit SQL to STDOUT or SQLite database")
    .option("-d, --dest <file:string>", "Save the SQL in the provided filename")
    .option("--sqlite-db <file:string>", "Execute the SQL in the provided SQLite database")
    .option("--dest-db-sql <SQL:string>", "If using --sqlite-db, emit this SQL after loading into :memory: before writing to DB")
    .option("--no-optimization", "If using --sqlite-db, do not load the SQL into SQLite :memory: db first")
    .option("--remove-dest-first", "If using --sqlite-db, delete the SQLite DB before executing SQL")
    .option("-s, --separators", "Include comments before each SQL block")
    .option("--dump", "Append `.dump` to the end of the SQL to faciliate sending output via pipe")
    .arguments("[sql-identity...]")
    .action((options, ...sqlIdentities) => {
      const library = notebook.library({ loadExtnSQL: sqlPkgExtnLoadSqlSupplier });
      if(sqlIdentities.length == 0) {
        console.log(Object.keys(library.entries).join("\n"))
      } else {
        emitSQL(library.SQL(options, ...sqlIdentities as (keyof typeof library.entries)[]), options)
      }
    });
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

const callerName = import.meta.resolve(import.meta.url);
new cliffy.Command()
  .name(callerName.slice(callerName.lastIndexOf("/") + 1))
  .version("0.1.0")
  .description("Content Aide")
  .action(() => {
    const library = notebook.library({
      loadExtnSQL: sqlPkgExtnLoadSqlSupplier,
    });
    emitSQL(library.SQL({}, "init"), {
      sqliteDb: `device-content.sqlite.db`,
      removeDestFirst: true,
      verbose: true,
    });
  })
  .command("help", new cliffy.HelpCommand().global())
  .command("completions", new cliffy.CompletionsCommand())
  .command("diagram", diagramCommand())
  .command("notebook", notebookCommand())
  .parse();
