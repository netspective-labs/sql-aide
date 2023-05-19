import { events, fs } from "../deps.ts";
import * as safety from "../../lib/universal/safety.ts";
import * as ws from "../../lib/universal/whitespace.ts";
import * as dialect from "./dialect.ts";
import * as l from "./lint.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export interface SqlSymbolSupplier<Context extends SqlEmitContext> {
  readonly sqlSymbol: (ctx: Context) => string;
}

export function isSqlSymbolSupplier<Context extends SqlEmitContext>(
  o: unknown,
): o is SqlSymbolSupplier<Context> {
  const isSSS = safety.typeGuard<SqlSymbolSupplier<Context>>("sqlSymbol");
  return isSSS(o);
}

export function isOnlySqlSymbolSupplier<Context extends SqlEmitContext>(
  o: unknown,
): o is SqlSymbolSupplier<Context> {
  return isSqlSymbolSupplier(o) && !isSqlTextSupplier(o);
}

export type SafeTemplateStringReturnType<
  T extends (...args: Any) => Any,
> = T extends (...args: Any) => infer R ? R
  : Any;

export type SafeTemplateString<Expressions, ReturnType> = (
  literals: TemplateStringsArray,
  ...expressions: Expressions[]
) => ReturnType;

/** in case the name should be "qualified" for a schema/namespace */
export type NameQualifier = (unqualifiedName: string) => string;

export interface SqlObjectNames {
  readonly schemaName: (schemaName: string) => string;
  readonly tableName: (tableName: string) => string;
  readonly domainName: (domainName: string) => string;
  readonly tableColumnName: (
    tc: { tableName: string; columnName: string },
    qualifyTableName?: false | ".",
  ) => string;
  readonly viewName: (viewName: string) => string;
  readonly viewColumnName: (
    vc: { viewName: string; columnName: string },
    qualifyViewName?: false | ".",
  ) => string;
  readonly typeName: (typeName: string) => string;
  readonly typeFieldName: (
    vc: { typeName: string; fieldName: string },
    qualifyTypeName?: false | ".",
  ) => string;
  readonly storedRoutineName: (name: string) => string;
  readonly storedRoutineArgName: (name: string) => string;
  readonly storedRoutineReturns: (name: string) => string;
}

export function qualifyName(qualifier: string, delim = "."): NameQualifier {
  return (name) => `${qualifier}${delim}${name}`;
}

export function qualifiedNamingStrategy(
  ns: SqlObjectNames,
  q: NameQualifier,
): SqlObjectNames {
  return {
    schemaName: (name) => q(ns.schemaName(name)),
    tableName: (name) => q(ns.tableName(name)),
    domainName: (name) => q(ns.domainName(name)),
    tableColumnName: (tc, qtn) => q(ns.tableColumnName(tc, qtn)),
    viewName: (name) => q(ns.viewName(name)),
    viewColumnName: (vc, qtn) => q(ns.viewColumnName(vc, qtn)),
    typeName: (name) => q(ns.typeName(name)),
    typeFieldName: (tf, qtn) => q(ns.typeFieldName(tf, qtn)),
    storedRoutineName: (name) => q(ns.storedRoutineName(name)),
    storedRoutineArgName: (name) => q(ns.storedRoutineArgName(name)),
    storedRoutineReturns: (name) => q(ns.storedRoutineReturns(name)),
  };
}

export interface QualifiedNamingStrategySupplier {
  readonly qualifiedNames: (
    ctx: SqlEmitContext,
    baseNS?: SqlObjectNames,
  ) => SqlObjectNames;
}

export const isQualifiedNamingStrategySupplier = safety.typeGuard<
  QualifiedNamingStrategySupplier
>("qualifiedNames");

export interface SqlObjectNamingStrategyOptions {
  readonly quoteIdentifiers?: boolean;
  readonly qnss?: QualifiedNamingStrategySupplier;
}

export interface SqlObjectNamesSupplier {
  (
    ctx: SqlEmitContext,
    nsOptions?: SqlObjectNamingStrategyOptions,
  ): SqlObjectNames;
}

