import * as safety from "../../lib/universal/safety.ts";
import * as sql from "./sql.ts";

export interface PolygenSrcCodeEmitOptions {
  readonly tableStructName: (tableName: string) => string;
  readonly tableStructFieldName: (
    tc: { tableName: string; columnName: string },
  ) => string;
}

export type PolygenSrcCodeText =
  | string
  | string[];

export type PolygenSrcCode<Context extends sql.SqlEmitContext> =
  | PolygenSrcCodeText
  | ((ctx: Context) => PolygenSrcCodeText | Promise<PolygenSrcCodeText>)
  | sql.SqlTextSupplier<Context>;

export type PolygenSrcCodeSync<Context extends sql.SqlEmitContext> =
  | PolygenSrcCodeText
  | ((ctx: Context) => PolygenSrcCodeText)
  | sql.SqlTextSupplier<Context>;

export async function sourceCodeText<Context extends sql.SqlEmitContext>(
  ctx: Context,
  psc: PolygenSrcCodeSupplier<Context> | PolygenSrcCode<Context>,
): Promise<string> {
  if (isPolygenSrcCodeSupplier<Context>(psc)) {
    return sourceCodeText(ctx, psc.sourceCode);
  }
  if (sql.isSqlTextSupplier<Context>(psc)) return psc.SQL(ctx);

  if (typeof psc === "string") {
    return psc;
  } else if (typeof psc === "function") {
    return await sourceCodeText(ctx, await psc(ctx));
  } else {
    if (psc.length == 0) return "";
    return psc.join("\n");
  }
}

export function sourceCodeTextSync<Context extends sql.SqlEmitContext>(
  ctx: Context,
  psc: PolygenSrcCodeSync<Context>,
): string {
  if (sql.isSqlTextSupplier<Context>(psc)) return psc.SQL(ctx);

  if (typeof psc === "string") {
    return psc;
  } else if (typeof psc === "function") {
    return sourceCodeTextSync(ctx, psc(ctx));
  } else {
    if (psc.length == 0) return "";
    return psc.join("\n");
  }
}

export interface PolygenSrcCodeSupplier<Context extends sql.SqlEmitContext> {
  readonly sourceCode: PolygenSrcCode<Context>;
}

export function isPolygenSrcCodeSupplier<Context extends sql.SqlEmitContext>(
  o: unknown,
): o is PolygenSrcCodeSupplier<Context> {
  const isPSCS = safety.typeGuard<PolygenSrcCodeSupplier<Context>>(
    "sourceCode",
  );
  return isPSCS(o);
}

export interface PolygenSrcCodeBehaviorEmitTransformer {
  before: (interpolationSoFar: string, exprIdx: number) => string;
  after: (nextLiteral: string, exprIdx: number) => string;
}

export const removeLineFromPolygenEmitStream:
  PolygenSrcCodeBehaviorEmitTransformer = {
    before: (isf) => {
      // remove the last line in the interpolation stream
      return isf.replace(/\n.*?$/, "");
    },
    after: (literal) => {
      // remove everything up to and including the line break
      return literal.replace(/.*?\n/, "\n");
    },
  };

export interface PolygenSrcCodeBehaviorSupplier<
  Context extends sql.SqlEmitContext,
> {
  readonly executePolygenSrcCodeBehavior: (
    context: Context,
  ) =>
    | PolygenSrcCodeBehaviorEmitTransformer
    | PolygenSrcCodeSupplier<Context>
    | PolygenSrcCodeSupplier<Context>[];
}

export function isPolygenSrcCodeBehaviorSupplier<
  Context extends sql.SqlEmitContext,
>(
  o: unknown,
): o is PolygenSrcCodeBehaviorSupplier<Context> {
  const isPSCBS = safety.typeGuard<
    PolygenSrcCodeBehaviorSupplier<Context>
  >("executePolygenSrcCodeBehavior");
  return isPSCBS(o);
}
