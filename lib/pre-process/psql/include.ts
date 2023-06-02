import { path } from "../../../deps.ts";
import { Directive, DirectiveDeclState } from "./governance.ts";

export interface IncludeDecl {
  readonly metaCommand: "i" | "ir" | "include";
  readonly supplied: string; // original filename spplied
  readonly srcLine: string; // original \i or \include line
  readonly srcLineNum: number; // original line number
}

export interface IncludeResolved extends IncludeDecl {
  readonly resolved: string; // after "relative" (or absolute) mutation
}

export interface IncludeContent extends IncludeResolved {
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
    resolve?: (decl: IncludeDecl) => IncludeResolved;
    content?: (ir: IncludeResolved) => IncludeContent;
    onContentError?: (
      err: Error,
      decl: IncludeResolved,
    ) => string[] | undefined;
  },
): IncludeDirective {
  const resolve = init?.resolve ??
    ((decl) => {
      const { supplied: include } = decl;
      const resolved = path.isAbsolute(include)
        ? include
        : path.relative(Deno.cwd(), include);
      return { ...decl, resolved };
    });
  const onContentError = init?.onContentError ??
    ((err, decl) => [`-- \\${decl.metaCommand} ${decl.resolved} error ${err}`]);
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
  const regex = /^\s*\\(i|ir|include)\s+(['"])?((?:[^\2]|\\.)*)\2\s*$/;

  return {
    directive: "include",
    encountered,
    isDirective: (src) => src.line.match(regex) ? true : false,
    handleDeclaration: (
      { line: srcLine, lineNum: srcLineNum },
    ): DirectiveDeclState => {
      const match = regex.exec(srcLine);
      if (match) {
        const [, method, _quote, supplied] = match;
        const resolved = resolve({
          metaCommand: method as "i" | "ir" | "include",
          supplied,
          srcLine,
          srcLineNum,
        });
        const ic = content(resolved);
        encountered.push(ic);
        return { state: "replaced", lines: ic.content };
      }
      return { line: srcLine, state: "not-mutated" };
    },
  };
}
