import * as ws from "../../../lib/universal/whitespace.ts";
import * as pa from "../../../lib/postgres/psql-aide.ts";
import * as emit from "../../emit/mod.ts";

// this module simply wraps `lib/postgres/psql-aide.ts`, which does not depend
// upon SQLa (it's a library that can be used by anyone, even without SQLa).
// Using the `psqlText` and `pgFormatText` wrappers you use the functionality
// directly in SQLa.

export function psqlText<
  InjectablesShape extends pa.InjectablesArgsShape,
  Context extends emit.SqlEmitContext,
>(
  injShape: InjectablesShape,
  resolve: (
    injs: ReturnType<typeof pa.injectables<InjectablesShape>>,
    template: (
      literals: TemplateStringsArray,
      ...suppliedExprs: pa.InjectableExpr[]
    ) => { readonly body: string },
  ) => void,
  paOptions?: {
    readonly injectables?: (injShape: InjectablesShape) => ReturnType<
      typeof pa.injectables<InjectablesShape>
    >;
    readonly literalSupplier?: (
      literals: TemplateStringsArray,
      suppliedExprs: unknown[],
    ) => ws.TemplateLiteralIndexedTextSupplier;
  },
):
  & emit.SqlTextSupplier<Context>
  & ReturnType<typeof pa.psqlAideCustom<InjectablesShape>> {
  const pacResult = pa.psqlAideCustom(
    injShape,
    resolve,
    paOptions ??
      { literalSupplier: ws.whitespaceSensitiveTemplateLiteralSupplier },
  );
  return {
    ...pacResult,
    SQL: () => pacResult.body,
  };
}

export function pgFormatText<
  ArgsShape extends pa.InjectablesArgsShape,
  Context extends emit.SqlEmitContext,
>(
  argsShape: ArgsShape,
  resolve: (
    fa: ReturnType<typeof pa.injectables<ArgsShape>>,
    template: (
      literals: TemplateStringsArray,
      ...suppliedExprs: pa.InjectableExpr[]
    ) => { readonly body: string },
  ) => void,
  argsSupplier?: (
    par: ReturnType<typeof pa.psqlAideCustom<ArgsShape>>,
  ) => string[],
  faOptions?: {
    readonly bodyDelim?: string;
    readonly literalSupplier?: (
      literals: TemplateStringsArray,
      suppliedExprs: unknown[],
    ) => ws.TemplateLiteralIndexedTextSupplier;
  },
):
  & emit.SqlTextSupplier<Context>
  & ReturnType<typeof pa.formatAideCustom<ArgsShape>> {
  const facResult = pa.formatAideCustom(
    argsShape,
    resolve,
    faOptions ??
      { literalSupplier: ws.whitespaceSensitiveTemplateLiteralSupplier },
  );
  return {
    ...facResult,
    SQL: () => facResult.format(argsSupplier, faOptions?.bodyDelim),
  };
}
