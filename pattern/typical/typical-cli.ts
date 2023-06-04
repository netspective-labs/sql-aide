import * as cli from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";
import * as SQLa from "../../render/mod.ts";
import * as ws from "../../lib/universal/whitespace.ts";

export * as cli from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";

// for convenience so that deno-lint is not required for use of `any`
// deno-lint-ignore no-explicit-any
type Any = any;

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

/**
 * Wrap the provided SQL into a SQLite bash script which will first load the
 * file into an in-memory SQLite database then dump that SQL into a file-based
 * SQLite database. We do the interim step because complex SQL will load
 * faster with this two-step process. This is especially in SQLite because
 * insert DMLs often use something like this, note `SELECT` for values.
 *
 * INSERT INTO "party_relation" ("party_id", "related_party_id", "relation_type_id", "party_role_id", "created_by")
 *      VALUES ((SELECT "party_id" FROM "party" WHERE "party_type_id" = 'PERSON' AND "party_name" = 'person'),
 *              (SELECT "party_id" FROM "party" WHERE "party_type_id" = 'PERSON' AND "party_name" = 'person'),
 *              'ORGANIZATION_TO_PERSON', 'VENDOR', NULL);
 *
 * Because SQLite does not have any scripting language, if we want to use pure
 * SQL we must "lookup" references as select statements. When those select
 * statements are looked up in memory they're very fast but on disk it's slow.
 * So, we run the first step in memory and then emit the output to disk.
 *
 * @param ss SQL supplier
 * @param ctx active Context
 * @returns text suitable for emitting to STDOUT or saving a text file
 */
export function sqliteMemToFileDriver<Context extends SQLa.SqlEmitContext>(
  ss: SQLa.SqlTextSupplier<Context>,
  ctx: Context,
) {
  // deno-fmt-ignore
  return ws.unindentWhitespace(`
    #!/bin/bash

    destroy_first=0
    db_file=""

    # Parse command-line options
    for arg in "$@"
    do
        case $arg in
            --destroy-first)
                destroy_first=1
                shift # Remove --destroy-first from processing
                ;;
            *)
                db_file=$1
                shift # Remove database filename from processing
                break # Stop processing after the filename so we can pass the rest into final SQLite DB
                ;;
        esac
    done

    # Check if the database file parameter is supplied
    if [ -z "$db_file" ]
    then
        echo "No database file supplied. Usage: ./your_script.sh [--destroy-first] <database_file> [<sqlite3 arguments>...]"
        exit 1
    fi

    # If the destroy_first flag is set, delete the database file
    if [ $destroy_first -eq 1 ] && [ -f "$db_file" ]; then
        rm "$db_file"
    fi

    SQL=$(cat <<-EOF
    ${ws.unindentWhitespace(ss.SQL(ctx)).split("\n").map((line) => "    " + line).join("\n")}
    -- the .dump in the last line is necessary because we load into :memory:
    -- first because performance is better and then emit all the SQL for saving
    -- into the destination file, e.g. when insert DML uses (select x from y where a = b))
    .dump
    EOF
    )

    # Create an in-memory SQLite database, load the first pass for optimal
    # performance then export the in-memory database to the given file; this
    # two phase approach works because the last line in the SQL is '.dump'.
    # All arguments after <database_file> will be passed into the final DB.
    sqlite3 "$db_file" "$(echo "$SQL" | sqlite3 ":memory:")" "\${@}"
  `);
}

export const sqliteDriverCommand = <Context extends SQLa.SqlEmitContext>(
  sql: () => SQLa.SqlTextSupplier<Context>,
  ctx: Context,
) =>
  new cli.Command()
    .description("Emit SQLite Bash Driver")
    .option(
      "-d, --dest <file:string>",
      "Output destination, STDOUT if not supplied",
    )
    .action((options) => {
      const output = sqliteMemToFileDriver(sql(), ctx);
      if (options.dest) {
        Deno.writeTextFileSync(options.dest, output);
      } else {
        console.log(output);
      }
    });
