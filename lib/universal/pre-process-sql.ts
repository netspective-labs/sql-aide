#!/usr/bin/env -S deno run --allow-all
import * as cli from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";

export interface Dictionary {
  [key: string]:
    | string
    | ((match: string) => string)
    | undefined;
}

export interface Directive {
  readonly directive: string;
  readonly isDirective: (encountered: {
    readonly line: string;
    readonly lineNum: number;
  }) => boolean;
  readonly handleDeclaration: (encountered: {
    readonly line: string;
    readonly lineNum: number;
  }) => {
    readonly state: "mutated" | "not-mutated" | "removed";
    readonly line: string;
  };
}

export interface SetVarValueDecl {
  readonly varName: string;
  readonly varValue: string;
  readonly varValueQuote: string | undefined;
  readonly hasEquals: boolean;
  readonly srcLine: string;
  readonly srcLineNum: number;
}

export interface SetVarValueDirective extends Directive {
  readonly catalog: Map<string, SetVarValueDecl>;
  readonly varValue: (varName: string) =>
    | {
      readonly found: true;
      readonly override: false;
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
    variable: string,
    value: string,
    line: string,
    lineNum: number,
  ) => string | undefined;
  readonly onVarValueNotFound: (variable: string) => string | undefined;
  readonly onUndefinedVarValue: (variable: string) => string | undefined;
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
 * @returns a SetVarValueDirective implementation
 */
export function setVarValueDirective(
  init?:
    & Partial<
      Pick<
        SetVarValueDirective,
        "handleSetInResult" | "onVarValueNotFound" | "onUndefinedVarValue"
      >
    >
    & { readonly overrides?: Dictionary },
): SetVarValueDirective {
  const catalog: SetVarValueDirective["catalog"] = new Map();
  // the \3 refers to starting quotation, if any
  const regex = /^\s*\\set\s+(\w+)\s*(=)?\s*(['"])?((?:[^\3]|\\.)*)\3\s*$/;
  const handleSetInResult = init?.handleSetInResult ?? ((
    variable,
    value,
    line,
    lineNum,
  ) =>
    `-- ${line} (variable: ${variable}, value: ${value}, srcLine: ${lineNum})`);
  const onVarValueNotFound = init?.onVarValueNotFound ?? (() => undefined);
  const onUndefinedVarValue = init?.onUndefinedVarValue ?? (() => undefined);

  return {
    directive: "set",
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
        return { found: true, override: false, ...entry };
      }
      return { found: false };
    },
    isDirective: (encountered) => encountered.line.match(regex) ? true : false,
    handleSetInResult,
    onVarValueNotFound,
    onUndefinedVarValue,
    handleDeclaration: (encountered) => {
      let line = encountered.line;
      let state: "mutated" | "not-mutated" | "removed" = "not-mutated";
      const match = regex.exec(encountered.line);
      if (match) {
        const [, varName, hasEquals, varValueQuote, varValue] = match;
        const srcLine = encountered.line;
        const srcLineNum = encountered.lineNum;
        catalog.set(varName, {
          varName,
          varValue,
          hasEquals: hasEquals ? true : false,
          varValueQuote,
          srcLine: encountered.line,
          srcLineNum: encountered.lineNum,
        });
        const hsir = handleSetInResult(
          varName,
          varValue,
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
  };
}

/**
 * Preprocess text in a way that `psql` would. Specifically, allow `\set`
 * variables to be defined in the source and overridden via CLI.
 *
 * Supports these types of set statements (must be at the start of a line):
 *   \set name John
 *   \set count 42
 *   \set url 'https://example.com'
 *   \set var = value
 *   \set greeting 'Hello, \'world!'
 *   \set greeting2 "Hello, \"world!"
 *
 * Supports this type of replacement:
 *   :'name'       replaced with John
 *   :'var'        replaced with value
 *   :'greeting'   replaced with Hello, world!
 *
 * @param content the actual SQL to preprocess
 * @param interpolate the incoming variables to replace (overrides any \set directives)
 * @param options how the preprocessing should be handled
 * @returns all the internal processing and final result of preprocessing
 */
export function psqlPreprocess(
  content: string | string[],
  init?: { readonly setDirective?: SetVarValueDirective },
) {
  const svvd = init?.setDirective ?? setVarValueDirective();

  // preprocess all the directives, which might mutate content
  const srcLines = Array.isArray(content) ? content : content.split("\n");
  const preprocessed: string[] = [];
  let lineNum = 0;
  for (const line of srcLines) {
    lineNum++;
    const encountered = { line, lineNum };
    if (svvd.isDirective(encountered)) {
      const hd = svvd.handleDeclaration(encountered);
      if (hd.state !== "removed") {
        preprocessed.push(hd.line);
      }
    } else {
      preprocessed.push(line);
    }
  }

  const inspect: {
    readonly setVarValueDirective: typeof svvd;
    readonly interpolated: {
      readonly quoted: "single" | "double" | "no";
      readonly varName: string;
      readonly varValue: ReturnType<SetVarValueDirective["varValue"]>;
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
    preprocessed,
    interpolatedText,
    inspect,
  };
}

if (import.meta.main) {
  const script = import.meta.url;
  // deno-fmt-ignore
  await new cli.Command()
    .name(script.slice(script.lastIndexOf("/") + 1))
    .version("0.0.1")
    .description("Preprocess a SQL file and replace variables.")
    .command("help", new cli.HelpCommand().global())
    .command("completions", new cli.CompletionsCommand())
    .command("psql", new cli.Command()
      .description("Preprocess a SQL file similar to how `psql` would process variables and other input.")
      .arguments("<src>")
      .option("-s --src <...psql-file:string>", "additional SQL source file(s)")
      .option("-i --inspect", "show inspection output instead of emitting SQL source")
      .option("--set.* <variable:string>", "--set.XYZ=value would override XYZ with value provided")
      .action((options, src) => {
          const srcFiles = [src, ...(options.src ?? [])];
          for (const srcFile of srcFiles) {
            const pp = psqlPreprocess(
              Deno.readTextFileSync(srcFile),
              options.set && Object.keys(options.set).length > 0 ? {
                setDirective: setVarValueDirective({overrides: options.set})
              } : undefined,
            );
            if (options?.inspect) {
              console.dir(pp.inspect);
            } else {
              console.log(pp.interpolatedText);
            }
          }
        }))
    // TODO: add other pre-processors like MySQL, ORACLE, SQL*Server, SQLite, etc.
    .parse(Deno.args);
}
