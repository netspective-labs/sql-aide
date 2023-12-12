import * as safety from "../../lib/universal/safety.ts";
import * as sql from "./sql.ts";

export type PolygenCellText =
  | string
  | string[];

export type PolygenCellContent<Context extends sql.SqlEmitContext> =
  | PolygenCellText
  | ((ctx: Context) => PolygenCellText | Promise<PolygenCellText>)
  | sql.SqlTextSupplier<Context>;

export type PolygenCellContentSync<Context extends sql.SqlEmitContext> =
  | PolygenCellText
  | ((ctx: Context) => PolygenCellText)
  | sql.SqlTextSupplier<Context>;

export async function polygenCellContent<Context extends sql.SqlEmitContext>(
  ctx: Context,
  psc: PolygenCellContentSupplier<Context> | PolygenCellContent<Context>,
): Promise<string> {
  if (isPolygenCellContentSupplier<Context>(psc)) {
    return polygenCellContent(ctx, psc.polygenContent);
  }
  if (sql.isSqlTextSupplier<Context>(psc)) return psc.SQL(ctx);

  if (typeof psc === "string") {
    return psc;
  } else if (typeof psc === "function") {
    return await polygenCellContent(ctx, await psc(ctx));
  } else {
    if (psc.length == 0) return "";
    return psc.join("\n");
  }
}

export function polygenCellContentSync<Context extends sql.SqlEmitContext>(
  ctx: Context,
  psc: PolygenCellContentSync<Context>,
): string {
  if (sql.isSqlTextSupplier<Context>(psc)) return psc.SQL(ctx);

  if (typeof psc === "string") {
    return psc;
  } else if (typeof psc === "function") {
    return polygenCellContentSync(ctx, psc(ctx));
  } else {
    if (psc.length == 0) return "";
    return psc.join("\n");
  }
}

export interface PolygenCellContentSupplier<
  Context extends sql.SqlEmitContext,
> {
  readonly polygenContent: PolygenCellContent<Context>;
}

export function isPolygenCellContentSupplier<
  Context extends sql.SqlEmitContext,
>(
  o: unknown,
): o is PolygenCellContentSupplier<Context> {
  const isPCCS = safety.typeGuard<PolygenCellContentSupplier<Context>>(
    "polygenContent",
  );
  return isPCCS(o);
}

export interface PolygenCellContentEmitTransformer {
  before: (interpolationSoFar: string, exprIdx: number) => string;
  after: (nextLiteral: string, exprIdx: number) => string;
}

export const removeLineFromPolygenEmitStream:
  PolygenCellContentEmitTransformer = {
    before: (isf) => {
      // remove the last line in the interpolation stream
      return isf.replace(/\n.*?$/, "");
    },
    after: (literal) => {
      // remove everything up to and including the line break
      return literal.replace(/.*?\n/, "\n");
    },
  };

export interface PolygenCellContentBehaviorSupplier<
  Context extends sql.SqlEmitContext,
> {
  readonly executePolygenSrcCodeBehavior: (
    context: Context,
  ) =>
    | PolygenCellContentEmitTransformer
    | PolygenCellContentSupplier<Context>
    | PolygenCellContentSupplier<Context>[];
}

export function isPolygenCellContentBehaviorSupplier<
  Context extends sql.SqlEmitContext,
>(
  o: unknown,
): o is PolygenCellContentBehaviorSupplier<Context> {
  const isPSCBS = safety.typeGuard<
    PolygenCellContentBehaviorSupplier<Context>
  >("executePolygenSrcCodeBehavior");
  return isPSCBS(o);
}
