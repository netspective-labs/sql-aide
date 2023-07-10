#!/usr/bin/env -S deno run --allow-read --allow-write

import * as sh from "./shell.ts";
import * as flow from "../flow/mod.ts";
import * as mod from "./mod.ts";

export function flowCLI<SqlIdentity extends string>(
  args?: Parameters<typeof flow.cliInfrastructure>[0] & {
    library?: () => Record<SqlIdentity, mod.SqlTextSupplier>;
  },
) {
  const clii = flow.cliInfrastructure({
    ...args,
    resolveURI: (specifier) =>
      specifier ? import.meta.resolve(specifier) : import.meta.url,
  });
  return {
    ...clii,
    // deno-fmt-ignore
    commands: clii.commands
      .command("db", flow.typicalFlowCommand()
        .description("create or update an SQLite database with SQL")
        .option("--dest=<name>", "the destination database path", { required: true })
        .option("--sql-src=<SQL>", "the src of SQL that should be passed into destination", { required: true })
        .option("--no-optimization", "don't load the SQL into memory first")
        .option("--remove-dest-first", "if the src file should be deleted before executing SQL")
        .action(
          async (options) => await sh.executeSqliteUA(
            options.dest,
            { fileSystemPath: options.sqlSrc },
            { ...options, report: clii.reportCLI(options) })))
      .command("bash", clii.command()
        .description("generate a bash script for driving SQLite database")
        .option("--dest=<name>", "the destination of the bash script, defaults to STDOUT")
        .option("--sql-src=<SQL>", "the src of SQL that should be passed into destination", { required: true })
        .action(
           async (options) => {
              const scriptContent = sh.sqliteMemToFileBashScript({ fileSystemPath: options.sqlSrc }, options.dest);
              if(options.dest) {
                await Deno.writeTextFile(options.dest, scriptContent);
              } else {
                console.log(scriptContent);
              }
           }))
      .command("sql", clii.command()
        .command("inspect", clii.command()
          .description("Emit SQLite schema inspection SQL")
          .action(() => console.log(mod.inspect.SQL(mod.ctx))))
        .command("lifecycle",clii.command()
          .description("Emit SQLite database lifecycle SQL")
          .option("-c, --closing", "Whether to emit the closing database SQL")
          .action((options) => console.log(options.closing ? mod.optimalCloseDB.SQL(mod.ctx) : mod.optimalOpenDB.SQL(mod.ctx))))
        .command("notebook", clii.command()
          .description("Emit all or some of the statements as a SQL notebook")
          .option("-l, --list", "list all the names of the statements available")
          .option("-s, --separators", "include comments before each SQL block")
          .arguments("[identity...]")
          .action(({ separators, list }, ...identities) => {
            const library = args?.library?.();
            if(!library) return;
            if(list) {
              Array.from(Object.keys(library)).forEach(k => console.log(k))
            } else {
              if(identities.length > 0) {
                for(const key of identities) {
                  if(key in library) {
                    console.log(`${separators ? `-- ${key}\n` : ''}${library[key as SqlIdentity].SQL(mod.ctx)}\n`);
                  }
                }
              } else {
                for(const [key, value] of Object.entries<mod.SqlTextSupplier>(library)) {
                  console.log(`${separators ? `-- ${key}\n` : ''}${value.SQL(mod.ctx)}\n`);
                }
              }
            }
          })))
        .description('emit SQLite SQL'),
  };
}

if (import.meta.main) {
  const CLI = flowCLI({ cliName: "sqlite", library: () => mod.sqlLibrary });
  await CLI.commands.parse();
}
