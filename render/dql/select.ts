import { zod as z } from "../deps.ts";
import * as safety from "../../lib/universal/safety.ts";
import * as ws from "../../lib/universal/whitespace.ts";
import * as tmpl from "../emit/mod.ts";
import * as d from "../domain/mod.ts";
import * as cr from "./criteria.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

// TODO:
// [ ] use https://github.com/oguimbal/pgsql-ast-parser or similar to parse SQL
//     statements and auto-discover columns, tables, etc. instead of requiring
//     developers to provide definition
// [ ] generate dialect-specific EXPLAIN PLAN statements

export interface Select<
  SelectStmtName extends string,
  Context extends tmpl.SqlEmitContext,
> extends tmpl.SqlTextSupplier<Context> {
  readonly isValid: boolean;
  readonly selectStmt: tmpl.SqlTextSupplier<Context>;
  readonly selectStmtName?: SelectStmtName;
}

const firstWordRegEx = /^\s*([a-zA-Z0-9]+)/;

const firstWord = (text: string) => {
  const firstWordMatch = text.match(firstWordRegEx);
  if (firstWordMatch && firstWordMatch.length > 1) {
    return firstWordMatch[1].toUpperCase();
  }
  return false;
};

export function isSelect<
  SelectStmtName extends string,
  Context extends tmpl.SqlEmitContext,
>(
  o: unknown,
): o is Select<SelectStmtName, Context> {
  const isSS = safety.typeGuard<
    Select<SelectStmtName, Context>
  >("selectStmt", "SQL");
  return isSS(o);
}

export type SelectTemplateOptions<
  SelectStmtName extends string,
  Context extends tmpl.SqlEmitContext,
> = tmpl.SqlTextSupplierOptions<Context> & {
  readonly symbolsFirst?: boolean;
  readonly selectStmtName?: SelectStmtName;
  readonly firstTokenGuard?: (
    firstToken: string,
  ) => true | tmpl.SqlLintIssueSupplier;
  readonly onFirstTokenGuardFail?: (issue: tmpl.SqlLintIssueSupplier) =>
    & Select<SelectStmtName, Context>
    & tmpl.SqlTextLintIssuesPopulator<Context>;
};

export function selectTemplateResult<
  SelectStmtName extends string,
  Context extends tmpl.SqlEmitContext,
>(
  literals: TemplateStringsArray,
  ess: tmpl.EmbeddedSqlSupplier,
  ssOptions?: SelectTemplateOptions<SelectStmtName, Context>,
  ...expressions: tmpl.SqlPartialExpression<Context>[]
) {
  let invalid: tmpl.TemplateStringSqlLintIssue | undefined;
  const candidateSQL = literals[0];
  if (ssOptions?.firstTokenGuard) {
    const firstToken = firstWord(candidateSQL);
    if (firstToken) {
      const guard = ssOptions.firstTokenGuard(firstToken);
      if (typeof guard !== "boolean") {
        invalid = tmpl.templateStringLintIssue(
          "SQL statement does not start with SELECT",
          literals,
          expressions,
        );
        if (ssOptions?.onFirstTokenGuardFail) {
          return ssOptions.onFirstTokenGuardFail(guard);
        }
      }
    }
  }

  // symbolsFirst = true means that any embedded expressions should check for
  // tmpl.SqlSymbolSupplier (e.g. domain, tables, views, etc.) to generate
  // proper names from Typescript tokens
  const selectStmt = ess.embeddedSQL<Context>(
    tmpl.typicalSqlTextSupplierOptions({
      symbolsFirst: ssOptions?.symbolsFirst,
    }),
  )(
    literals,
    ...expressions,
  );
  const { selectStmtName } = ssOptions ?? {};

  const result:
    & Select<SelectStmtName, Context>
    & tmpl.SqlTextLintIssuesPopulator<Context> = {
      isValid: invalid === undefined,
      selectStmtName: selectStmtName,
      selectStmt,
      SQL: invalid
        ? ((ctx) =>
          ctx.sqlTextEmitOptions.singeLineSrcComment(
            invalid!.lintIssue,
          ))
        : selectStmt.SQL,
      populateSqlTextLintIssues: (lis) => {
        if (invalid) lis.registerLintIssue(invalid);
        if (selectStmt.lintIssues) {
          lis.registerLintIssue(...selectStmt.lintIssues);
        }
      },
    };
  return result;
}

