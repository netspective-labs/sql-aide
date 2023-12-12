import { zod as z } from "../../deps.ts";
import * as tmpl from "../../emit/mod.ts";
import * as safety from "../../../lib/universal/safety.ts";
import * as qs from "../../../lib/quality-system/mod.ts";
import * as d from "../../domain/mod.ts";
import * as c from "./column.ts";
import * as con from "./constraint.ts";
import * as idx from "./index.ts";
import * as pk from "./primary-key.ts";
import * as fk from "./foreign-key.ts";
import * as g from "../../graph.ts";

// deno-lint-ignore no-explicit-any
type Any = any; // make it easy on linter

export type TableColumnDefns<
  TableName extends string,
  ColumnsShape extends z.ZodRawShape,
  Context extends tmpl.SqlEmitContext,
  DomainQS extends d.SqlDomainQS,
> = {
  [Property in keyof ColumnsShape]: ColumnsShape[Property] extends
    z.ZodType<infer T, infer D, infer I> ? c.TableColumnDefn<
      TableName,
      Extract<Property, string>,
      z.ZodType<T, D, I>,
      Context,
      DomainQS
    >
    : never;
};

export type TableDefinition<
  TableName extends string,
  Context extends tmpl.SqlEmitContext,
  DomainQS extends d.SqlDomainQS,
> = tmpl.SqlTextSupplier<Context> & {
  readonly tableName: TableName;
  readonly domains: c.TableColumnDefn<TableName, Any, Any, Context, DomainQS>[];
};

export function isTableDefinition<
  TableName extends string,
  Context extends tmpl.SqlEmitContext,
  DomainQS extends d.SqlDomainQS,
>(
  o: unknown,
  checkName?: TableName,
): o is TableDefinition<TableName, Context, DomainQS> {
  const isTD = safety.typeGuard<
    TableDefinition<TableName, Context, DomainQS>
  >("tableName", "SQL");
  return checkName ? isTD(o) && o.tableName == checkName : isTD(o);
}

export interface TableDefnOptions<
  ColumnsShape extends z.ZodRawShape,
  Context extends tmpl.SqlEmitContext,
  DomainQS extends d.SqlDomainQS,
  DomainsQS extends d.SqlDomainsQS<DomainQS>,
> extends Partial<qs.QualitySystemSupplier<DomainsQS>> {
  readonly zodObject?: (zodRawShape: ColumnsShape) => z.ZodObject<ColumnsShape>;
  readonly isIdempotent?: boolean;
  readonly isTemp?: boolean;
  readonly sqlPartial?: (
    destination: "after all column definitions" | "after table definition",
  ) => tmpl.SqlTextSupplier<Context>[] | undefined;
  readonly sqlNS?: tmpl.SqlNamespaceSupplier;
  readonly constraints?: <
    TableName extends string,
  >(
    columnsShape: ColumnsShape,
    tableName: TableName,
  ) => con.TableColumnsConstraint<ColumnsShape, Context>[];
  readonly indexes?: <
    TableName extends string,
  >(
    columnsShape: ColumnsShape,
    tableName: TableName,
  ) => idx.TableColumnsIndex<ColumnsShape, Context>[];
  readonly prepareTableQS?: <TableName extends string>(
    defaultDescr: string | undefined,
    columns: TableColumnDefns<TableName, ColumnsShape, Context, DomainQS>,
    tableName: TableName,
  ) => DomainsQS;
  readonly initPopulatableColumnQS?: <TableName extends string>(
    columnName: keyof ColumnsShape,
    tableName: TableName,
  ) => safety.DeepWriteable<DomainQS>;
  readonly populateQS?: <
    TableName extends string,
  >(
    tableQS: safety.DeepWriteable<DomainsQS>,
    columnsQS: { [key in keyof ColumnsShape]: safety.DeepWriteable<DomainQS> },
    columns: TableColumnDefns<TableName, ColumnsShape, Context, DomainQS>,
    tableName: TableName,
  ) => void;
  readonly descr?: string; // convenience form of qualitySystem: { description }
  readonly privilegesSQL?: tmpl.SqlTextSupplier<Context>;
}

export function tableComment<
  TableName extends string,
  Context extends tmpl.SqlEmitContext,
>(
  target: TableName,
  comment: string,
  sqlNS?: tmpl.SqlNamespaceSupplier,
): tmpl.SqlObjectComment<"table", TableName, Context> {
  return {
    type: "table",
    target,
    comment,
    SQL: (ctx) => {
      return ctx.sqlTextEmitOptions.objectComment(
        "table",
        ctx.sqlNamingStrategy(ctx, { quoteIdentifiers: true, qnss: sqlNS })
          .tableName(target),
        comment,
      );
    },
  };
}

