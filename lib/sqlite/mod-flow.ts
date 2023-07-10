#!/usr/bin/env -S deno run --allow-read

import * as sh from "./shell.ts";
import * as flow from "../flow/mod.ts";
import * as mod from "./mod.ts";

export function flowCLI(args?: Parameters<typeof flow.cliInfrastructure>[0]) {
  const report = ({ verbose }: { verbose?: boolean }) => {
    if (verbose) return (message: string) => console.log(message);
    return undefined;
  };
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
        .option("--remove-sql-src-first", "if the src file should be deleted before executing SQL")
        .action(async (options) => await sh.executeSqliteCLI({ ...options, report: report(options) })))
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
            const library = mod.sqlLibrary;
            if(list) {
              Array.from(Object.keys(library)).forEach(k => console.log(k))
            } else {
              if(identities.length > 0) {
                for(const key of identities) {
                  if(key in library) {
                    console.log(`${separators ? `-- ${key}\n` : ''}${library[key as mod.SqlIdentity].SQL(mod.ctx)}\n`);
                  }
                }
              } else {
                for(const [key, value] of Object.entries(library)) {
                  console.log(`${separators ? `-- ${key}\n` : ''}${value.SQL(mod.ctx)}\n`);
                }
              }
            }
          }))).description('emit SQLite SQL'),
  };
}

if (import.meta.main) {
  const CLI = flowCLI({ cliName: "sqlite" });
  await CLI.commands.parse();
}
