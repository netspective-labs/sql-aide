import * as govn from "./governance.ts";
import * as s from "./set.ts";
import * as i from "./include.ts";

export * from "./set.ts";
export * from "./include.ts";

export function processPsqlDirective(
  d: govn.Directive,
  lines: string[],
): string[] {
  const result: string[] = [];
  let lineNum = 0;
  for (const line of lines) {
    lineNum++;
    const encountered = { line, lineNum };
    if (d.isDirective(encountered)) {
      const hd = d.handleDeclaration(encountered);
      switch (hd.state) {
        case "mutated":
        case "not-mutated":
          result.push(hd.line);
          break;

        case "replaced":
          if (hd.lines) result.push(...hd.lines);
          break;

        case "removed":
          // don't include in the destination
          break;
      }
    } else {
      result.push(line);
    }
  }
  return result;
}

export function interpolatePsql(
  preprocessed: string[],
  svvd: s.SetVarValueDirective,
) {
  // now perform variables replacement
  const inspect: {
    readonly setVarValueDirective: typeof svvd;
    readonly interpolated: {
      readonly quoted: "single" | "double" | "no";
      readonly varName: string;
      readonly varValue: ReturnType<s.SetVarValueDirective["varValue"]>;
    }[];
  } = { setVarValueDirective: svvd, interpolated: [] };
  const preprocessedText = preprocessed.join("\n");
  const interpolatedText = preprocessedText.replace(
    /(:+)(?:'(\w+)'|"(\w+)"|(\w+))/g,
    (match, colons, singleQuoted, doubleQuoted, unquoted) => {
      // we can see :xyz (replace without colon), ::xyz (ignore), or :::xyz (replace with one extra colon)
      if (colons.length == 2) return match;

      const varName = singleQuoted || doubleQuoted || unquoted;
      const vv = svvd.varValue(varName);

      inspect.interpolated.push({
        quoted: singleQuoted ? "single" : (doubleQuoted ? "double" : "no"),
        varName,
        varValue: vv,
      });

      // If the variable was not found, leave the match unchanged
      if (!vv.found) {
        const vvnf = svvd.onVarValueNotFound(varName);
        return vvnf ?? match;
      }

      // If the variable was not found, leave the match unchanged
      if (vv.varValue === undefined) {
        const uvv = svvd.onUndefinedVarValue(varName);
        return uvv ?? match;
      }

      // Otherwise, quote and return the value
      const keepColons = colons.length == 1
        ? ""
        : colons.slice(0, colons.length - 1);
      return singleQuoted
        ? `${keepColons}'${vv.varValue}'`
        : (doubleQuoted
          ? `${keepColons}"${vv.varValue}"`
          : `${keepColons}${vv.varValue}`);
    },
  );

  return {
    inspect,
    interpolatedText,
  };
}

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
    readonly setDirective?: s.SetVarValueDirective;
    readonly includeDirective?: i.IncludeDirective;
    readonly ppDirectives?: (suggested: govn.Directive[]) => govn.Directive[];
  },
) {
  const svvd = init?.setDirective ?? s.setVarValueDirective();
  const id = init?.includeDirective ?? i.includeDirective();
  const srcLines = Array.isArray(content) ? content : content.split("\n");

  // first process all the \include then \set directives, returning mutated srcLines
  const preprocessed = processPsqlDirective(
    svvd,
    processPsqlDirective(id, srcLines),
  );

  return {
    preprocessed,
    ...interpolatePsql(preprocessed, svvd),
  };
}
