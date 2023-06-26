import * as safety from "../../lib/universal/safety.ts";
import { SqlNamespaceSupplier } from "./namespace.ts";
import * as sql from "./sql.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export type SqlObjectCommentTarget = "table" | "column";

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

export enum SqlLintIssueConsequence {
  INFORMATIONAL_DDL = "Informational (DDL)",
  INFORMATIONAL_DML = "Informational (DML)",
  INFORMATIONAL_DQL = "Informational (DQL)",
  CONVENTION_DDL = "Convention (DDL)",
  CONVENTION_DML = "Convention (DML)",
  CONVENTION_DQL = "Convention (DQL)",
  WARNING_DDL = "DDL Warning",
  WARNING_DML = "DML Warning",
  WARNING_DQL = "DQL Warning",
  FATAL_DDL = "FATAL DDL",
  FATAL_DML = "FATAL DML",
  FATAL_DQL = "FATAL DQL",
}

export interface SqlLintIssueSupplier {
  readonly lintIssue: string;
  readonly location?: string | ((options?: { maxLength?: number }) => string);
  readonly consequence?: SqlLintIssueConsequence | string;
}

export interface TemplateStringSqlLintIssue extends SqlLintIssueSupplier {
  readonly templateLiterals: TemplateStringsArray;
  readonly templateExprs: unknown[];
}

export function templateStringLintIssue(
  lintIssue: string,
  templateLiterals: TemplateStringsArray,
  templateExprs: unknown[],
): TemplateStringSqlLintIssue {
  return {
    lintIssue,
    templateLiterals,
    templateExprs,
    location: ({ maxLength } = {}) => {
      const result = templateLiterals.join("${}").replaceAll(
        /(\n|\r\n)/gm,
        " ",
      );
      return maxLength ? `${result.substring(0, maxLength)}...` : result;
    },
  };
}

export const isTemplateStringLintIssue = safety.typeGuard<
  TemplateStringSqlLintIssue
>("lintIssue", "templateLiterals", "templateExprs");

export interface SqlLintIssuesSupplier {
  readonly registerLintIssue: (...slis: SqlLintIssueSupplier[]) => void;
  readonly lintIssues: SqlLintIssueSupplier[];
}

export const isSqlLintIssuesSupplier = safety.typeGuard<SqlLintIssuesSupplier>(
  "registerLintIssue",
  "lintIssues",
);

export interface SqlLintRule<Options = unknown> {
  readonly lint: (lis: SqlLintIssuesSupplier, options?: Options) => void;
}

export function aggregatedSqlLintRules<Options = Any>(
  ...rules: SqlLintRule<Options>[]
) {
  const rule: SqlLintRule<Options> = {
    lint: (lis, lOptions) => rules.forEach((r) => r.lint(lis, lOptions)),
  };
  return rule;
}
