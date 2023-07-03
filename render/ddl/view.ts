import { zod as z } from "../deps.ts";
import * as safety from "../../lib/universal/safety.ts";
import * as emit from "../emit/mod.ts";
import * as ss from "../dql/select.ts";
import * as d from "../domain/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export type ViewColumnDefn<
  ViewName extends string,
  ColumnName extends string,
  ColumnTsType extends z.ZodTypeAny,
  Context extends emit.SqlEmitContext,
  DomainQS extends d.SqlDomainQS,
> = d.SqlDomain<ColumnTsType, Context, ColumnName, DomainQS> & {
  readonly viewName: ViewName;
  readonly columnName: ColumnName;
};

export interface ViewDefinition<
  ViewName extends string,
  Context extends emit.SqlEmitContext,
> extends emit.SqlTextSupplier<Context> {
  readonly isValid: boolean;
  readonly viewName: ViewName;
  readonly isTemp?: boolean;
  readonly isIdempotent?: boolean;
}

export function isViewDefinition<
  ViewName extends string,
  Context extends emit.SqlEmitContext,
>(
  o: unknown,
): o is ViewDefinition<ViewName, Context> {
  const isViewDefn = safety.typeGuard<
    ViewDefinition<ViewName, Context>
  >(
    "viewName",
    "SQL",
  );
  return isViewDefn(o);
}

export interface ViewDefnOptions<
  ViewName extends string,
  ColumnName extends string,
  ColumnsShape extends z.ZodRawShape,
  Context extends emit.SqlEmitContext,
> extends emit.SqlTextSupplierOptions<Context> {
  readonly zodObject?: (zodRawShape: ColumnsShape) => z.ZodObject<ColumnsShape>;
  readonly isTemp?: boolean;
  readonly isIdempotent?: boolean;
  readonly before?: (
    viewName: ViewName,
    vdOptions: ViewDefnOptions<ViewName, ColumnName, ColumnsShape, Context>,
  ) => emit.SqlTextSupplier<Context>;
  readonly sqlNS?: emit.SqlNamespaceSupplier;
  readonly embeddedStsOptions: emit.SqlTextSupplierOptions<Context>;
}

export function viewDefinition<
  ViewName extends string,
  Context extends emit.SqlEmitContext,
>(
  viewName: ViewName,
  vdOptions?:
    & ViewDefnOptions<ViewName, Any, Any, Context>
    & Partial<emit.EmbeddedSqlSupplier>,
) {
  return (
    literals: TemplateStringsArray,
    ...expressions: emit.SqlPartialExpression<Context>[]
  ) => {
    const { isTemp, isIdempotent = true, embeddedSQL = emit.SQL } = vdOptions ??
      {};
    const ssPartial = ss.untypedSelect<Any, Context>({ embeddedSQL });
    const selectStmt = ssPartial(literals, ...expressions);
    const viewDefn:
      & ViewDefinition<ViewName, Context>
      & emit.SqlSymbolSupplier<Context>
      & emit.SqlTextLintIssuesPopulator<Context> = {
        isValid: selectStmt.isValid,
        viewName,
        isTemp,
        isIdempotent,
        populateSqlTextLintIssues: (lintIssues, steOptions) =>
          selectStmt.populateSqlTextLintIssues(lintIssues, steOptions),
        sqlSymbol: (ctx) =>
          ctx.sqlNamingStrategy(ctx, {
            quoteIdentifiers: true,
            qnss: vdOptions?.sqlNS,
          }).viewName(viewName),
        SQL: (ctx) => {
          const { sqlTextEmitOptions: steOptions } = ctx;
          const rawSelectStmtSqlText = selectStmt.SQL(ctx);
          const viewSelectStmtSqlText = steOptions.indentation(
            "create view select statement",
            rawSelectStmtSqlText,
          );
          // use this naming strategy when schema/namespace might be necessary
          const ns = ctx.sqlNamingStrategy(ctx, {
            quoteIdentifiers: true,
            qnss: vdOptions?.sqlNS,
          });
          // by default we create for ANSI/SQLite/"other"
          // deno-fmt-ignore
          let create = `CREATE ${isTemp ? "TEMP " : ""}VIEW ${ isIdempotent ? "IF NOT EXISTS " : ""}${ns.viewName(viewName)} AS\n${viewSelectStmtSqlText}`;
          if (
            emit.isPostgreSqlDialect(ctx.sqlDialect)
          ) {
            // deno-fmt-ignore
            create = `CREATE ${ isIdempotent ? "OR REPLACE " : ""}${isTemp ? "TEMP " : ""}VIEW ${ns.viewName(viewName)} AS\n${viewSelectStmtSqlText}`;
          } else if (
            emit.isMsSqlServerDialect(ctx.sqlDialect)
          ) {
            // deno-fmt-ignore
            create = `CREATE ${ isIdempotent ? "OR ALTER " : ""}${isTemp ? "TEMP " : ""}VIEW ${ns.viewName(viewName)} AS\n${viewSelectStmtSqlText}`;
          }
          return vdOptions?.before
            ? ctx.embeddedSQL<Context>(vdOptions.embeddedStsOptions)`${[
              vdOptions.before(viewName, vdOptions),
              create,
            ]}`.SQL(ctx)
            : create;
        },
      };
    return {
      ...viewDefn,
      selectStmt,
      drop: (options?: { ifExists?: boolean }) => dropView(viewName, options),
    };
  };
}