export interface SqlNamingStrategySupplier {
  readonly sqlNamingStrategy: SqlObjectNamesSupplier;
}

export interface SqlTextEmitOptions {
  readonly quotedLiteral: (value: unknown) => [value: unknown, quoted: string];
  readonly comments: (text: string, indent?: string) => string;
  readonly indentation: (
    nature:
      | "create table"
      | "define table column"
      | "create view"
      | "create type"
      | "define type field"
      | "create view select statement"
      | "create routine"
      | "create routine body",
    content?: string,
  ) => string;
}

export interface EmbeddedSqlSupplier {
  readonly embeddedSQL: <
    Context extends SqlEmitContext,
    Expressions extends SqlPartialExpression<Context> = SqlPartialExpression<
      Context
    >,
  >(stsOptions: SqlTextSupplierOptions<Context>) => (
    literals: TemplateStringsArray,
    ...expressions: Expressions[]
  ) => SqlTextSupplier<Context> & Partial<l.SqlLintIssuesSupplier>;
}

export interface SqlEmitContext
  extends EmbeddedSqlSupplier, SqlNamingStrategySupplier {
  readonly sqlTextEmitOptions: SqlTextEmitOptions;
  readonly sqlDialect: dialect.SqlDialect;
}

export function typicalSqlEmitContext(
  inherit?: Partial<SqlEmitContext>,
): SqlEmitContext {
  const result: SqlEmitContext = {
    embeddedSQL: SQL,
    sqlNamingStrategy: typicalSqlNamingStrategy(),
    sqlTextEmitOptions: typicalSqlTextEmitOptions(),
    sqlDialect: dialect.ansiSqlDialect(),
    ...inherit,
  };
  return result;
}

export function typicalQuotedSqlLiteral(
  value: unknown,
): [value: unknown, quoted: string] {
  if (typeof value === "undefined") return [value, "NULL"];
  if (typeof value === "string") {
    return [value, `'${value.replaceAll("'", "''")}'`];
  }
  if (value instanceof Date) {
    // TODO: add date formatting options
    return [value, `'${String(value)}'`];
  }
  return [value, String(value)];
}

export function typicalSqlNamingStrategy(): SqlObjectNamesSupplier {
  const quotedIdentifiersNS: SqlObjectNames = {
    schemaName: (name) => `"${name}"`,
    tableName: (name) => `"${name}"`,
    domainName: (name) => `"${name}"`,
    tableColumnName: (tc, qtn) =>
      qtn
        // deno-fmt-ignore
        ? `${quotedIdentifiersNS.tableName(tc.tableName)}${qtn}"${tc.columnName}"`
        : `"${tc.columnName}"`,
    viewName: (name) => `"${name}"`,
    viewColumnName: (vc, qvn) =>
      qvn
        ? `${quotedIdentifiersNS.viewName(vc.viewName)}${qvn}"${vc.columnName}"`
        : `"${vc.columnName}"`,
    typeName: (name) => `"${name}"`,
    typeFieldName: (tf, qtn) =>
      qtn
        ? `${quotedIdentifiersNS.typeName(tf.typeName)}${qtn}"${tf.fieldName}"`
        : `"${tf.fieldName}"`,
    storedRoutineName: (name) => `"${name}"`,
    storedRoutineArgName: (name) => `"${name}"`,
    storedRoutineReturns: (name) => `"${name}"`,
  };

  const bareIdentifiersNS: SqlObjectNames = {
    schemaName: (name) => name,
    tableName: (name) => name,
    domainName: (name) => name,
    tableColumnName: (tc, qtn) =>
      qtn
        ? `${bareIdentifiersNS.tableName(tc.tableName)}${qtn}${tc.columnName}`
        : tc.columnName,
    viewName: (name) => name,
    viewColumnName: (vc, qvn) =>
      qvn
        ? `${bareIdentifiersNS.viewName(vc.viewName)}${qvn}${vc.columnName}`
        : vc.columnName,
    typeName: (name) => name,
    typeFieldName: (tf, qtn) =>
      qtn
        ? `${bareIdentifiersNS.typeName(tf.fieldName)}${qtn}${tf.fieldName}`
        : tf.fieldName,
    storedRoutineName: (name) => name,
    storedRoutineArgName: (name) => name,
    storedRoutineReturns: (name) => name,
  };

  const result: SqlObjectNamesSupplier = (
    ctx,
    nsOptions,
  ) => {
    const ns = nsOptions?.quoteIdentifiers
      ? quotedIdentifiersNS
      : bareIdentifiersNS;
    return nsOptions?.qnss ? nsOptions.qnss.qualifiedNames(ctx, ns) : ns;
  };

  return result;
}

