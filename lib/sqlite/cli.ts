#!/usr/bin/env -S deno run --allow-read --allow-write

import * as ft from "../universal/flexible-text.ts";
import * as sh from "./shell.ts";
import * as flow from "../flow/mod.ts";
import * as mod from "./mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export function bashCommand(
  clii: ReturnType<typeof flow.cliInfrastructure>,
  args?: Parameters<typeof flow.cliInfrastructure>[0] & {
    defaultSql?: ft.FlexibleTextSupplierSync;
  },
) {
  // deno-fmt-ignore
  return clii.command()
    .description("Generate a bash script for driving SQLite database")
    .option("--dest <file:string>", "The destination of the bash script, defaults to STDOUT")
    .option("--sql-src <file:string>", "The src of SQL that should be passed into destination")
    .action(
      async (options) => {
          const scriptContent = sh.sqliteMemToFileBashScript(options.sqlSrc ? { fileSystemPath: options.sqlSrc } : (args?.defaultSql ?? `-- no default SQL`), options.dest);
          if(options.dest) {
            await Deno.writeTextFile(options.dest, scriptContent);
          } else {
            console.log(scriptContent);
          }
      });
}

export function dbCommand(
  clii: ReturnType<typeof flow.cliInfrastructure>,
  args?: Parameters<typeof flow.cliInfrastructure>[0] & {
    defaultSql?: ft.FlexibleTextSupplierSync;
  },
) {
  // we use the "flow" command because it has the ability to dry-run/verbose
  // deno-fmt-ignore
  return flow.typicalFlowCommand()
    .description("Create or update an SQLite database with SQL")
    .option("-d, --dest <file:string>", "The destination database path", { required: true })
    .option("-s, --sql-src <file:string>", "The src of SQL that should be passed into destination")
    .option("--no-optimization", "Do not load the SQL into SQLite :memory: db first")
    .option("--remove-dest-first", "If the dest file should be deleted before executing SQL")
    .action(
      async (options) => await sh.executeSqliteUA(
        options.dest,
        options.sqlSrc ? { fileSystemPath: options.sqlSrc } : (args?.defaultSql ?? `-- no default SQL`),
        { ...options, report: clii.reportCLI(options) })
      );
}

export function sqlCommand<SqlIdentity extends string>(
  clii: ReturnType<typeof flow.cliInfrastructure>,
  args?: Parameters<typeof flow.cliInfrastructure>[0] & {
    readonly library?: () => Record<SqlIdentity, mod.SqlTextSupplier>;
  },
) {
  // deno-fmt-ignore
  const typical = clii.command()
    .command("inspect", clii.command()
      .description("Emit SQLite schema inspection SQL")
      .action(() => console.log(mod.inspect.SQL(mod.ctx))))
    .command("lifecycle", clii.command()
      .description("Emit SQLite database lifecycle SQL")
      .option("-c, --closing", "Whether to emit the closing database SQL")
      .action((options) => console.log(options.closing ? mod.optimalCloseDB.SQL(mod.ctx) : mod.optimalOpenDB.SQL(mod.ctx))));

  const library = args?.library?.();
  if (library) {
    let notebook = clii.command();
    for (const [key, value] of Object.entries<mod.SqlTextSupplier>(library)) {
      notebook = notebook.command(
        key,
        clii.command()
          .action(() => console.log(value.SQL(mod.ctx)))
          .description(`Emit '${key}' SQL to STDOUT`),
      ) as Any;
    }

    // deno-fmt-ignore
    return typical
      .command("notebook", notebook)
      .option("-s, --separators", "include comments before each SQL block")
      .description("Emit all or some of the statements as a SQL notebook")
      .arguments("[identity...]")
      .action(({ separators }, ...identities) => {
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
      });
  } else {
    return typical;
  }
}

export function diagramCommand(
  clii: ReturnType<typeof flow.cliInfrastructure>,
  diagramSupplier: () => ft.FlexibleText,
) {
  // deno-fmt-ignore
  return clii.command()
    .description("Emit Diagram")
    .option("-d, --dest <file:string>", "Output destination, STDOUT if not supplied")
    .action((options) => {
      const diagram = ft.flexibleTextList(diagramSupplier).join("\n");
      if (options.dest) {
        Deno.writeTextFileSync(options.dest, diagram);
      } else {
        console.log(diagram);
      }
    });
}

export function typicalCLI<SqlIdentity extends string>(
  args?: Parameters<typeof flow.cliInfrastructure>[0] & {
    library?: () => Record<SqlIdentity, mod.SqlTextSupplier>;
    defaultSql?: ft.FlexibleTextSupplierSync;
  },
) {
  const clii = flow.cliInfrastructure({
    ...args,
    resolveURI: (specifier) =>
      specifier ? import.meta.resolve(specifier) : import.meta.url,
  });

  return {
    clii,
    sqlLibrary: mod.sqlLibrary,
    // deno-fmt-ignore
    commands: clii.commands
      .command("db", dbCommand(clii, args))
      .command("bash", bashCommand(clii, args))
      .command("sql", sqlCommand(clii, args))
      .description("Emit SQLite SQL")
      .option("-d, --dest <file:string>", "Output destination, STDOUT if not supplied")
      .action((options) => {
        if(!args?.defaultSql) {
          console.warn("No default SQL Supplier provided.")
          return;
        }
        const output = ft.flexibleTextList(args.defaultSql).join("\n");
        if (options.dest) {
          Deno.writeTextFileSync(options.dest, output);
        } else {
          console.log(output);
        }
      }),
  };
}

if (import.meta.main) {
  const CLI = typicalCLI({ library: () => mod.sqlLibrary });
  await CLI.commands.parse();
}