export function safeViewDefinitionCustom<
  ViewName extends string,
  ColumnsShape extends z.ZodRawShape,
  Context extends emit.SqlEmitContext,
  DomainQS extends d.SqlDomainQS,
  DomainsQS extends d.SqlDomainsQS<DomainsQS>,
  ColumnName extends keyof ColumnsShape & string = keyof ColumnsShape & string,
>(
  viewName: ViewName,
  zodRawShape: ColumnsShape,
  selectStmt:
    & ss.Select<Any, Context>
    & Partial<emit.SqlTextLintIssuesPopulator<Context>>,
  vdOptions?:
    & ViewDefnOptions<ViewName, ColumnName, ColumnsShape, Context>
    & Partial<emit.EmbeddedSqlSupplier>,
) {
  const sdf = d.sqlDomainsFactory<ViewName, Context, DomainQS, DomainsQS>();
  const sd = sdf.sqlDomains(zodRawShape);

  type ColumnDefns = {
    [Property in keyof ColumnsShape]: ColumnsShape[Property] extends
      z.ZodType<infer T, infer D, infer I> ? ViewColumnDefn<
        ViewName,
        Extract<Property, string>,
        z.ZodType<T, D, I>,
        Context,
        DomainQS
      >
      : never;
  };

  const { zoSchema, zbSchema } = sd;
  const columns: ColumnDefns = {} as Any;
  const columnsList: ViewColumnDefn<
    ViewName,
    Any,
    z.ZodTypeAny,
    Context,
    DomainQS
  >[] = [];
  const { keys: viewShapeKeys } = zoSchema._getCached();

  for (const key of viewShapeKeys) {
    const { sqlDomain } = zbSchema[key];
    const columnDefn = sqlDomain as unknown as ViewColumnDefn<
      ViewName,
      Any,
      z.ZodTypeAny,
      Context,
      DomainQS
    >;
    (columnDefn as unknown as { viewName: ViewName }).viewName = viewName;
    (columnDefn as unknown as { columnName: ColumnName }).columnName =
      sqlDomain.identity;
    (columns[columnDefn.identity] as Any) = columnDefn;
    columnsList.push(columnDefn);
  }

  const { isTemp, isIdempotent = true } = vdOptions ?? {};
  const viewDefn:
    & ViewDefinition<ViewName, Context>
    & emit.SqlSymbolSupplier<Context>
    & emit.SqlTextLintIssuesPopulator<Context> = {
      isValid: selectStmt.isValid,
      viewName,
      isTemp,
      isIdempotent,
      populateSqlTextLintIssues: (lis, steOptions) =>
        selectStmt.populateSqlTextLintIssues?.(lis, steOptions),
      sqlSymbol: (ctx) =>
        ctx.sqlNamingStrategy(ctx, {
          quoteIdentifiers: true,
          qnss: vdOptions?.sqlNS,
        }).viewName(viewName),
      SQL: (ctx) => {
        const { sqlTextEmitOptions: steOptions } = ctx;
        const rawSelectStmtSqlText = selectStmt.SQL(ctx);
        const viewSelectStmtSqlText = steOptions.indentation(
          "create view select statement",
          rawSelectStmtSqlText,
        );
        const ns = ctx.sqlNamingStrategy(ctx, {
          quoteIdentifiers: true,
          qnss: vdOptions?.sqlNS,
        });
        // by default we create for ANSI/SQLite/"other"
        // deno-fmt-ignore
        let head = `CREATE ${isTemp ? "TEMP " : ""}VIEW ${ isIdempotent ? "IF NOT EXISTS " : ""}${ns.viewName(viewName)}`;
        if (
          emit.isPostgreSqlDialect(ctx.sqlDialect)
        ) {
          // deno-fmt-ignore
          head = `CREATE ${ isIdempotent ? "OR REPLACE " : ""}${isTemp ? "TEMP " : ""}VIEW ${ns.viewName(viewName)}`;
        } else if (
          emit.isMsSqlServerDialect(ctx.sqlDialect)
        ) {
          // deno-fmt-ignore
          head = `CREATE ${ isIdempotent ? "OR ALTER " : ""}${isTemp ? "TEMP " : ""}VIEW ${ns.viewName(viewName)}`;
        }
        const create = `${head}${
          columnsList
            ? `(${
              columnsList.map((cn) =>
                ns.viewColumnName({
                  viewName,
                  columnName: cn.columnName,
                })
              ).join(", ")
            })`
            : ""
        } AS\n${viewSelectStmtSqlText}`;
        return vdOptions?.before
          ? ctx.embeddedSQL<Context>(vdOptions.embeddedStsOptions)`${[
            vdOptions.before(viewName, vdOptions),
            create,
          ]}`.SQL(ctx)
          : create;
      },
    };
  return {
    columns,
    columnsList,
    zoSchema,
    zbSchema,
    ...viewDefn,
    selectStmt,
    drop: (options?: { ifExists?: boolean }) => dropView(viewName, options),
  };
}