export function bracketSqlNamingStrategy(): SqlObjectNamesSupplier {
  const quotedIdentifiersNS: SqlObjectNames = {
    schemaName: (name) => `[${name}]`,
    tableName: (name) => `[${name}]`,
    domainName: (name) => `[${name}]`,
    tableColumnName: (tc, qtn) =>
      qtn
        // deno-fmt-ignore
        ? `${quotedIdentifiersNS.tableName(tc.tableName)}${qtn}[${tc.columnName}]`
        : `[${tc.columnName}]`,
    viewName: (name) => `[${name}]`,
    viewColumnName: (vc, qvn) =>
      qvn
        ? `${quotedIdentifiersNS.viewName(vc.viewName)}${qvn}[${vc.columnName}]`
        : `[${vc.columnName}]`,
    typeName: (name) => `[${name}]`,
    typeFieldName: (tf, qtn) =>
      qtn
        ? `${quotedIdentifiersNS.typeName(tf.typeName)}${qtn}[${tf.fieldName}]`
        : `[${tf.fieldName}]`,
    storedRoutineName: (name) => `[${name}]`,
    storedRoutineArgName: (name) => `[${name}]`,
    storedRoutineReturns: (name) => `[${name}]`,
  };

  const bareIdentifiersNS: SqlObjectNames = {
    schemaName: (name) => name,
    tableName: (name) => name,
    domainName: (name) => name,
    tableColumnName: (tc, qtn) =>
      qtn
        ? `${bareIdentifiersNS.tableName(tc.tableName)}${qtn}${tc.columnName}`
        : tc.columnName,
    viewName: (name) => name,
    viewColumnName: (vc, qvn) =>
      qvn
        ? `${bareIdentifiersNS.viewName(vc.viewName)}${qvn}${vc.columnName}`
        : vc.columnName,
    typeName: (name) => name,
    typeFieldName: (tf, qtn) =>
      qtn
        ? `${bareIdentifiersNS.typeName(tf.fieldName)}${qtn}${tf.fieldName}`
        : tf.fieldName,
    storedRoutineName: (name) => name,
    storedRoutineArgName: (name) => name,
    storedRoutineReturns: (name) => name,
  };

  const result: SqlObjectNamesSupplier = (
    ctx,
    nsOptions,
  ) => {
    const ns = nsOptions?.quoteIdentifiers
      ? quotedIdentifiersNS
      : bareIdentifiersNS;
    return nsOptions?.qnss ? nsOptions.qnss.qualifiedNames(ctx, ns) : ns;
  };

  return result;
}

export function typicalSqlTextEmitOptions(): SqlTextEmitOptions {
  return {
    quotedLiteral: typicalQuotedSqlLiteral,
    comments: (text, indent = "") => text.replaceAll(/^/gm, `${indent}-- `),
    indentation: (nature, content) => {
      let indent = "";
      switch (nature) {
        case "create table":
          indent = "";
          break;

        case "define table column":
          indent = "    ";
          break;

        case "create view":
          indent = "";
          break;

        case "create view select statement":
          indent = "    ";
          break;

        case "create type":
          indent = "";
          break;

        case "define type field":
          indent = "    ";
          break;

        case "create routine":
          indent = "";
          break;

        case "create routine body":
          indent = "  ";
          break;
      }
      if (content) {
        return indent.length > 0 ? content.replaceAll(/^/gm, indent) : content;
      }
      return indent;
    },
  };
}

