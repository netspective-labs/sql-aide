import { cliffy } from "./deps.ts";

export type DryRunnable = { readonly dryRun: boolean };
export type VerboseCapable = { readonly verbose: boolean };

/**
 * Prepare the Cliffy CLI infrastructure with all the typical commands and
 * options.
 * @param args.resolveURI Optional function to resolve a file name (usually from import.meta.url)
 * @param args.cliName Optional name of the CLI, defaults to the filename of the caller
 * @param args.cliVersion Optional version of the CLI (defaults to 0.0.0.0)
 * @param args.cliDescription Optional description of the CLI, defaults to `SQLa Flow`
 * @returns The CLI infrastructure ready to be parsed and run.
 */
export function cliInfrastructure(args?: {
  resolveURI?: (specifier?: string) => string;
  cliName?: string;
  cliVersion?: string;
  cliDescription?: string;
}) {
  // TODO:
  //  - support multi-/poly- storage state management: memory, fs, Deno KV, Dolt?, SQLite?
  //  - support starting a web server and serving content like /health.json /metrics, etc.
  //  - integrate Open Telemetry infrastructure for tracing, logging, metrics and similar observability
  //  - integrate ../universal/event-emitter support for observability, etc.
  //  - as we enhance the CLI, use generics for proper type-safety

  const callerName = args?.resolveURI?.();
  return {
    ...args,
    callerName,
    commands: new cliffy.Command()
      .name(
        args?.cliName ??
          (callerName
            ? callerName.slice(callerName.lastIndexOf("/") + 1)
            : `sqla`),
      )
      .version(args?.cliVersion ?? "0.0.0")
      .description(args?.cliDescription ?? "SQLa Flow")
      .command("help", new cliffy.HelpCommand().global())
      .command("completions", new cliffy.CompletionsCommand()),
    command: () => new cliffy.Command(),
  };
}

/**
 * Prepare a typical flow command name and default options/arguments.
 * @returns a Cliffy CLI command which should be augumented with an action
 */
export function typicalFlowCommand() {
  return new cliffy.Command()
    .option("--dry-run", "instead of executing, just show what would be done")
    .option("-v, --verbose", "instead of silently executing, show output");
}

// /**
//  * Prepare a typical "immediately" executed flow command name and default
//  * options/arguments. Immediately executed flows are typically scheduled outside
//  * of TypeScript runtime (e.g. via `cron` or similar).
//  * @returns a Cliffy CLI command which should be augumented with an action
//  */
// export function immediateFlowCommand<CommandName extends string = "flow">(
//   flowCmdName = "flow" as CommandName,
// ) {
//   return typicalFlowCommand<CommandName>(flowCmdName);
// }

// /**
//  * Prepare a scheduled flow command name and default options/arguments.
//  * @returns a Cliffy CLI command which should be augumented with an action
//  */
// export function scheduledFlowCommand<CommandName extends string = "flow">(
//   flowCmdName = "flow" as CommandName,
// ) {
//   const tfc = typicalFlowCommand<CommandName>(flowCmdName);
//   return {
//     ...tfc,
//     flowCommand: tfc.flowCommand.option(
//       "--cronspec",
//       "cron specification for scheduled execution",
//       { required: true },
//     ),
//   };
// }

// /**
//  * Prepare a sensor-based file watcher flow command name and default
//  * options/arguments.
//  * @returns a Cliffy CLI command which should be augumented with an action
//  */
// export function watchDirFlowCommand<CommandName extends string = "flow">(
//   flowCmdName = "flow" as CommandName,
// ) {
//   const tfc = typicalFlowCommand<CommandName>(flowCmdName);
//   return {
//     ...tfc,
//     flowCommand: tfc.flowCommand.option(
//       "--directory",
//       "the directory to watch",
//       { required: true },
//     ),
//   };
// }
