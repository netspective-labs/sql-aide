#!/usr/bin/env -S deno run --allow-read
import * as cli from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";
import { unindentWhitespace as uws } from "../../../lib/universal/whitespace.ts";
import * as SQLa from "../../../render/mod.ts";

export const ctx = SQLa.typicalSqlEmitContext({
  sqlDialect: SQLa.sqliteDialect(),
});
export type EmitContext = typeof ctx;
export type SqlTextSupplier = SQLa.SqlTextSupplier<EmitContext>;

// See [SQLite Pragma Cheatsheet for Performance and Consistency](https://cj.rs/blog/sqlite-pragma-cheatsheet-for-performance-and-consistency/)
export const optimalOpenDB: SqlTextSupplier = {
  SQL: () =>
    uws(`
      PRAGMA journal_mode = wal; -- different implementation of the atomicity properties
      PRAGMA synchronous = normal; -- synchronise less often to the filesystem
      PRAGMA foreign_keys = on; -- check foreign key reference, slightly worst performance`),
};

export const optimalCloseDB: SqlTextSupplier = {
  SQL: () =>
    uws(`
      PRAGMA analysis_limit=400; -- make sure pragma optimize does not take too long
      PRAGMA optimize; -- gather statistics to improve query optimization`),
};

/*
 * This SQL statement retrieves column information for tables in an SQLite database
 * including table name, column ID, column name, data type, nullability, default
 * value, and primary key status.
 * It filters only tables from the result set. It is commonly used for analyzing
 * and documenting database schemas.
 * NOTE: pragma_table_info(m.tbl_name) will only work when m.type is 'table'
 */
export const inspect: SqlTextSupplier = {
  SQL: () =>
    uws(`
      SELECT
          tbl_name AS table_name,
          c.cid AS column_id,
          c.name AS column_name,
          c."type" AS "type",
          c."notnull" AS "notnull",
          c.dflt_value as "default_value",
          c.pk AS primary_key
      FROM
          sqlite_master m,
          pragma_table_info(m.tbl_name) c
      WHERE
          m.type = 'table';`),
};

export const library = { optimalOpenDB, optimalCloseDB, inspect } as const;
export type SqlIdentity = keyof typeof library;

export function libraryItemCmd(item: SqlTextSupplier, description: string) {
  return new cli.Command()
    .description(description)
    .action(() => console.log(item.SQL(ctx)));
}

export function libraryCLI(args?: {
  resolve?: (specifier?: string) => string;
  name?: string;
  version?: string;
  description?: string;
}) {
  const callerName = args?.resolve?.();
  return {
    callerName,
    // deno-fmt-ignore
    commands: new cli.Command()
      .name(
        args?.name ??
          (callerName
            ? callerName.slice(callerName.lastIndexOf("/") + 1)
            : `sqla`),
      )
      .version(args?.version ?? "0.0.0")
      .description(args?.description ?? "SQLite SQL Library")
      .command("help", new cli.HelpCommand().global())
      .command("completions", new cli.CompletionsCommand())
      .command("inspect", libraryItemCmd(inspect, "Emit SQLite schema inspection SQL"))
      .command("lifecycle", new cli.Command()
        .description("Emit SQLite database lifecycle SQL")
        .option("-c --closing", "Whether to emit the closing database SQL")
        .action((options) => console.log(options.closing ? optimalCloseDB.SQL(ctx) : optimalOpenDB.SQL(ctx))))
      .command("notebook", new cli.Command()
        .description("Emit all or some of the statements as a SQL notebook")
        .option("-l, --list", "list all the names of the statements available")
        .option("-s, --separators", "include comments before each SQL block")
        .arguments("[identity...]")
        .action(({ separators, list }, ...identities) => {
          if(list) {
            Array.from(Object.keys(library)).forEach(k => console.log(k))
          } else {
            if(identities.length > 0) {
              for(const key of identities) {
                if(key in library) {
                  console.log(`${separators ? `-- ${key}\n` : ''}${library[key as SqlIdentity].SQL(ctx)}\n`);
                }
              }
            } else {
              for(const [key, value] of Object.entries(library)) {
                console.log(`${separators ? `-- ${key}\n` : ''}${value.SQL(ctx)}\n`);
              }
            }
          }
        })),
  };
}

if (import.meta.main) {
  const CLI = libraryCLI();
  await CLI.commands.parse();
}
