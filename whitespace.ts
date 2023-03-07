export function minWhitespaceIndent(text: string): number {
  const match = text.match(/^[ \t]*(?=\S)/gm);
  return match ? match.reduce((r, a) => Math.min(r, a.length), Infinity) : 0;
}

export function unindentWhitespace(
  text: string,
  removeInitialNewLine = true,
): string {
  const indent = minWhitespaceIndent(text);
  const regex = new RegExp(`^[ \\t]{${indent}}`, "gm");
  const result = text.replace(regex, "");
  return removeInitialNewLine ? result.replace(/^\n/, "") : result;
}

export function singleLineTrim(text: string): string {
  return text.replace(/(\r\n|\n|\r)/gm, "")
    .replace(/\s+(?=(?:[^\'"]*[\'"][^\'"]*[\'"])*[^\'"]*$)/g, " ")
    .trim();
}

export type TemplateLiteralIndexedTextSupplier = (index: number) => string;

/**
 * String template literal tag utility that wraps the literals and will
 * retrieve literals with sensitivity to indented whitespace. If
 * @param literals literals supplied to template literal string function
 * @param suppliedExprs expressions supplied to template literal string function
 * @param options whitespace sensitivity options
 * @returns a function that will wrap the literal and return unindented text
 */
export function whitespaceSensitiveTemplateLiteralSupplier(
  literals: TemplateStringsArray,
  suppliedExprs: unknown[],
  options?: {
    readonly unindent?: boolean | RegExp;
    readonly removeInitialNewLine?: boolean;
  },
): TemplateLiteralIndexedTextSupplier {
  const { unindent = true, removeInitialNewLine = true } = options ?? {};
  let literalSupplier = (index: number) => literals[index];
  if (unindent) {
    if (typeof unindent === "boolean") {
      // we want to auto-detect and build our regExp for unindenting so let's
      // build a sample of what the original text might look like so we can
      // compute the "minimum" whitespace indent
      let originalText = "";
      for (let i = 0; i < suppliedExprs.length; i++) {
        originalText += literals[i] + `\${expr${i}}`;
      }
      originalText += literals[literals.length - 1];
      const match = originalText.match(/^[ \t]*(?=\S)/gm);
      const minWhitespaceIndent = match
        ? match.reduce((r, a) => Math.min(r, a.length), Infinity)
        : 0;
      if (minWhitespaceIndent > 0) {
        const unindentRegExp = new RegExp(
          `^[ \\t]{${minWhitespaceIndent}}`,
          "gm",
        );
        literalSupplier = (index: number) => {
          let text = literals[index];
          if (index == 0 && removeInitialNewLine) {
            text = text.replace(/^\n/, "");
          }
          return text.replace(unindentRegExp!, "");
        };
      }
    } else {
      literalSupplier = (index: number) => {
        let text = literals[index];
        if (index == 0 && removeInitialNewLine) {
          text = text.replace(/^\n/, "");
        }
        return text.replace(unindent, "");
      };
    }
  }
  return literalSupplier;
}