export function untypedSelect<
  SelectStmtName extends string,
  Context extends tmpl.SqlEmitContext,
>(
  ess: tmpl.EmbeddedSqlSupplier,
  ssOptions?: SelectTemplateOptions<SelectStmtName, Context>,
) {
  return (
    literals: TemplateStringsArray,
    ...expressions: tmpl.SqlPartialExpression<Context>[]
  ) => {
    return selectTemplateResult(literals, ess, ssOptions, ...expressions);
  };
}

export function typedSelect<
  SelectStmtName extends string,
  ColumnsShape extends z.ZodRawShape,
  Context extends tmpl.SqlEmitContext,
  DomainQS extends d.SqlDomainQS,
  DomainsQS extends d.SqlDomainsQS<DomainsQS>,
>(
  props: ColumnsShape,
  ess: tmpl.EmbeddedSqlSupplier,
  ssOptions?: SelectTemplateOptions<SelectStmtName, Context>,
) {
  const sdf = d.sqlDomainsFactory<
    SelectStmtName,
    Context,
    DomainQS,
    DomainsQS
  >();
  return (
    literals: TemplateStringsArray,
    ...expressions: tmpl.SqlPartialExpression<Context>[]
  ) => {
    return {
      ...sdf.sqlDomains(props),
      ...selectTemplateResult(literals, ess, ssOptions, ...expressions),
    };
  };
}

export type SelectCriteriaReturn = { isReturning: true };

export const isSelectCriteriaReturn = safety.typeGuard<SelectCriteriaReturn>(
  "isReturning",
);

export function selectCriteriaHelpers<
  FilterableRecord,
  Context extends tmpl.SqlEmitContext,
>() {
  return {
    ...cr.filterCriteriaHelpers<Any, FilterableRecord, Context>(),
    return: (
      value: cr.FilterCriteriaValue<Any, Context> | unknown,
    ): cr.FilterCriteriaValue<Any, Context> & SelectCriteriaReturn => {
      if (cr.isFilterCriteriaValue(value)) {
        return { ...value, isReturning: true };
      }
      return { ...cr.fcValue(value), isReturning: true };
    },
  };
}

export type SelectStmtReturning<
  ReturnableRecord,
  Context extends tmpl.SqlEmitContext,
  ReturnableAttrName extends keyof ReturnableRecord = keyof ReturnableRecord,
> =
  | "*"
  | "primary-keys"
  | (ReturnableAttrName | tmpl.SqlTextSupplier<Context>)[];

export interface SelectStmtPreparerOptions<
  EntityName extends string,
  FilterableRecord,
  ReturnableRecord,
  Context extends tmpl.SqlEmitContext,
  SelectStmtName extends string = string,
  FilterableAttrName extends keyof FilterableRecord = keyof FilterableRecord,
  ReturnableAttrName extends keyof ReturnableRecord = keyof ReturnableRecord,
> {
  readonly identity?: SelectStmtName;
  readonly sqlFmt?: "single-line" | "multi-line";
  readonly returning?:
    | SelectStmtReturning<ReturnableRecord, Context>
    | ((
      ctx: Context,
    ) => SelectStmtReturning<ReturnableRecord, Context>);
  readonly entityNameSupplier?: (
    name: EntityName,
    ns: tmpl.SqlObjectNames,
  ) => string;
  readonly attrNameSupplier?: (
    name: EntityName,
    attrName: FilterableAttrName | ReturnableAttrName,
    ns: tmpl.SqlObjectNames,
  ) => string;
}

export interface SelectStmtPreparer<
  EntityName extends string,
  FilterableRecord,
  ReturnableRecord,
  Context extends tmpl.SqlEmitContext,
  SelectStmtName extends string = string,