export function safeViewDefinition<
  ViewName extends string,
  ColumnsShape extends z.ZodRawShape,
  Context extends emit.SqlEmitContext,
  DomainQS extends d.SqlDomainQS,
  DomainsQS extends d.SqlDomainsQS<DomainsQS>,
  ColumnName extends keyof ColumnsShape & string = keyof ColumnsShape & string,
>(
  viewName: ViewName,
  columnsShape: ColumnsShape,
  vdOptions?:
    & ViewDefnOptions<ViewName, ColumnName, ColumnsShape, Context>
    & Partial<emit.EmbeddedSqlSupplier>,
) {
  return (
    literals: TemplateStringsArray,
    ...expressions: emit.SqlPartialExpression<Context>[]
  ) => {
    // use "symbolsFirst" so that sqlDomains can be passed in for naming
    const {
      embeddedSQL = (stsOptions: emit.SqlTextSupplierOptions<Any>) =>
        emit.SQL({ ...stsOptions, symbolsFirst: true }),
    } = vdOptions ?? {};
    const selectStmt = ss.typedSelect<
      Any,
      ColumnsShape,
      Context,
      DomainQS,
      DomainsQS
    >(
      columnsShape,
      {
        embeddedSQL,
      },
    );
    return safeViewDefinitionCustom(
      viewName,
      columnsShape,
      selectStmt(literals, ...expressions),
      vdOptions,
    );
  };
}

export function dropView<
  ViewName extends string,
  Context extends emit.SqlEmitContext,
>(
  viewName: ViewName,
  dvOptions?: {
    readonly ifExists?: boolean;
    readonly sqlNS?: emit.SqlNamespaceSupplier;
  },
): emit.SqlTextSupplier<Context> {
  const { ifExists = true } = dvOptions ?? {};
  return {
    SQL: (ctx) => {
      const ns = ctx.sqlNamingStrategy(ctx, {
        quoteIdentifiers: true,
        qnss: dvOptions?.sqlNS,
      });
      return `DROP VIEW ${ifExists ? "IF EXISTS " : ""}${
        ns.viewName(viewName)
      }`;
    },
  };
}