export interface SqlTextPersistOptions {
  readonly ensureDirSync?: (destFileName: string) => void;
}

export function typicalSqlTextPersistOptions(): SqlTextPersistOptions {
  return {
    ensureDirSync: fs.ensureDirSync,
  };
}

export interface RenderedSqlText<Context extends SqlEmitContext> {
  (ctx: Context): string;
}

export interface SqlTextSupplier<
  Context extends SqlEmitContext,
> {
  readonly SQL: RenderedSqlText<Context>;
}

export function isSqlTextSupplier<
  Context extends SqlEmitContext,
>(
  o: unknown,
): o is SqlTextSupplier<Context> {
  const isSTS = safety.typeGuard<SqlTextSupplier<Context>>("SQL");
  return isSTS(o);
}

export interface MutatedSqlTextSupplier<
  Context extends SqlEmitContext,
> extends SqlTextSupplier<Context> {
  readonly isMutatedSqlTextSupplier: true;
  readonly originalSTS: SqlTextSupplier<Context>;
}

export function isMutatedSqlTextSupplier<
  Context extends SqlEmitContext,
>(
  o: unknown,
): o is MutatedSqlTextSupplier<Context> {
  const isMSTS = safety.typeGuard<MutatedSqlTextSupplier<Context>>(
    "SQL",
    "isMutatedSqlTextSupplier",
    "originalSTS",
  );
  return isMSTS(o);
}

export interface SqlTextLintIssuesPopulator<
  Context extends SqlEmitContext,
> {
  readonly populateSqlTextLintIssues: (
    lis: l.SqlLintIssuesSupplier,
    ctx: Context,
  ) => void;
}

export function isSqlTextLintIssuesSupplier<
  Context extends SqlEmitContext,
>(
  o: unknown,
): o is SqlTextLintIssuesPopulator<Context> {
  const isSTLIS = safety.typeGuard<SqlTextLintIssuesPopulator<Context>>(
    "populateSqlTextLintIssues",
  );
  return isSTLIS(o);
}

export interface PersistableSqlText<
  Context extends SqlEmitContext,
> {
  readonly sqlTextSupplier: SqlTextSupplier<Context>;
  readonly persistDest: (
    ctx: Context,
    index: number,
    options?: SqlTextPersistOptions,
  ) => string;
}

export function isPersistableSqlText<
  Context extends SqlEmitContext,
>(
  o: unknown,
): o is PersistableSqlText<Context> {
  const isPSTS = safety.typeGuard<PersistableSqlText<Context>>(
    "sqlTextSupplier",
    "persistDest",
  );
  return isPSTS(o);
}

export interface SqlTextBehaviorEmitTransformer {
  before: (interpolationSoFar: string, exprIdx: number) => string;
  after: (nextLiteral: string, exprIdx: number) => string;
}

export const removeLineFromEmitStream: SqlTextBehaviorEmitTransformer = {
  before: (isf) => {
    // remove the last line in the interpolation stream
    return isf.replace(/\n.*?$/, "");
  },
  after: (literal) => {
    // remove everything up to and including the line break
    return literal.replace(/.*?\n/, "\n");
  },
};

export interface SqlTextBehaviorSupplier<
  Context extends SqlEmitContext,
> {
  readonly executeSqlBehavior: (
    context: Context,
  ) => SqlTextBehaviorEmitTransformer | SqlTextSupplier<Context>;
}

export function isSqlTextBehaviorSupplier<
  Context extends SqlEmitContext,
>(
  o: unknown,
): o is SqlTextBehaviorSupplier<Context> {
  const isSTBS = safety.typeGuard<
    SqlTextBehaviorSupplier<Context>
  >("executeSqlBehavior");
  return isSTBS(o);
}

export interface PersistableSqlTextIndexSupplier {
  readonly persistableSqlTextIndex: number;
}

export const isPersistableSqlTextIndexSupplier = safety.typeGuard<
  PersistableSqlTextIndexSupplier
>("persistableSqlTextIndex");

export class SqlPartialExprEventEmitter<
  Context extends SqlEmitContext,
