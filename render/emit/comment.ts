import * as safety from "../../lib/universal/safety.ts";
import { SqlNamespaceSupplier } from "./namespace.ts";
import * as sql from "./sql.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export type SqlObjectCommentTarget = "table";

export interface SqlObjectComment<
  Target extends SqlObjectCommentTarget,
  TargetName extends string,
  Context extends sql.SqlEmitContext,
> extends sql.SqlTextSupplier<Context> {
  readonly type: Target;
  readonly target: TargetName;
  readonly comment: string;
  readonly sqlNS?: SqlNamespaceSupplier;
}

export const isSqlObjectComment = safety.typeGuard<
  SqlObjectComment<Any, Any, Any>
>(
  "type",
  "target",
  "comment",
);

export type SqlObjectCommentSupplier<
  Target extends SqlObjectCommentTarget,
  TargetName extends string,
  Context extends sql.SqlEmitContext,
> = {
  readonly sqlObjectComment: () => SqlObjectComment<
    Target,
    TargetName,
    Context
  >;
};

export type SqlObjectsCommentsSupplier<
  Target extends SqlObjectCommentTarget,
  TargetName extends string,
  Context extends sql.SqlEmitContext,
> = {
  readonly sqlObjectsComments: () => SqlObjectComment<
    Target,
    TargetName,
    Context
  >[];
};

export function isSqlObjectCommentSupplier<
  Target extends SqlObjectCommentTarget,
  TargetName extends string,
  Context extends sql.SqlEmitContext,
>(o: unknown): o is SqlObjectCommentSupplier<Target, TargetName, Context> {
  return o && typeof o === "object" && "sqlObjectComment" in o &&
      o.sqlObjectComment
    ? true
    : false;
}

export function isSqlObjectsCommentsSupplier<
  Target extends SqlObjectCommentTarget,
  TargetName extends string,
  Context extends sql.SqlEmitContext,
>(o: unknown): o is SqlObjectsCommentsSupplier<Target, TargetName, Context> {
  return o && typeof o === "object" && "sqlObjectsComments" in o &&
      o.sqlObjectsComments
    ? true
    : false;
}
