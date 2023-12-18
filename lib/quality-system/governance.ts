import * as safety from "../../lib/universal/safety.ts";
import * as ws from "../../lib/universal/whitespace.ts";

export type Documentable = { readonly description: string };

export const isDocumentable = safety.typeGuard<Documentable>("description");

export type QualitySystemSupplier<QualitySystem extends Documentable> = {
  readonly qualitySystem: QualitySystem;
};

export function isQualitySystemSupplier<QualitySystem extends Documentable>(
  o: unknown,
): o is QualitySystemSupplier<QualitySystem> {
  const isQS = safety.typeGuard<QualitySystemSupplier<QualitySystem>>(
    "qualitySystem",
  );
  return isQS(o) && o.qualitySystem ? true : false;
}

/**
 * String template literal function suitable to preparing Quality System docs
 * (descriptions, etc.) in Markdown. This function auto-unindents our string
 * literals and removes initial newline.
 * @returns a function which can be used anywhere a string template literal can be
 */
export const qsMarkdown = (
  literals: TemplateStringsArray,
  ...expressions: unknown[]
) => {
  const literalSupplier = ws.whitespaceSensitiveTemplateLiteralSupplier(
    literals,
    expressions,
    {
      unindent: true,
      removeInitialNewLine: true,
    },
  );
  let interpolated = "";

  // Loop through each part of the template
  for (let i = 0; i < literals.length; i++) {
    interpolated += literalSupplier(i); // Add the string part
    if (i < expressions.length) {
      interpolated += expressions[i]; // Add the interpolated value
    }
  }
  return interpolated;
};