> extends events.EventEmitter<{
  symbolEncountered(
    ctx: Context,
    sss: SqlSymbolSupplier<Context>,
  ): void;
  sqlEncountered(
    ctx: Context,
    sts: SqlTextSupplier<Context>,
  ): void;
  persistableSqlEncountered(
    ctx: Context,
    sts: SqlTextSupplier<Context>,
  ): void;
  sqlBehaviorEncountered(
    ctx: Context,
    sts: SqlTextBehaviorSupplier<Context>,
  ): void;
  symbolEmitted(
    ctx: Context,
    sss: SqlSymbolSupplier<Context>,
  ): void;
  sqlEmitted(
    ctx: Context,
    sts: SqlTextSupplier<Context>,
    sql: string,
  ): void;
  sqlPersisted(
    ctx: Context,
    destPath: string,
    pst: PersistableSqlText<Context>,
    persistResultEmitSTS: SqlTextSupplier<Context>,
  ): void;
  behaviorActivity(
    ctx: Context,
    sts: SqlTextBehaviorSupplier<Context>,
    behaviorResult?: SqlTextBehaviorEmitTransformer | SqlTextSupplier<Context>,
  ): void;
}> {}

export interface SqlTextLintState<Context extends SqlEmitContext> {
  readonly isFatalIssue: (lis: l.SqlLintIssueSupplier) => boolean;
  readonly lintedSqlText: l.SqlLintIssuesSupplier;
  readonly sqlTextLintSummary: (options?: {
    noIssuesText?: string;
  }) => SqlTextBehaviorSupplier<Context>;
  readonly lintedSqlTmplEngine: l.SqlLintIssuesSupplier;
  readonly sqlTmplEngineLintSummary: (options?: {
    noIssuesText?: string;
  }) => SqlTextBehaviorSupplier<Context>;
}

export function typicalSqlTextLintManager<Context extends SqlEmitContext>(
  inherit?: Partial<SqlTextLintState<Context>>,
): SqlTextLintState<Context> {
  const lintedSqlText: l.SqlLintIssuesSupplier = {
    lintIssues: [],
    registerLintIssue: (...slis: l.SqlLintIssueSupplier[]) => {
      lintedSqlText.lintIssues.push(...slis);
    },
  };
  const lintedSqlTmplEngine: l.SqlLintIssuesSupplier = {
    lintIssues: [],
    registerLintIssue: (...slis: l.SqlLintIssueSupplier[]) => {
      lintedSqlTmplEngine.lintIssues.push(...slis);
    },
  };
  const lintMessage = (li: l.SqlLintIssueSupplier) => {
    return `${li.consequence ? `[${li.consequence}] ` : ""}${li.lintIssue}${
      li.location
        ? ` (${
          typeof li.location === "string"
            ? li.location.slice(0, 50)
            : li.location({ maxLength: 50 })
        })`
        : ""
    }`;
  };
  return {
    isFatalIssue: (lis: l.SqlLintIssueSupplier) =>
      lis.consequence && lis.consequence.toString().startsWith("FATAL")
        ? true
        : false,
    lintedSqlText,
    sqlTextLintSummary: (options) => {
      const {
        noIssuesText = "no SQL lint issues (typicalSqlTextLintManager)",
      } = options ?? {};
      return {
        executeSqlBehavior: () => {
          const result: SqlTextSupplier<Context> = {
            SQL: (ctx) => {
              const steOptions = ctx.sqlTextEmitOptions;
              return lintedSqlText.lintIssues.length > 0
                // compute all lint issue texts, pass them through a Set to get unique only
                ? Array.from(
                  new Set(
                    lintedSqlText.lintIssues.map((li) =>
                      steOptions.comments(lintMessage(li))
                    ),
                  ),
                ).join("\n")
                : steOptions.comments(noIssuesText);
            },
          };
          return result;
        },
      };
    },
    lintedSqlTmplEngine,
    sqlTmplEngineLintSummary: (options) => {
      const {
        noIssuesText =
          "no template engine lint issues (typicalSqlTextLintManager)",
      } = options ?? {};
      return {
        executeSqlBehavior: () => {
          const result: SqlTextSupplier<Context> = {
            SQL: (ctx) => {
              const steOptions = ctx.sqlTextEmitOptions;
              return lintedSqlTmplEngine.lintIssues.length > 0
                // compute all lint issue texts, pass them through a Set to get unique only
                ? Array.from(
                  new Set(
                    lintedSqlTmplEngine.lintIssues.map((li) =>
                      steOptions.comments(lintMessage(li))
                    ),
                  ),
                ).join("\n")
                : steOptions.comments(noIssuesText);
            },
          };
          return result;
        },
      };
    },
    ...inherit,
  };
}