> {
  (
    fr: FilterableRecord,
    options?: SelectStmtPreparerOptions<
      EntityName,
      FilterableRecord,
      ReturnableRecord,
      Context,
      SelectStmtName
    >,
  ): tmpl.SqlTextSupplier<Context> & {
    readonly filterable: FilterableRecord;
  };
}

export function entitySelectStmtPreparer<
  EntityName extends string,
  FilterableRecord,
  ReturnableRecord,
  Context extends tmpl.SqlEmitContext,
  SelectStmtName extends string = string,
  FilterableAttrName extends keyof FilterableRecord = keyof FilterableRecord,
  ReturnableAttrName extends keyof ReturnableRecord = keyof ReturnableRecord,
>(
  entityName: EntityName,
  fcp: cr.FilterCriteriaPreparer<FilterableRecord, Context>,
  defaultSspOptions?: SelectStmtPreparerOptions<
    EntityName,
    FilterableRecord,
    ReturnableRecord,
    Context,
    SelectStmtName
  >,
): SelectStmtPreparer<
  EntityName,
  FilterableRecord,
  ReturnableRecord,
  Context,
  SelectStmtName
> {
  return (fr, sspOptions = defaultSspOptions) => {
    const selectStmt: tmpl.SqlTextSupplier<Context> = {
      SQL: (ctx) => {
        const {
          sqlFmt = "single-line",
          returning: returningArg,
          entityNameSupplier = (name: EntityName, ns: tmpl.SqlObjectNames) =>
            ns.tableName(name),
          attrNameSupplier = (
            en: EntityName,
            an: FilterableAttrName | ReturnableAttrName,
            ns: tmpl.SqlObjectNames,
          ) => ns.tableColumnName({ tableName: en, columnName: String(an) }),
        } = sspOptions ?? {};
        const fc = fcp(ctx, fr);
        const fcSTS = cr.filterCriteriaSQL(fc, {
          attrNameSupplier: (attrName, ns) =>
            attrNameSupplier(entityName, attrName as Any, ns), // TODO: how to properly type attrName and not use 'Any'?
        });
        const ns = ctx.sqlNamingStrategy(ctx, {
          quoteIdentifiers: true,
        });
        const returnableIFCCs = fc.criteria.filter((cc) =>
          isSelectCriteriaReturn(cc)
        );
        const returning = returningArg
          ? (typeof returningArg === "function"
            ? returningArg(ctx)
            : returningArg)
          : (returnableIFCCs.length > 0
            ? returnableIFCCs.map((cc) => cc.identity)
            : "primary-keys");
        let returningSQL = "";
        if (typeof returning === "string") {
          switch (returning) {
            case "*":
              returningSQL = `*`;
              break;
            case "primary-keys":
              returningSQL = fc.candidateAttrs("primary-keys")
                // TODO: how to properly type attrName and not use 'Any'?
                .map((n) => attrNameSupplier(entityName, n as Any, ns)).join(
                  ", ",
                );
              break;
          }
        } else {
          const returningExprs: string[] = [];
          for (const r of returning) {
            if (tmpl.isSqlTextSupplier<Context>(r)) {
              returningExprs.push(r.SQL(ctx));
            } else {
              returningExprs.push(
                attrNameSupplier(
                  entityName,
                  r as (FilterableAttrName | ReturnableAttrName),
                  ns,
                ),
              );
            }
          }
          returningSQL = returningExprs.join(", ");
        }
        // deno-fmt-ignore
        return sqlFmt == "single-line"
          ? `SELECT ${returningSQL} FROM ${entityNameSupplier(entityName, ns)} WHERE ${fcSTS.SQL(ctx)}`
          : ws.unindentWhitespace(`
              SELECT ${returningSQL}
                FROM ${entityNameSupplier(entityName, ns)}
               WHERE ${fcSTS.SQL(ctx)}`);
      },
    };
    return {
      selectStmtName: sspOptions?.identity,
      isValid: true,
      filterable: fr,
      selectStmt,
      SQL: selectStmt.SQL,
    };
  };
}
