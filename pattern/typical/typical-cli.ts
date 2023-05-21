import * as cli from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";

export const cliDialect = new cli.EnumType(["SQLite", "PostgreSQL"]);
export type CliGlobals = { dialect?: typeof cliDialect };

export function typicalCLI<Globals extends CliGlobals>(args: {
  resolve?: (specifier?: string) => string;
  name?: string;
  version?: string;
  description?: string;
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
      .globalOption("-d, --dialect <dialect-name:dialect>", "SQL Dialect", { default: "SQLite" })
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
