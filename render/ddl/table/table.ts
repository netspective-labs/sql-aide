import { zod as z } from "../../deps.ts";
import * as tmpl from "../../emit/mod.ts";
import * as safety from "../../../lib/universal/safety.ts";
import * as qs from "../../../lib/quality-system/mod.ts";
import * as d from "../../domain/mod.ts";
import * as c from "./column.ts";
import * as con from "./constraint.ts";
import * as pk from "./primary-key.ts";
import * as fk from "./foreign-key.ts";
import * as g from "../../graph.ts";

// deno-lint-ignore no-explicit-any
type Any = any; // make it easy on linter

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
    destination: "after all column definitions",
  ) => tmpl.SqlTextSupplier<Context>[] | undefined;
  readonly sqlNS?: tmpl.SqlNamespaceSupplier;
  readonly constraints?: <
    TableName extends string,
  >(
    columnsShape: ColumnsShape,
    tableName: TableName,
  ) => con.TableColumnsConstraint<ColumnsShape, Context>[];
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

  type ColumnDefns = {
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

  const columnDefnsSS: tmpl.SqlTextSupplier<Context>[] = [];
  const afterColumnDefnsSS: tmpl.SqlTextSupplier<Context>[] = [];
  const constraints: con.TableColumnsConstraint<ColumnsShape, Context>[] = [];
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
    const custom = tdOptions?.constraints(zodRawShape, tableName);
    afterColumnDefnsSS.push(...custom);
  }

  const graphEntityDefn = () => {
    const result: g.GraphEntityDefinition<
      TableName,
      Context,
      Any,
      DomainQS,
      DomainsQS
    > = {
      identity: () => tableName,
      attributes: domains,
      outboundReferences: (options) => fkf.outboundReferences(options),
    };
    return result;
  };

  const tblQualitySystem = tdOptions?.qualitySystem;
  const sqlObjectComment = tblQualitySystem
    ? (() =>
      tableComment<TableName, Context>(tableName, tblQualitySystem.description))
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
      readonly sqlNS?: tmpl.SqlNamespaceSupplier;
      readonly tblQualitySystem?: DomainsQS;
    }
    & Partial<tmpl.SqlObjectCommentSupplier<"table", TableName, Context>>
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

        const { isTemp, isIdempotent } = tdOptions ?? {};
        // deno-fmt-ignore
        const result = `${steOptions.indentation("create table")}CREATE ${isTemp ? 'TEMP ' : ''}TABLE ${isIdempotent && !tmpl.isMsSqlServerDialect(ctx.sqlDialect) ? "IF NOT EXISTS " : ""}${ns.tableName(tableName)} (\n` +
        columnDefnsSS.map(cdss => cdss.SQL(ctx)).join(",\n") +
        (decoratorsSQL.length > 0 ? `,\n${indent}${decoratorsSQL}` : "") +
        `\n)`;
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
      sqlObjectComment,
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
