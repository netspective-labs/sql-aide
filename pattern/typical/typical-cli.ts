import * as cli from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";
import * as SQLa from "../../render/mod.ts";
import * as ws from "../../lib/universal/whitespace.ts";

export * as cli from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";

export const dialects = [
  "SQLite",
  "PostgreSQL",
  "Microsoft SQL*Server",
] as const;
export const cliDialect = new cli.EnumType(dialects);
export type CliGlobals = { dialect?: typeof cliDialect };

export function typicalCLI<Globals extends CliGlobals>(args: {
  resolve?: (specifier?: string) => string;
  name?: string;
  version?: string;
  description?: string;
  defaultDialect?: typeof dialects[number];
  prepareSQL: (
    options: CliGlobals & {
      isDefaultAction?: boolean;
      dest?: string | undefined;
      destroyFirst?: boolean;
      schemaName?: string;
    },
  ) => string;
  sqlCmdAction?: (
    options: CliGlobals & {
      isDefaultAction?: boolean;
      dest?: string | undefined;
      destroyFirst?: boolean;
      schemaName?: string;
    },
  ) => void;
  prepareDiagram: (
    options: CliGlobals & {
      dest?: string | undefined;
    },
  ) => string;
  diagramCmdAction?: (
    options: CliGlobals & {
      dest?: string | undefined;
    },
  ) => void;
}) {
  const defaultDialect = args.defaultDialect ?? "SQLite";
  const callerName = args.resolve?.();
  const handleSqlCmd: typeof args.sqlCmdAction = args.sqlCmdAction ??
    ((options) => {
      const output = args.prepareSQL(options);
      if (options.dest) {
        Deno.writeTextFileSync(options.dest, output);
      } else {
        console.log(output);
      }
    });
  const handleDiagramCmd: typeof args.diagramCmdAction =
    args.diagramCmdAction ??
      ((options) => {
        const pumlERD = args.prepareDiagram(options);
        if (options.dest) {
          Deno.writeTextFileSync(options.dest, pumlERD);
        } else {
          console.log(pumlERD);
        }
      });

  return {
    callerName,
    // deno-fmt-ignore
    commands: new cli.Command<Globals>()
      .name(
        args.name ??
          (callerName
            ? callerName.slice(callerName.lastIndexOf("/") + 1)
            : `sqla`),
      )
      .version(args.version ?? "0.0.0")
      .description(args.description ?? "SQL Aide")
      .globalType("dialect", cliDialect)
      .globalOption("-d, --dialect <dialect-name:dialect>", "SQL Dialect", { default: defaultDialect })
      .action(() => handleSqlCmd({ isDefaultAction: true }))
      .command("help", new cli.HelpCommand().global())
      .command("completions", new cli.CompletionsCommand())
      .command("sql", new cli.Command()
        .description("Emit SQL")
        .option("-d, --dest <file:string>", "Output destination, STDOUT if not supplied")
        .option("--destroy-first", "Include SQL to destroy existing objects first (dangerous but useful for development)")
        .option("--schema-name <schemaName:string>", "If destroying or creating a schema, this is the name of the schema")
        .action((options) => handleSqlCmd(options)))
      .command("diagram", new cli.Command()
        .description("Emit Diagram")
        .option("-d, --dest <file:string>", "Output destination, STDOUT if not supplied")
        .action((options) => handleDiagramCmd(options))),
  };
}

/**
 * Wrap the provided SQL into a Powershell script that will load the SQL.
 * IMPORTANT: this should be a "twin" of support/bin/ms-sql-server-load.ps1;
 *            if you change the code here, reflect it there. The only difference
 *            is that this script embeds the SQL in the generated Powershell
 *            script so that it can be used in a CLI pipe but ms-sql-server-load.ps1
 *            allows a SQL file to be passed into as a separate file.
 * @param ss SQL supplier
 * @param ctx active Context
 * @returns text suitable for emitting to STDOUT or saving a text file
 */
export function powershellDriver<Context extends SQLa.SqlEmitContext>(
  ss: SQLa.SqlTextSupplier<Context>,
  ctx: Context,
) {
  // deno-fmt-ignore
  return ws.unindentWhitespace(`
    param (
        [Parameter(Mandatory=$true)]
        [string]$ServerName,

        [Parameter(Mandatory=$true)]
        [string]$DatabaseName
    )

    $connectionString = "Server=$ServerName;Database=$DatabaseName;Integrated Security=True;"
    $query = @"
    ${ws.unindentWhitespace(ss.SQL(ctx)).split("\n").map((line) => "    " + line).join("\n")}
    "@

    try {
        $connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
        $connection.Open()

        $command = $connection.CreateCommand()
        $command.CommandText = $query
        $command.ExecuteNonQuery()

        Write-Host "SQL query executed successfully."
    }
    catch {
        Write-Host "Error executing SQL query: $_"
    }
    finally {
        $connection.Close()
    }
  `);
}
