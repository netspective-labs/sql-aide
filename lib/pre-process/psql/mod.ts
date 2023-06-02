import * as mc from "./meta-command.ts";
import * as s from "./set.ts";
import * as i from "./include.ts";

export * from "./set.ts";
export * from "./include.ts";

/**
 * Preprocess text in a way that `psql` would. Specifically, allow:
 *
 * - `\set` variables to be defined in the source and overridden via CLI.
 * - '\include' files relative to current working directory (like `psql`)
 *
 * Defaults are as close to `psql` as possible. But many features can be
 * overriden using directives instances.
 *
 * @param content the actual SQL to preprocess
 * @param interpolate the incoming variables to replace (overrides any \set directives)
 * @param options how the preprocessing should be handled
 * @returns all the internal processing and final result of preprocessing
 */
export function psqlPreprocess(
  content: string | string[],
  init?: {
    readonly setMetaCmd?: s.PsqlSetMetaCmd;
    readonly includeMetaCmd?: i.PsqlIncludeMetaCmd;
    readonly ppDirectives?: (
      suggested: mc.PsqlMetaCommand[],
    ) => mc.PsqlMetaCommand[];
  },
) {
  const svvd = init?.setMetaCmd ?? s.psqlSetMetaCmd();
  const id = init?.includeMetaCmd ?? i.includeMetaCmd();
  const srcLines = Array.isArray(content) ? content : content.split("\n");

  // first process all the \include then \set directives, returning mutated srcLines
  const preprocessed = mc.processPsqlMetaCmd(
    svvd,
    mc.processPsqlMetaCmd(id, srcLines),
  );

  return {
    preprocessed,
    ...svvd.interpolate(preprocessed),
  };
}