export function typicalSqlLintSummaries<Context extends SqlEmitContext>(
  slm: SqlTextLintState<Context> | undefined,
) {
  function sqlTextLintSummary(_: Context): SqlTextBehaviorSupplier<Context> {
    return slm?.sqlTextLintSummary?.() ?? {
      executeSqlBehavior: () => {
        return {
          SQL: () =>
            `-- no SQL text lint summary supplier (typicalSqlLintSummaries)`,
        };
      },
    };
  }

  function sqlTmplEngineLintSummary(
    _: Context,
  ): SqlTextBehaviorSupplier<Context> {
    return slm?.sqlTmplEngineLintSummary?.() ?? {
      executeSqlBehavior: () => {
        return {
          SQL: () =>
            `-- no SQL template engine lint summary supplier (typicalSqlLintSummaries)`,
        };
      },
    };
  }

  return {
    sqlTextLintSummary,
    sqlTmplEngineLintSummary,
  };
}

export interface SqlTextSupplierOptions<Context extends SqlEmitContext> {
  readonly sqlSuppliersDelimText?: string;
  readonly symbolsFirst?: boolean;
  readonly quoteNakedScalars?: (
    value: unknown,
  ) => [value: unknown, quoted: string];
  readonly exprInArrayDelim?: (entry: unknown, isLast: boolean) => string;
  readonly literalSupplier?: (
    literals: TemplateStringsArray,
    suppliedExprs: unknown[],
  ) => ws.TemplateLiteralIndexedTextSupplier;
  readonly persistIndexer?: { activeIndex: number };
  readonly persist?: (
    ctx: Context,
    psts: PersistableSqlText<Context>,
    indexer: { activeIndex: number },
    speEE?: SqlPartialExprEventEmitter<Context>,
  ) => SqlTextSupplier<Context> | undefined;
  readonly sqlTextLintState?: SqlTextLintState<Context>;
  readonly prepareEvents?: (
    speEE: SqlPartialExprEventEmitter<Context>,
  ) => SqlPartialExprEventEmitter<Context>;
}

export function typicalSqlTextSupplierOptions<Context extends SqlEmitContext>(
  inherit?: Partial<SqlTextSupplierOptions<Context>>,
): SqlTextSupplierOptions<Context> {
  return {
    sqlSuppliersDelimText: ";",
    exprInArrayDelim: (_, isLast) => isLast ? "" : "\n",
    // we want to auto-unindent our string literals and remove initial newline
    literalSupplier: (literals, expressions) =>
      ws.whitespaceSensitiveTemplateLiteralSupplier(literals, expressions),
    persist: (ctx, psts, indexer, steEE) => {
      const destPath = psts.persistDest(ctx, indexer.activeIndex);
      const emit = {
        SQL: () => `-- encountered persistence request for ${destPath}`,
      };
      steEE?.emitSync("sqlPersisted", ctx, destPath, psts, emit);
      return emit;
    },
    sqlTextLintState: typicalSqlTextLintManager(),
    ...inherit,
  };
}

