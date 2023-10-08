#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run

import * as ft from "../../lib/universal/flexible-text.ts";
import * as sh from "../../lib/sqlite/shell.ts";
import * as flow from "../../lib/flow/mod.ts";
import * as notebook from "./notebook.sqla.ts";
import * as m from "./models.sqla.ts";
import * as SQLa from "../../render/mod.ts";
import * as typical from "../../pattern/typical/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

// TODO TODO for shell.ts:
// -- search for SQLite on path or through requested paths
// -- search for SQLite extensions on path or through requested paths
// TODO

// const relativeFilePath = (name: string) => {
//   const absPath = path.fromFileUrl(import.meta.resolve(name));
//   return path.relative(Deno.cwd(), absPath);
// };

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

export function sqlCommand(
  clii: ReturnType<typeof flow.cliInfrastructure>,
) {
  const models = m.models();
  const ctx = m.sqlEmitContext();

  const emitSQL = async (
    sqlSupplier: Parameters<typeof sh.executeSqliteUA>[1],
    options:
      & { dest?: string | undefined }
      & { sqliteDb?: string | undefined }
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
        report: clii.reportCLI(options),
      });
    }
  };

  // deno-fmt-ignore
  return clii.command()
    .description("Emit SQL to STDOUT or SQLite database")
    .option("-d, --dest <file:string>", "Save the SQL in the provided filename")
    .option("--sqlite-db <file:string>", "Execute the SQL in the provided SQLite database")
    .option("--dest-db-sql <SQL:string>", "If using --sqlite-db, emit this SQL after loading into :memory: before writing to DB")
    .option("--no-optimization", "If using --sqlite-db, do not load the SQL into SQLite :memory: db first")
    .option("--remove-dest-first", "If using --sqlite-db, delete the SQLite DB before executing SQL")
    .option("-s, --separators", "Include comments before each SQL block")
    .option("--dump", "Append `.dump` to the end of the SQL to faciliate sending output via pipe")
    .arguments("<sql-identity...>")
    .action((options, ...sqlIdentities) => {
      const library = notebook.notebook({ loadExtnSQL: sqlPkgExtnLoadSqlSupplier });
      const separators = options?.separators;
      const SQL: string[] = [];
      for(const si of sqlIdentities) {
        if(separators) SQL.push(`-- ${si}\n`);
        if(si in library) {
          SQL.push((library as Any)[si].SQL(ctx))
        } else {
          switch(si) {
            case "init":
              SQL.push(models.sqlDDL({ loadExtnSQL: sqlPkgExtnLoadSqlSupplier }).SQL(ctx));
              break;
          }
        }
      }
      if(options.dump) SQL.push(`.dump`);
      emitSQL(SQL, options)
    });
}

export function diagramCommand(
  clii: ReturnType<typeof flow.cliInfrastructure>,
) {
  // deno-fmt-ignore
  return clii.command()
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

// we use the "flow" infrastructure because it has the ability to dry-run/verbose
const clii = flow.cliInfrastructure({
  resolveURI: (specifier) =>
    specifier ? import.meta.resolve(specifier) : import.meta.url,
});

await clii.commands
  // .command("db", dbCommand(clii))
  .command("sql", sqlCommand(clii))
  .command("diagram", diagramCommand(clii))
  .parse();
