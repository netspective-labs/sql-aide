import { zod as z } from "../../deps.ts";
import * as tmpl from "../../emit/mod.ts";
import * as safety from "../../lib/universal/safety.ts";
import * as za from "../../lib/universal/zod-aide.ts";
import * as d from "../../domain/mod.ts";
import * as con from "./constraint.ts";

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

  const unique = <ColumnName extends string, ColumnTsType extends z.ZodTypeAny>(
    zodType: ColumnTsType,
  ) => {
    const sqlDomain = sdf.cacheableFrom<ColumnName, ColumnTsType>(zodType);
    const uniqueSD:
      & d.SqlDomain<ColumnTsType, Context, ColumnName>
      & con.UniqueTableColumn = {
        ...sqlDomain,
        isUnique: true,
        sqlPartial: (dest) => {
          if (dest === "create table, column defn decorators") {
            const ctcdd = sqlDomain?.sqlPartial?.(
              "create table, column defn decorators",
            );
            const decorators: tmpl.SqlTextSupplier<Context> = {
              SQL: () => `/* UNIQUE COLUMN */`,
            };
            return ctcdd ? [decorators, ...ctcdd] : [decorators];
          }
          return sqlDomain.sqlPartial?.(dest);
        },
      };

    // trick Typescript into thinking the Zod instance is also a SqlDomainSupplier;
    // this allows assignment of a reference to a Zod object or use as a
    // regular Zod schema; the sqlDomain is carried in zodType._def
    // we do special typing of sqlDomain because isPrimaryKey, isExcludedFromInsertDML,
    // etc. are needed by tableDefinition()
    return zb.zodTypeBaggageProxy<typeof zodType>(
      zodType,
      uniqueSD,
    ) as unknown as typeof zodType & { sqlDomain: typeof uniqueSD };
  };

  return {
    ...sdf,
    ...zb,
    isTableColumnDefn,
    unique,
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
