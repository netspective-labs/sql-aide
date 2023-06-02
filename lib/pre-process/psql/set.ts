import { Directive } from "./governance.ts";

export interface VarValueDictionary {
  [key: string]:
    | string
    | ((match: string) => string)
    | undefined;
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
    & { readonly overrides?: VarValueDictionary },
): SetVarValueDirective {
  const catalog: SetVarValueDirective["catalog"] = new Map();
  // the \3 refers to starting quotation, if any
  // this regex is used across invocations, be careful and don't include `/g`
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
