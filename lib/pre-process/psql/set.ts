import { PsqlMetaCommand } from "./meta-command.ts";

export interface VarValueDictionary {
  [key: string]:
    | string
    | ((match: string) => string)
    | undefined;
}

export interface PsqlSetMetaCmdToken {
  readonly token: string;
  readonly quoteType?: "'" | '"' | undefined;
  readonly hasColon?: boolean;
}

export interface PsqlSetMetaCmdTokens {
  readonly isSet: boolean;
  readonly identifier?: string;
  readonly values?: PsqlSetMetaCmdToken[];
  readonly resolve?: (metaCmd: PsqlSetMetaCmd) => string;
}

export const psqlSetMetaCmdRegex = /^\s*\\set\s+(\w+)\s*=?\s*(.*)$/;
export const isPsqlSetMetaCmd = (line: string) =>
  line.match(psqlSetMetaCmdRegex) ? true : false;

export function psqlSetMetaCmdTokens(line: string): PsqlSetMetaCmdTokens {
  const setMatch = line.match(psqlSetMetaCmdRegex);
  if (!setMatch) {
    return { isSet: false };
  }

  const identifier = setMatch[1];
  let remainder = setMatch[2].trim();

  const values: PsqlSetMetaCmdToken[] = [];
  while (remainder) {
    const hasColon = remainder[0] === ":";
    if (hasColon) remainder = remainder.slice(1);

    let quoteType: "'" | '"' | undefined = undefined;
    if (remainder[0] === "'" || remainder[0] === '"') {
      quoteType = remainder[0] as "'" | '"';
      remainder = remainder.slice(1);
    }

    let endIdx = 0;
    while (
      endIdx < remainder.length &&
      (quoteType
        ? remainder[endIdx] !== quoteType || remainder[endIdx + 1] === quoteType
        : !/\s/.test(remainder[endIdx]))
    ) {
      if (quoteType && remainder[endIdx] === quoteType) endIdx++;
      endIdx++;
    }

    const token = remainder.slice(0, endIdx).replace(
      new RegExp(`${quoteType}{2}`, "g"),
      quoteType ?? "",
    );
    values.push({ token, quoteType, hasColon });

    remainder = remainder.slice(endIdx + (quoteType ? 1 : 0)).trim();
  }

  const resolve = (cmd: PsqlSetMetaCmd) => {
    let value = "";
    for (const v of values) {
      if (v.hasColon) {
        const vv = cmd.varValue(v.token);
        if (vv.found) {
          value += v.quoteType
            ? `${v.quoteType}${vv.varValue}${v.quoteType}`
            : (vv.varValue ?? "");
        } else {
          value += cmd.onVarValueNotFound(v.token) ?? `??${v.token}??`;
        }
      } else {
        value += v.token;
      }
    }
    return value;
  };

  return { isSet: true, identifier, values, resolve };
}

export interface SetVarValueDecl {
  readonly mcTokens: PsqlSetMetaCmdTokens;
  readonly srcLine: string;
  readonly srcLineNum: number;
}

export interface PsqlSetMetaCmd extends PsqlMetaCommand {
  readonly catalog: Map<string, SetVarValueDecl>;
  readonly varValue: (varName: string) =>
    | {
      readonly found: true;
      readonly override: false;
      readonly varValue: string | undefined;
    } & SetVarValueDecl
    | {
      readonly found: true;
      readonly override: true;
      readonly varValue: string | undefined;
    }
    | {
      readonly found: false;
    };
  readonly handleSetInResult: (
    mcTokens: PsqlSetMetaCmdTokens,
    line: string,
    lineNum: number,
  ) => string | undefined;
  readonly onVarValueNotFound: (variable: string) => string | undefined;
  readonly onUndefinedVarValue: (variable: string) => string | undefined;
  readonly interpolate: (
    text: string[] | string,
  ) => ReturnType<typeof interpolatePsql>;
}

/**
 * Implement psql `\set` directive. Supports these types of set statements:
 *
 *   \set name John
 *   \set count 42
 *   \set url 'https://example.com'
 *   \set var = value
 *   \set greeting 'Hello, \'world!'
 *   \set greeting2 "Hello, \"world!"
 *
 * @param init provide options for how to handle parsing of \set command
 * @returns a psqlSetMetaCmd implementation
 */
export function psqlSetMetaCmd(
  init?:
    & Partial<
      Pick<
        PsqlSetMetaCmd,
        "handleSetInResult" | "onVarValueNotFound" | "onUndefinedVarValue"
      >
    >
    & { readonly overrides?: VarValueDictionary },
): PsqlSetMetaCmd {
  const catalog: PsqlSetMetaCmd["catalog"] = new Map();
  const handleSetInResult = init?.handleSetInResult ?? ((
    mcTokens,
    line,
    lineNum,
  ) =>
    `-- ${line} (variable: ${mcTokens.identifier}, value: ${mcTokens.resolve?.(
      psmcInstance,
    )}, srcLine: ${lineNum})`);
  const onVarValueNotFound = init?.onVarValueNotFound ?? (() => undefined);
  const onUndefinedVarValue = init?.onUndefinedVarValue ?? (() => undefined);

  const psmcInstance: PsqlSetMetaCmd = {
    metaCommand: "set",
    catalog,
    varValue: (varName) => {
      if (init?.overrides && (varName in init.overrides)) {
        const prospect = init.overrides[varName];
        return {
          found: true,
          override: true,
          varValue: (typeof prospect === "function")
            ? prospect(varName)
            : prospect,
        };
      }
      const entry = catalog.get(varName);
      if (entry) {
        return {
          found: true,
          override: false,
          ...entry,
          varValue: entry.mcTokens.resolve?.(psmcInstance),
        };
      }
      return { found: false };
    },
    isMetaCommand: (encountered) => isPsqlSetMetaCmd(encountered.line),
    handleSetInResult,
    onVarValueNotFound,
    onUndefinedVarValue,
    handleMetaCommand: (encountered) => {
      let line = encountered.line;
      let state: "mutated" | "not-mutated" | "removed" = "not-mutated";
      const mcTokens = psqlSetMetaCmdTokens(line);
      if (mcTokens.isSet && mcTokens.identifier) {
        const srcLine = encountered.line;
        const srcLineNum = encountered.lineNum;
        catalog.set(mcTokens.identifier, {
          mcTokens,
          srcLine: encountered.line,
          srcLineNum: encountered.lineNum,
        });
        const hsir = handleSetInResult(
          mcTokens,
          srcLine,
          srcLineNum,
        );
        if (hsir) {
          line = hsir;
          state = "mutated";
        } else {
          state = "removed";
        }
      }
      return { state, line };
    },
    interpolate: (text) => interpolatePsql(text, psmcInstance),
  };
  return psmcInstance;
}

export function interpolatePsql(text: string[] | string, svvd: PsqlSetMetaCmd) {
  // now perform variables replacement
  const inspect: {
    readonly psqlSetMetaCmd: typeof svvd;
    readonly interpolated: {
      readonly quoted: "single" | "double" | "no";
      readonly varName: string;
      readonly varValue: ReturnType<PsqlSetMetaCmd["varValue"]>;
    }[];
  } = { psqlSetMetaCmd: svvd, interpolated: [] };
  const interpolatedText = (Array.isArray(text) ? text.join("\n") : text)
    .replace(
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
