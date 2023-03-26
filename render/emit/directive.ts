import * as safety from "../../lib/universal/safety.ts";
import * as s from "./sql.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export interface SqlDirective<
  Directive extends string,
  Context extends s.SqlEmitContext,
> {
  readonly sqlDirective: Directive;
}

export function isSqlDirective<
  Directive extends string,
  Context extends s.SqlEmitContext,
>(o: unknown): o is SqlDirective<Directive, Context> {
  const isSD = safety.typeGuard<SqlDirective<Directive, Context>>(
    "sqlDirective",
  );
  return isSD(o);
}

export interface SqlDirectives<
  Directive extends string,
  Context extends s.SqlEmitContext,
> {
  readonly directives: Iterable<SqlDirective<Directive, Context>>;
  readonly sqlTextSupplier:
    | s.SqlTextSupplier<Context>
    | s.MutatedSqlTextSupplier<Context>;
}

export function isSqlDirectives<
  EngineInstanceID extends string,
  Context extends s.SqlEmitContext,
>(o: unknown): o is SqlDirectives<EngineInstanceID, Context> {
  const isSDs = safety.typeGuard<SqlDirectives<EngineInstanceID, Context>>(
    "directives",
    "sqlTextSupplier",
  );
  return isSDs(o);
}

export type SqlDirectivesInspector<
  Directive extends SqlDirectives<Any, Context>,
  Context extends s.SqlEmitContext,
> = (ctx: Context, sts: s.SqlTextSupplier<Context>) => Directive | undefined;

export interface SqlEngineInstanceDirective<
  EngineInstanceID extends string,
  Context extends s.SqlEmitContext,
> extends SqlDirectives<"SqlEngineInstance", Context> {
  readonly engineInstanceID: EngineInstanceID;
}

export function isSqlEngineInstanceDirective<
  EngineInstanceID extends string,
  Context extends s.SqlEmitContext,
>(o: unknown): o is SqlEngineInstanceDirective<EngineInstanceID, Context> {
  const isSEID = safety.typeGuard<
    SqlEngineInstanceDirective<EngineInstanceID, Context>
  >("engineInstanceID");
  return isSqlDirectives<"SqlEngineInstance", Context>(o) && isSEID(o);
}

/**
 * sqlEngineDirectiveInspector creates a function which looks for this pattern:
 *
 *     USE DATABASE something;\n
 *
 * If the first line of the SQL starts with any whitespace and then USE DATABASE
 * (case insensitive) then "something" would be extracted as the databaseID.
 *
 * @param options whether or not to remove the "USE" statement (rewrite the SQL)
 * @returns SqlDirectivesInspector which can be used to detect and remove
 *          "USE DATABASE" statements from SQL
 */
export function sqlEngineDirectiveInspector<
  EngineInstanceID extends string,
  Context extends s.SqlEmitContext,
>(
  { removeUseDbIdStmt }: { removeUseDbIdStmt: boolean } = {
    removeUseDbIdStmt: true,
  },
) {
  const detectedUseDbIdInSQL = (
    ctx: Context,
    sts: s.SqlTextSupplier<Context>,
  ) => {
    const useDatabaseRegEx = /^\s*USE\s*DATABASE\s*(\w+).*$/gmi;
    const useDatabaseMatch = useDatabaseRegEx.exec(sts.SQL(ctx));
    return useDatabaseMatch
      ? useDatabaseMatch[1] as EngineInstanceID
      : undefined;
  };
  const rewriteSqlRemoveUseDbId = (
    ctx: Context,
    sts: s.SqlTextSupplier<Context>,
  ) => {
    const SQL = sts.SQL(ctx).replace(/^\s*USE\s*DATABASE.*$/mi, "").trim();
    return removeUseDbIdStmt
      ? { SQL: () => SQL, isMutatedSqlTextSupplier: true, originalSTS: sts }
      : sts;
  };

  const result: SqlDirectivesInspector<
    SqlEngineInstanceDirective<Any, Context>,
    Context
  > = (ctx, sts) => {
    const engineInstanceID = detectedUseDbIdInSQL(ctx, sts);
    if (engineInstanceID) {
      return {
        engineInstanceID,
        directives: [{ sqlDirective: "SqlEngineInstance" }],
        sqlTextSupplier: rewriteSqlRemoveUseDbId(ctx, sts),
      };
    }
    return undefined;
  };
  return result;
}