// deno-fmt-ignore
export type SqlPartialExpression<Context extends SqlEmitContext> =
  | ((ctx: Context, options: SqlTextSupplierOptions<Context>) => SqlTextSupplier<Context> | SqlTextSupplier<Context>[])
  | ((ctx: Context, options: SqlTextSupplierOptions<Context>) => PersistableSqlText<Context> | PersistableSqlText<Context>[])
  | ((ctx: Context, options: SqlTextSupplierOptions<Context>) => SqlTextBehaviorSupplier<Context>)
  | ((ctx: Context, options: SqlTextSupplierOptions<Context>) => string)
  | SqlSymbolSupplier<Context>
  | SqlTextSupplier<Context>
  | PersistableSqlText<Context>
  | SqlTextBehaviorSupplier<Context>
  | (
    | SqlTextSupplier<Context>
    | PersistableSqlText<Context>
    | SqlTextBehaviorSupplier<Context>
    | string
    | number
  )[]
  | string
  | number;

export function SQL<
  Context extends SqlEmitContext,
  Expressions extends SqlPartialExpression<Context> = SqlPartialExpression<
    Context
  >,
>(stsOptions: SqlTextSupplierOptions<Context>): (
  literals: TemplateStringsArray,
  ...expressions: Expressions[]
) => SqlTextSupplier<Context> & SqlTextLintIssuesPopulator<Context> & {
  stsOptions: SqlTextSupplierOptions<Context>;
} {
  return (literals, ...suppliedExprs) => {
    const {
      symbolsFirst,
      sqlSuppliersDelimText,
      quoteNakedScalars,
      exprInArrayDelim = (_entry: unknown, isLast: boolean) =>
        isLast ? "" : "\n",
      persistIndexer = { activeIndex: 0 },
      prepareEvents,
      sqlTextLintState,
    } = stsOptions ?? {};
    const speEE = prepareEvents
      ? prepareEvents(new SqlPartialExprEventEmitter<Context>())
      : undefined;
    // by default no pre-processing of text literals are done; if auto-unindent is desired pass in
    //   options.literalSupplier = (literals, suppliedExprs) => ws.whitespaceSensitiveTemplateLiteralSupplier(literals, suppliedExprs)
    const literalSupplier = stsOptions?.literalSupplier
      ? stsOptions?.literalSupplier(literals, suppliedExprs)
      : (index: number) => literals[index];
    const interpolate: (ctx: Context) => string = (ctx) => {
      const expressions = suppliedExprs.map((e) =>
        typeof e === "function" ? e(ctx, stsOptions) : e
      );

      // we preprocess first so that some features (like linting) can be "run"
      // early and tracked so that SQL that shows later in a template stream
      // can be used earlier in the stream
      const preprocessSingleExpr = (expr: unknown) => {
        if (sqlTextLintState && isSqlTextLintIssuesSupplier<Context>(expr)) {
          expr.populateSqlTextLintIssues(sqlTextLintState.lintedSqlText, ctx);
        }
        if (
          isOnlySqlSymbolSupplier(expr) ||
          (symbolsFirst && isSqlSymbolSupplier(expr))
        ) {
          // if we are being asked to emit symbols first then we want to check
          // early and exit otherwise we'll drop into SqlTextSupplier branches
          speEE?.emitSync("symbolEncountered", ctx, expr);
          return;
        }
        if (isPersistableSqlText<Context>(expr)) {
          speEE?.emitSync(
            "persistableSqlEncountered",
            ctx,
            expr.sqlTextSupplier,
          );
        } else if (isSqlTextSupplier<Context>(expr)) {
          speEE?.emitSync("sqlEncountered", ctx, expr);
        } else if (isSqlTextBehaviorSupplier<Context>(expr)) {
          speEE?.emitSync("sqlBehaviorEncountered", ctx, expr);
        }
      };

      for (const expr of expressions) {
        if (Array.isArray(expr)) {
          for (const e of expr) preprocessSingleExpr(e);
        } else {
          preprocessSingleExpr(expr);
        }
      }

      let interpolated = "";
      let recentSTBET: SqlTextBehaviorEmitTransformer | undefined;
      const interpolateSingleExpr = (
        expr: unknown,
        exprIndex: number,
        inArray?: boolean,
        isLastArrayEntry?: boolean,
      ) => {
        if (
          isOnlySqlSymbolSupplier(expr) ||
          (symbolsFirst && isSqlSymbolSupplier(expr))
        ) {
          interpolated += expr.sqlSymbol(ctx);
          speEE?.emitSync("symbolEmitted", ctx, expr);
          return;
        }

        // if SQL is wrapped in a persistence handler it means that the content
        // should be written to a file and, optionally, the same or alternate
        // content should be emitted as part of this template string
        if (isPersistableSqlText<Context>(expr)) {
          persistIndexer.activeIndex++;
          if (stsOptions?.persist) {
            const persistenceSqlText = stsOptions.persist(
              ctx,
              expr,
              persistIndexer,
              speEE,
            );
            if (persistenceSqlText) {
              // after persistence, if we want to store a remark or other SQL
              interpolated += persistenceSqlText.SQL(ctx);
            }
          } else if (sqlTextLintState) {
            sqlTextLintState.lintedSqlTmplEngine.registerLintIssue({
              lintIssue:
                `persistable SQL encountered but no persistence handler available: '${
                  Deno.inspect(expr)
                }'`,
            });
          }
        } else if (isSqlTextSupplier<Context>(expr)) {
          const SQL = expr.SQL(ctx);
          interpolated += SQL;
          if (
            sqlSuppliersDelimText &&
            !interpolated.endsWith(sqlSuppliersDelimText)
          ) {
            interpolated += sqlSuppliersDelimText;
          }
          speEE?.emitSync("sqlEmitted", ctx, expr, SQL);
        } else if (
          typeof expr === "string" || typeof expr === "number" ||
          typeof expr === "bigint"
        ) {
          interpolated += quoteNakedScalars ? quoteNakedScalars(expr)[1] : expr;
        } else if (isSqlTextBehaviorSupplier<Context>(expr)) {
          const behaviorResult = expr.executeSqlBehavior(ctx);
          if (isSqlTextSupplier<Context>(behaviorResult)) {
            interpolated += behaviorResult.SQL(ctx);
          } else {
            recentSTBET = behaviorResult;
            interpolated = recentSTBET.before(interpolated, exprIndex);
          }
          speEE?.emitSync("behaviorActivity", ctx, expr, behaviorResult);
        } else {
          interpolated += Deno.inspect(expr);
        }
        if (inArray) {
          const delim = exprInArrayDelim(expr, isLastArrayEntry ?? false);
          if (delim && delim.length > 0) interpolated += delim;
        }
      };

      let activeLiteral: string;
      for (let i = 0; i < expressions.length; i++) {
        // we have two main types of text that we emit: SqlTextSupplier ("STS")
        // and SqlTextBehaviorEmitTransformer ("STBET"); behaviors are arbitary
        // and can (optionally) change the emit stream or they can supply SQL
        // like like an STS. If we have a non-null recentSTBET it means that a
        // behavior emit transformer wants to change the stream otherwise we
        // just have a "normal" expression where the text is emitted without
        // changing what's already been prepared.
        activeLiteral = literalSupplier(i);
        if (recentSTBET) {
          activeLiteral = recentSTBET.after(activeLiteral, i);
          recentSTBET = undefined;
        }
        interpolated += activeLiteral;
        const expr = expressions[i];
        if (Array.isArray(expr)) {
          const lastIndex = expr.length - 1;
          for (let eIndex = 0; eIndex < expr.length; eIndex++) {
            interpolateSingleExpr(
              expr[eIndex],
              eIndex,
              true,
              eIndex == lastIndex,
            );
          }
        } else {
          interpolateSingleExpr(expr, i);
        }
      }
      activeLiteral = literalSupplier(literals.length - 1);
      if (recentSTBET) {
        interpolated = recentSTBET.after(interpolated, literals.length - 1);
      }
      interpolated += activeLiteral;
      return interpolated;
    };

    return {
      SQL: (ctx) => {
        return interpolate(ctx);
      },
      populateSqlTextLintIssues: (lis, ctx) => {
        suppliedExprs.map((e) => {
          const expr = typeof e === "function" ? e(ctx, stsOptions) : e;
          if (isSqlTextLintIssuesSupplier(expr)) {
            expr.populateSqlTextLintIssues(lis, ctx);
          }
        });
      },
      stsOptions,
    };
  };
}
