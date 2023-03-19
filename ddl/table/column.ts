import { zod as z } from "../../deps.ts";
import * as tmpl from "../../emit/mod.ts";
import * as safety from "../../lib/universal/safety.ts";
import * as za from "../../lib/universal/zod-aide.ts";
import * as d from "../../domain/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any; // make it easy on linter

export type TableColumnDefn<
  TableName extends string,
  ColumnName extends string,
  ColumnTsType extends z.ZodTypeAny,
  Context extends tmpl.SqlEmitContext,
> = d.SqlDomain<ColumnTsType, Context, ColumnName> & {
  readonly tableName: TableName;
  readonly columnName: ColumnName;
};

export function tableColumnFactory<
  TableName extends string,
  Context extends tmpl.SqlEmitContext,
>() {
  const sdf = d.zodTypeSqlDomainFactory<Any, Context>();
  const zb = za.zodBaggage<
    d.SqlDomain<Any, Context, Any>,
    d.SqlDomainSupplier<Any, Any, Context>
  >("sqlDomain");

  const isTableColumnDefn = <
    ColumnName extends string,
    ColumnTsType extends z.ZodTypeAny,
    Context extends tmpl.SqlEmitContext,
  >(
    o: unknown,
    args?: { checkTableName: TableName; checkColumnName: ColumnName },
  ): o is TableColumnDefn<TableName, ColumnName, ColumnTsType, Context> => {
    const isTCD = safety.typeGuard<
      TableColumnDefn<TableName, ColumnName, ColumnTsType, Context>
    >("tableName", "columnName");
    if (isTCD(o) && sdf.anySDF.isSqlDomain(o)) {
      if (args?.checkTableName && o.tableName != args?.checkTableName) {
        return false;
      }
      if (args?.checkColumnName && o.columnName != args?.checkColumnName) {
        return false;
      }
      return true;
    }
    return false;
  };

  return {
    ...sdf,
    ...zb,
    isTableColumnDefn,
  };
}

export type TableColumnInsertDmlExclusionSupplier<
  ColumnTsType extends z.ZodTypeAny,
  Context extends tmpl.SqlEmitContext,
> = d.SqlDomain<ColumnTsType, Context, Any> & {
  readonly isExcludedFromInsertDML: true;
};

export function isTableColumnInsertDmlExclusionSupplier<
  ColumnTsType extends z.ZodTypeAny,
  Context extends tmpl.SqlEmitContext,
>(
  o: unknown,
): o is TableColumnInsertDmlExclusionSupplier<ColumnTsType, Context> {
  const isIDES = safety.typeGuard<
    TableColumnInsertDmlExclusionSupplier<ColumnTsType, Context>
  >("isExcludedFromInsertDML");
  return isIDES(o);
}

export type TableColumnInsertableOptionalSupplier<
  ColumnTsType extends z.ZodTypeAny,
  Context extends tmpl.SqlEmitContext,
> = d.SqlDomain<ColumnTsType, Context, Any> & {
  readonly isOptionalInInsertableRecord: true;
};

export function isTableColumnInsertableOptionalSupplier<
  ColumnTsType extends z.ZodTypeAny,
  Context extends tmpl.SqlEmitContext,
>(
  o: unknown,
): o is TableColumnInsertableOptionalSupplier<ColumnTsType, Context> {
  const isIDES = safety.typeGuard<
    TableColumnInsertableOptionalSupplier<ColumnTsType, Context>
  >("isOptionalInInsertableRecord");
  return isIDES(o);
}

export type TableColumnFilterCriteriaDqlExclusionSupplier<
  ColumnTsType extends z.ZodTypeAny,
  Context extends tmpl.SqlEmitContext,
> = d.SqlDomain<ColumnTsType, Context, Any> & {
  readonly isExcludedFromFilterCriteriaDql: true;
};

export function isTableColumnFilterCriteriaDqlExclusionSupplier<
  ColumnTsType extends z.ZodTypeAny,
  Context extends tmpl.SqlEmitContext,
>(
  o: unknown,
): o is TableColumnFilterCriteriaDqlExclusionSupplier<ColumnTsType, Context> {
  const isFCDES = safety.typeGuard<
    TableColumnFilterCriteriaDqlExclusionSupplier<ColumnTsType, Context>
  >("isExcludedFromFilterCriteriaDql");
  return isFCDES(o);
}

export function typicalTableColumnDefnSQL<
  TableName extends string,
  ColumnName extends string,
  Context extends tmpl.SqlEmitContext,
>(
  tableName: TableName,
  isd: d.SqlDomain<Any, Context, ColumnName>,
): tmpl.RenderedSqlText<Context> {
  return (ctx) => {
    const { sqlTextEmitOptions: steOptions } = ctx;
    const ns = ctx.sqlNamingStrategy(ctx, { quoteIdentifiers: true });
    const columnName = ns.tableColumnName({
      tableName,
      columnName: isd.identity,
    });
    let sqlDataType = isd.sqlDataType("create table column").SQL(ctx);
    if (sqlDataType) sqlDataType = " " + sqlDataType;
    const decorations = isd.sqlPartial?.(
      "create table, column defn decorators",
    );
    const decoratorsSQL = decorations
      ? ` ${decorations.map((d) => d.SQL(ctx)).join(" ")}`
      : "";
    const notNull = decoratorsSQL.length == 0
      ? isd.isNullable() ? "" : " NOT NULL"
      : "";
    const defaultValue = isd.sqlDefaultValue
      ? ` DEFAULT ${isd.sqlDefaultValue("create table column").SQL(ctx)}`
      : "";
    // deno-fmt-ignore
    return `${steOptions.indentation("define table column")}${columnName}${sqlDataType}${decoratorsSQL}${notNull}${defaultValue}`;
  };
}
