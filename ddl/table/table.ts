import { zod as z } from "../../deps.ts";
import * as tmpl from "../../emit/mod.ts";
import * as safety from "../../lib/universal/safety.ts";
import * as za from "../../lib/universal/zod-aide.ts";
import * as d from "../../domain/mod.ts";
// import * as js from "../../js.ts";
import * as c from "./column.ts";
import * as con from "./constraint.ts";

// deno-lint-ignore no-explicit-any
type Any = any; // make it easy on linter

export type TableDefinition<
  TableName extends string,
  Context extends tmpl.SqlEmitContext,
> = tmpl.SqlTextSupplier<Context> & {
  readonly tableName: TableName;
};

export function isTableDefinition<
  TableName extends string,
  Context extends tmpl.SqlEmitContext,
>(
  o: unknown,
  checkName?: TableName,
): o is TableDefinition<TableName, Context> {
  const isTD = safety.typeGuard<
    TableDefinition<TableName, Context>
  >("tableName", "SQL");
  return checkName ? isTD(o) && o.tableName == checkName : isTD(o);
}

export interface TableDefnOptions<
  ColumnsShape extends z.ZodRawShape,
  Context extends tmpl.SqlEmitContext,
> {
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

export function tableDefinition<
  TableName extends string,
  ColumnsShape extends z.ZodRawShape,
  Context extends tmpl.SqlEmitContext,
>(
  tableName: TableName,
  zodRawShape: ColumnsShape,
  tdOptions?: TableDefnOptions<ColumnsShape, Context>,
) {
  // const beforeDefnDebugText = za.filteredInspect(Deno.inspect({
  //   beforeDefnDebug: { zodRawShape },
  // }, { depth: 10 }));
  const sdf = d.sqlDomainsFactory<TableName, Context>();

  type BaggageSchema = {
    [Property in keyof ColumnsShape]: ReturnType<
      typeof sdf.zodTypeBaggageProxy<ColumnsShape[Property]>
    >;
  };

  type ForeignKeySource = {
    readonly tableName: TableName;
    readonly columnName: ColumnName;
    readonly incomingRefs: Set<ForeignKeyDestination>;
    readonly register: (rd: ForeignKeyDestination) => ForeignKeyDestination;
  };

  type ForeignKeyDestination = {
    readonly foreignKeySource: ForeignKeySource;
  };
  const isForeignKeyDestination = safety.typeGuard<ForeignKeyDestination>(
    "foreignKeySource",
  );

  type ForeignKeyPlaceholderSupplier = {
    readonly foreignKeySrcPlaceholder: ForeignKeySource;
  };

  const foreignKeyColumn = <ColumName extends string>(
    columnName: ColumName,
    zodType: z.ZodTypeAny,
    reference: ForeignKeyDestination,
  ) => {
    const domain = sdf.from(zodType, { identity: columnName });
    const result: typeof domain & ForeignKeyDestination = {
      ...domain,
      ...reference,
      sqlPartial: (
        dest:
          | "create table, full column defn"
          | "create table, column defn decorators"
          | "create table, after all column definitions",
      ) => {
        if (dest === "create table, after all column definitions") {
          const aacd = domain?.sqlPartial?.(
            "create table, after all column definitions",
          );
          const fkClause: tmpl.SqlTextSupplier<Context> = {
            SQL: ((ctx) => {
              const ns = ctx.sqlNamingStrategy(ctx, {
                quoteIdentifiers: true,
              });
              const tn = ns.tableName;
              const cn = ns.tableColumnName;
              // don't use the foreignTableName passed in because it could be
              // mutated for self-refs in table definition phase
              return `FOREIGN KEY(${
                cn({
                  tableName: "TODO",
                  columnName,
                })
              }) REFERENCES ${tn(reference.foreignKeySource.tableName)}(${
                cn(reference.foreignKeySource)
              })`;
            }),
          };
          return aacd ? [...aacd, fkClause] : [fkClause];
        }
        return domain.sqlPartial?.(dest);
      },
    };
    return result;
  };

  const foreignKeySrcZB = za.zodBaggage<
    ForeignKeySource,
    ForeignKeyPlaceholderSupplier
  >("foreignKeySrcPlaceholder");

  const zoSchema = z.object(zodRawShape).strict();
  const zbSchema: BaggageSchema = {} as Any;

  const { shape: tableShape, keys: tableShapeKeys } = zoSchema._getCached();
  for (const key of tableShapeKeys) {
    const member = tableShape[key];
    const foreignKeySource = foreignKeySrcZB.unwrappedBaggage(member);
    const sqlDomain = foreignKeySource
      ? foreignKeyColumn(key as Any, member, { foreignKeySource })
      : sdf.cacheableFrom(member, { identity: key as Any });
    (zbSchema[key] as Any) = sdf.zodTypeBaggageProxy<typeof member>(
      member,
      sqlDomain,
    );
  }

  // TODO: handle self-ref foreign keys
  // for (const columnDefn of sd.domains) {
  //   if (
  //     isTableForeignKeyColumnDefn(columnDefn) &&
  //     isTableSelfRefForeignKeyRelNature(columnDefn.foreignRelNature)
  //   ) {
  //     // manually "fix" the table name since self-refs are special
  //     (columnDefn as { foreignTableName: string }).foreignTableName = tableName;
  //   }
  // }

  type ColumnName = Extract<keyof ColumnsShape, string>;
  type ColumnDefns = {
    [Property in keyof ColumnsShape]: ColumnsShape[Property] extends
      z.ZodType<infer T, infer D, infer I> ? c.TableColumnDefn<
        TableName,
        Extract<Property, string>,
        z.ZodType<T, D, I>,
        Context
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
          Context
        >
        & c.TablePrimaryKeyColumnDefn<z.ZodType<T, D, I>, Context>
      : never;
  };

  type UniqueColumnDefns = {
    [
      Property in keyof ColumnsShape as Extract<
        Property,
        ColumnsShape[Property] extends { sqlDomain: { isUnique: true } }
          ? Property
          : never
      >
    ]: ColumnsShape[Property] extends z.ZodType<infer T, infer D, infer I> ? 
        & c.TableColumnDefn<
          TableName,
          Extract<Property, string>,
          z.ZodType<T, D, I>,
          Context
        >
        & con.UniqueTableColumn
      : never;
  };

  // type TableBelongsToRefDestNature<
  //   Context extends tmpl.SqlEmitContext,
  // > = {
  //   readonly isBelongsToRel: true;
  //   readonly collectionName?: js.JsTokenSupplier<Context>;
  // };

  // type TableSelfRefDestNature = {
  //   readonly isSelfRef: true;
  // };

  // type TableRefDestRelNature<Context extends tmpl.SqlEmitContext> =
  //   | TableBelongsToRefDestNature<Context>
  //   | TableSelfRefDestNature
  //   | { readonly isExtendsRel: true }
  //   | { readonly isInheritsRel: true };

  // function belongsToRelation<
  //   Context extends tmpl.SqlEmitContext,
  // >(
  //   singularSnakeCaseCollName?: string,
  //   pluralSnakeCaseCollName = singularSnakeCaseCollName
  //     ? `${singularSnakeCaseCollName}s`
  //     : undefined,
  // ): TableBelongsToRefDestNature<Context> {
  //   return {
  //     isBelongsToRel: true,
  //     collectionName: singularSnakeCaseCollName
  //       ? js.jsSnakeCaseToken(
  //         singularSnakeCaseCollName,
  //         pluralSnakeCaseCollName,
  //       )
  //       : undefined,
  //   };
  // }

  // function isTableBelongsToRefDestNature<
  //   Context extends tmpl.SqlEmitContext,
  // >(o: unknown): o is TableBelongsToRefDestNature<Context> {
  //   const isTBFKRN = safety.typeGuard<TableBelongsToRefDestNature<Context>>(
  //     "isBelongsToRel",
  //     "collectionName",
  //   );
  //   return isTBFKRN(o);
  // }

  // const isTableSelfRefDestNature = safety.typeGuard<
  //   TableSelfRefDestNature
  // >("isSelfRef");

  const inferables = () => {
    // the "inferred types" are the same as their original types except without
    // optionals, defaults, or nulls (always required, considered the "CoreZTA");
    type InferReferences = {
      [Property in keyof ColumnsShape]: () =>
        & za.CoreZTA<ColumnsShape[Property]>
        & ForeignKeyPlaceholderSupplier;
    };

    const inferredPlaceholder = (columnName: ColumnName) => {
      const incomingRefs = new Set<ForeignKeyDestination>();
      const refSource: ForeignKeySource = {
        tableName,
        columnName,
        incomingRefs,
        register: (rd) => {
          incomingRefs.add(rd);
          return rd;
        },
      };
      return refSource;
    };

    const inferables: InferReferences = {} as Any;
    for (const key of tableShapeKeys) {
      const zodType = tableShape[key];
      (inferables[key] as Any) = () => {
        // trick Typescript into thinking Zod instance is also FK placeholder;
        // this allows assignment of a reference to a Zod object or use as a
        // regular Zod schema; the placeholder is carried in zodType._def
        const cloned = sdf.clearWrappedBaggage(za.clonedZodType(zodType));
        return foreignKeySrcZB.zodTypeBaggageProxy(
          cloned,
          inferredPlaceholder(key as ColumnName),
        );
      };
    }

    return inferables;
  };

  const foreignKeyColumns = () => {
    type References = {
      [
        Property in keyof ColumnsShape as Extract<
          Property,
          ColumnsShape[Property] extends { sqlDomain: ForeignKeyDestination }
            ? Property
            : never
        >
      ]:
        & d.SqlDomain<
          ColumnsShape[Property],
          Context,
          Extract<Property, string>
        >
        & ForeignKeyDestination;
    };

    // see if any references were registered but need to be created
    const foreignKeys: References = {} as Any;
    for (const key of tableShapeKeys) {
      const zodTypeSD = zbSchema[key];
      if (isForeignKeyDestination(zodTypeSD.sqlDomain)) {
        (foreignKeys as Any)[key] = zodTypeSD.sqlDomain;
      }
    }

    return foreignKeys;
  };

  // compute this first, it mutates the sdSchema, replacing placeholders
  const foreignKeys = foreignKeyColumns();

  const domains = tableShapeKeys.map((key) =>
    zbSchema[key].sqlDomain as c.TableColumnDefn<
      TableName,
      Any,
      Any,
      Context
    >
  );

  const columnDefnsSS: tmpl.SqlTextSupplier<Context>[] = [];
  const afterColumnDefnsSS: tmpl.SqlTextSupplier<Context>[] = [];
  const constraints: con.TableColumnsConstraint<ColumnsShape, Context>[] = [];

  const primaryKey: PrimaryKeys = {} as Any;
  const unique: UniqueColumnDefns = {} as Any;
  for (const column of domains) {
    if (c.isTablePrimaryKeyColumnDefn(column)) {
      primaryKey[column.identity as (keyof PrimaryKeys)] = column as Any;
    }
    if (con.isUniqueTableColumn(column)) {
      unique[column.identity as (keyof UniqueColumnDefns)] = column as Any;
      constraints.push(con.uniqueContraint(column.identity));
    }
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

  const tableDefnResult:
    & TableDefinition<TableName, Context>
    & {
      readonly columns: ColumnDefns;
      readonly primaryKey: PrimaryKeys;
      readonly unique: UniqueColumnDefns;
      readonly infer: ReturnType<typeof inferables>;
      readonly foreignKeys: typeof foreignKeys;
      readonly sqlNS?: tmpl.SqlNamespaceSupplier;
    }
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
        const result = `${steOptions.indentation("create table")}CREATE ${isTemp ? 'TEMP ' : ''}TABLE ${isIdempotent ? "IF NOT EXISTS " : ""}${ns.tableName(tableName)} (\n` +
        columnDefnsSS.map(cdss => cdss.SQL(ctx)).join(",\n") +
        (decoratorsSQL.length > 0 ? `,\n${indent}${decoratorsSQL}` : "") +
        "\n)";
        return result;
      },
      columns,
      primaryKey,
      unique,
      infer: inferables(),
      foreignKeys: foreignKeys,
      sqlNS: tdOptions?.sqlNS,
    };

  // Deno.writeTextFileSync(
  //   `DELETE_ME_DEBUG_table_${tableName}_defn.txt`,
  //   beforeDefnDebugText + "\n" +
  //     za.filteredInspect(Deno.inspect({
  //       zoSchema,
  //       zbSchema,
  //       ...tableDefnResult,
  //     }, { depth: 10 })),
  // );

  // we let Typescript infer function return to allow generics in sqlDomains to
  // be more effective but we want other parts of the `result` to be as strongly
  // typed as possible
  return {
    zoSchema,
    zbSchema,
    ...tableDefnResult,
  };
}