export function tableDefinition<
  TableName extends string,
  ColumnsShape extends z.ZodRawShape,
  Context extends tmpl.SqlEmitContext,
  DomainQS extends d.SqlDomainQS,
  DomainsQS extends d.SqlDomainsQS<DomainQS>,
>(
  tableName: TableName,
  zodRawShape: ColumnsShape,
  tdOptions?: TableDefnOptions<ColumnsShape, Context, DomainQS, DomainsQS>,
) {
  const sdf = d.sqlDomainsFactory<TableName, Context, DomainQS, DomainsQS>();
  const zoSchema = tdOptions?.zodObject?.(zodRawShape) ??
    z.object(zodRawShape).strict();
  const fkf = fk.foreignKeysFactory<
    TableName,
    ColumnsShape,
    Context,
    DomainQS,
    DomainsQS
  >(
    tableName,
    zodRawShape,
    sdf,
  );

  const { keys: tableShapeKeys } = zoSchema._getCached();

  type ColumnDefns = TableColumnDefns<
    TableName,
    ColumnsShape,
    Context,
    DomainQS
  >;

  type PrimaryKeys = {
    [
      Property in keyof ColumnsShape as Extract<
        Property,
        ColumnsShape[Property] extends { sqlDomain: { isPrimaryKey: true } }
          ? Property
          : never
      >
    ]: ColumnsShape[Property] extends z.ZodType<infer T, infer D, infer I> ?
        & c.TableColumnDefn<
          TableName,
          Extract<Property, string>,
          z.ZodType<T, D, I>,
          Context,
          DomainQS
        >
        & pk.TablePrimaryKeyColumnDefn<z.ZodType<T, D, I>, Context, DomainQS>
      : never;
  };

  type UniqueColumnDefns = {
    [
      Property in keyof ColumnsShape as Extract<
        Property,
        ColumnsShape[Property] extends { sqlDomain: con.UniqueTableColumn }
          ? Property
          : never
      >
    ]: ColumnsShape[Property] extends z.ZodType<infer T, infer D, infer I> ?
        & c.TableColumnDefn<
          TableName,
          Extract<Property, string>,
          z.ZodType<T, D, I>,
          Context,
          DomainQS
        >
        & con.UniqueTableColumn
      : never;
  };

  type SqlSymbolSuppliersSchema = {
    [Property in keyof ColumnsShape]: tmpl.SqlSymbolSupplier<Context>;
  };
  type SqlSymbolsSchema = {
    [Property in keyof ColumnsShape]: (ctx: Context) => string;
  };

  const domains = tableShapeKeys.map((key) =>
    fkf.zbSchema[key].sqlDomain as c.TableColumnDefn<
      TableName,
      Any,
      Any,
      Context,
      DomainQS
    >
  );

  function columnComment<ColumnName extends string>(
    columnName: ColumnName,
    comment: string,
  ): tmpl.SqlObjectComment<
    "column",
    `${TableName}.${ColumnName}`,
    Context
  > {
    return {
      type: "column",
      target: `${tableName}.${columnName}`,
      comment,
      SQL: (ctx) => {
        return ctx.sqlTextEmitOptions.objectComment(
          "column",
          ctx.sqlNamingStrategy(ctx, {
            quoteIdentifiers: true,
            qnss: tdOptions?.sqlNS,
          }).tableColumnName({ tableName, columnName }, "."),
          comment,
        );
      },
    };
  }

  const columnDefnsSS: tmpl.SqlTextSupplier<Context>[] = [];
  const afterColumnDefnsSS: tmpl.SqlTextSupplier<Context>[] = [];
  const constraints: con.TableColumnsConstraint<ColumnsShape, Context>[] = [];
  const indexes: idx.TableColumnsIndex<ColumnsShape, Context>[] = [];
  const symbolSuppliers: SqlSymbolSuppliersSchema = {} as Any;
  const symbols: SqlSymbolsSchema = {} as Any;

  const primaryKey: PrimaryKeys = {} as Any;
  const unique: UniqueColumnDefns = {} as Any;
  for (const column of domains) {
    if (pk.isTablePrimaryKeyColumnDefn(column)) {
      primaryKey[column.identity as (keyof PrimaryKeys)] = column as Any;
    }
    if (con.isUniqueTableColumn(column)) {
      unique[column.identity as (keyof UniqueColumnDefns)] = column as Any;
      constraints.push(con.uniqueConstraint(column.identity));
    }
    (symbolSuppliers[column.identity] as Any) = { sqlSymbol: column.sqlSymbol };
    (symbols[column.identity] as Any) = column.sqlSymbol;
  }

  // see if any FK references were registered but need to be created
  const columns: ColumnDefns = {} as Any;
  for (const columnDefn of domains) {
    (columnDefn as unknown as { tableName: TableName }).tableName = tableName;
    (columnDefn as unknown as { columnName: string }).columnName =
      columnDefn.identity;
    const typicalSQL = c.typicalTableColumnDefnSQL(tableName, columnDefn);
    if (columnDefn.sqlPartial) {
      const acdPartial = columnDefn.sqlPartial(
        "create table, after all column definitions",
      );
      if (acdPartial) afterColumnDefnsSS.push(...acdPartial);

      const ctcPartial = columnDefn.sqlPartial(
        "create table, full column defn",
      );
      if (ctcPartial) {
        columnDefnsSS.push(...ctcPartial);
      } else {
        columnDefnsSS.push({ SQL: typicalSQL });
      }
    } else {
      columnDefnsSS.push({ SQL: typicalSQL });
    }
    (columns[columnDefn.identity] as Any) = columnDefn;
  }

  afterColumnDefnsSS.push(...constraints);
  if (tdOptions?.constraints) {
    const custom = tdOptions.constraints(zodRawShape, tableName);
    constraints.push(...custom);
    afterColumnDefnsSS.push(...custom);
  }

  if (tdOptions?.indexes) {
    const custom = tdOptions.indexes(zodRawShape, tableName);
    indexes.push(...custom);
  }

  const graphEntityDefn = () => {
    const result: g.GraphEntityDefinition<
      TableName,
      Context,
      string,
      DomainQS,
      DomainsQS
    > = {
      identity: () => tableName,
      attributes: domains,
      outboundReferences: (options) => fkf.outboundReferences(options),
    };
    return result;
  };

  let tblQualitySystem = tdOptions?.qualitySystem ??
    (tdOptions?.descr
      ? { description: tdOptions.descr } as DomainsQS
      : undefined);

  if (tdOptions?.populateQS) {
    if (tblQualitySystem === undefined) {
      tblQualitySystem = tdOptions?.prepareTableQS?.(
        tdOptions?.descr,
        columns,
        tableName,
      ) ?? { description: tdOptions.descr } as DomainsQS;
    }

    // this section allows convenient preparation of governance and documentation
    // ("Quality System") by calling a function that will unnest .qualitySystem
    // into a function and allow type-safe access to each column's Quality System.

    type DomainQsProxy = {
      [Key in keyof ColumnsShape]: safety.DeepWriteable<DomainQS>;
    };

    tdOptions.populateQS(
      tblQualitySystem!,
      // this proxy mutates column.qualitySystem appropriately
      new Proxy<DomainQsProxy>({} as DomainQsProxy, {
        get(_target, property) {
          const columnName = property as keyof ColumnDefns;
          if (columns[columnName].qualitySystem == undefined) {
            const initColumnQS =
              tdOptions.initPopulatableColumnQS?.(columnName, tableName) ??
                { description: "" } as safety.DeepWriteable<
                  DomainQS
                >;
            (columns[columnName] as safety.Writeable<
              qs.QualitySystemSupplier<DomainQS>
            >).qualitySystem = initColumnQS as DomainQS;
          }
          return columns[columnName].qualitySystem as safety.DeepWriteable<
            DomainQS
          >;
        },
      }),
      columns,
      tableName,
    );
  }

  let columnsQS:
    | (
      & c.TableColumnDefn<TableName, Any, Any, Context, DomainQS>
      & qs.QualitySystemSupplier<Any>
    )[]
    | undefined = [];

  for (const column of domains) {
    if (qs.isQualitySystemSupplier(column)) {
      columnsQS.push(column);
    }
  }
  if (columnsQS.length == 0) columnsQS = undefined;

  const sqlObjectsComments = tblQualitySystem || columnsQS
    ? (() => {
      const soc = [];
      if (tblQualitySystem) {
        soc.push(
          tableComment<TableName, Context>(
            tableName,
            tblQualitySystem.description,
          ),
        );
      }
      if (columnsQS) {
        soc.push(
          ...(columnsQS.map((cqs) =>
            columnComment(cqs.columnName, cqs.qualitySystem.description)
          )),
        );
      }
      return soc;
    })
    : undefined;

  const tableDefnResult:
    & TableDefinition<TableName, Context, DomainQS>
    & g.GraphEntityDefinitionSupplier<TableName, Context, DomainQS, DomainsQS>
    & {
      readonly domains: typeof domains;
      readonly columns: ColumnDefns;
      readonly symbolSuppliers: SqlSymbolSuppliersSchema;
      readonly symbols: SqlSymbolsSchema;
      readonly primaryKey: PrimaryKeys;
      readonly unique: UniqueColumnDefns;
      readonly references: typeof fkf.references;
      readonly belongsTo: typeof fkf.belongsTo;
      readonly foreignKeys: typeof fkf.foreignKeys;
      readonly constraints: typeof constraints;
      readonly indexes: typeof indexes;
      readonly sqlNS?: tmpl.SqlNamespaceSupplier;
      readonly tblQualitySystem?: DomainsQS;
      readonly columnsQS?: typeof columnsQS;
    }
    & Partial<tmpl.SqlObjectsCommentsSupplier<Any, Any, Context>>
    & tmpl.SqlSymbolSupplier<Context>
    & tmpl.SqlLintIssuesSupplier
    & tmpl.SqlTextLintIssuesPopulator<Context> = {
      tableName,
      sqlSymbol: (ctx) =>
        ctx.sqlNamingStrategy(ctx, {
          quoteIdentifiers: true,
          qnss: tdOptions?.sqlNS,
        }).tableName(tableName),
      populateSqlTextLintIssues: (lis) => {
        for (const sdd of domains) {
          if (tmpl.isSqlLintIssuesSupplier(sdd)) {
            lis.registerLintIssue(...sdd.lintIssues);
          }
        }
        lis.registerLintIssue(...tableDefnResult.lintIssues);
      },
      lintIssues: [],
      registerLintIssue: (...li) => {
        tableDefnResult.lintIssues.push(...li);
      },
      SQL: (ctx) => {
        const { sqlTextEmitOptions: steOptions } = ctx;
        const ns = ctx.sqlNamingStrategy(ctx, {
          quoteIdentifiers: true,
          qnss: tdOptions?.sqlNS,
        });
        const indent = steOptions.indentation("define table column");
        const afterCDs =
          tdOptions?.sqlPartial?.("after all column definitions") ?? [];
        const decoratorsSQL = [...afterColumnDefnsSS, ...afterCDs].map((sts) =>
          sts.SQL(ctx)
        ).join(`,\n${indent}`);
        const afterTableDefn =
          tdOptions?.sqlPartial?.("after table definition") ?? [];
        const tableDecoratorsSQL = afterTableDefn.map((sts) => sts.SQL(ctx))
          .join(`,\n${indent}`);

        const { isTemp, isIdempotent } = tdOptions ?? {};
        const privilegesSQL = tdOptions?.privilegesSQL?.SQL(ctx);
        // deno-fmt-ignore
        const result = `${steOptions.indentation("create table")}CREATE ${isTemp ? 'TEMP ' : ''}TABLE ${isIdempotent && !tmpl.isMsSqlServerDialect(ctx.sqlDialect) ? "IF NOT EXISTS " : ""}${ns.tableName(tableName)} (\n` +
        columnDefnsSS.map(cdss => cdss.SQL(ctx)).join(",\n") +
        (decoratorsSQL.length > 0 ? `,\n${indent}${decoratorsSQL}` : "") +
        `\n)${tableDecoratorsSQL}${privilegesSQL?` ${privilegesSQL}`:""}`;
        return result;
      },
      graphEntityDefn,
      domains,
      symbolSuppliers,
      symbols,
      columns,
      primaryKey,
      unique,
      references: fkf.references,
      belongsTo: fkf.belongsTo,
      foreignKeys: fkf.foreignKeys,
      sqlNS: tdOptions?.sqlNS,
      tblQualitySystem,
      sqlObjectsComments,
      columnsQS,
      constraints,
      indexes,
    };

  // we let Typescript infer function return to allow generics in sqlDomains to
  // be more effective but we want other parts of the `result` to be as strongly
  // typed as possible
  return {
    zoSchema,
    zbSchema: fkf.zbSchema,
    ...tableDefnResult,
  };
}

