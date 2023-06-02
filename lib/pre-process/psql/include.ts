import { path } from "../../../deps.ts";
import { Directive, DirectiveDeclState } from "./governance.ts";

export interface IncludeDecl {
  readonly include: string; // original filename
  readonly resolved: string; // after "relative" (or absolute) mutation
  readonly srcLine: string; // original \i or \include line
  readonly srcLineNum: number; // original line number
}

export interface IncludeContent extends IncludeDecl {
  readonly content: string[] | undefined; // the content in target
  readonly contentError?: Error; // in case content could not be read
}

export interface IncludeDirective extends Directive {
  readonly encountered: IncludeContent[];
}

/**
 * Implement psql `\include` directive. Supports these types of set statements:
 *
 *   \i 'filename'
 *   \i "filename"
 *   \include 'filename'
 *
 * @param init provide options for how to handle parsing of \set command
 * @returns a SetVarValueDirective implementation
 */
export function includeDirective(
  init?: {
    resolve?: (target: string, srcLine: string, srcLineNum: number) => string;
    content?: (decl: IncludeDecl) => IncludeContent;
    onContentError?: (err: Error, decl: IncludeDecl) => string[] | undefined;
  },
): IncludeDirective {
  const resolve = init?.resolve ??
    ((include) =>
      path.isAbsolute(include) ? include : path.relative(Deno.cwd(), include));
  const onContentError = init?.onContentError ??
    ((err, decl) => [`-- \\include ${decl.resolved} error ${err}`]);
  const content = init?.content ??
    // regex matches any line terminator: \n (used by Unix and modern macOS),
    // \r\n (used by Windows), and \r (used by older macOS)
    ((decl): IncludeContent => {
      try {
        return {
          ...decl,
          content: Deno.readTextFileSync(decl.resolved).split(/\r?\n|\r/),
        };
      } catch (err) {
        return {
          ...decl,
          content: onContentError(err, decl),
          contentError: err,
        };
      }
    });
  const encountered: IncludeDirective["encountered"] = [];

  // the \2 refers to starting quotation, if any
  // this regex is used across invocations, be careful and don't include `/g`
  const regex = /^\s*\\(i|include)\s+(['"])?((?:[^\2]|\\.)*)\2\s*$/;

  return {
    directive: "include",
    encountered,
    isDirective: (src) => src.line.match(regex) ? true : false,
    handleDeclaration: ({ line, lineNum: srcLineNum }): DirectiveDeclState => {
      const match = regex.exec(line);
      if (match) {
        const [, _symbol, _quote, include] = match;
        const resolved = resolve(include, line, srcLineNum);
        const decl: IncludeDecl = {
          include,
          resolved,
          srcLine: line,
          srcLineNum,
        };
        const ic = content(decl);
        encountered.push(ic);
        return { state: "replaced", lines: ic.content };
      }
      return { line, state: "not-mutated" };
    },
  };
}