/**
 * Generate the SQL for a temp table that can hold temporary "state" variables
 * for simple bind parameters or reference across other SQL statements. This is
 * usually only valuable for databases like SQLite or DuckDB that do not have
 * their own programming languages.
 * @param tableName the name of the temp table
 * @param shape object whose properties become table columns and whose values are the column values
 * @returns SQL template
 */
export const tempValuesTable = <
  TableName extends string,
  ColumnsShape extends z.ZodRawShape,
  Context extends tmpl.SqlEmitContext,
>(tableName: TableName, shape: ColumnsShape) => {
  const SQL: tmpl.SqlTextSupplier<Context> = {
    SQL: (ctx) => {
      const eo = ctx.sqlTextEmitOptions;
      const state = Object.entries(shape).map(([colName, recordValueRaw]) => {
        let value: [value: unknown, valueSqlText: string] | undefined;
        if (tmpl.isSqlTextSupplier(recordValueRaw)) {
          value = [recordValueRaw, `(${recordValueRaw.SQL(ctx)})`];
        } else {
          value = eo.quotedLiteral(recordValueRaw);
        }
        return [colName, value[1]];
      });

      // deno-fmt-ignore
      return `CREATE TEMP TABLE ${tableName} AS SELECT ${state.map(([key, value]) => `${value} AS ${key}`).join(",")}`;
    },
  };
  return {
    ...SQL,
    tableName,
    shape,
  };
};
