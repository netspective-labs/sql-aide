import { zod as z } from "../../deps.ts";
import * as tmpl from "../../emit/mod.ts";
import * as safety from "../../../lib/universal/safety.ts";
import * as za from "../../../lib/universal/zod-aide.ts";
import * as d from "../../domain/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any; // make it easy on linter

/*
  Moved this type outside 'foreignKeysFactory' because I was having this error:
  error TS4060: Return type of exported function has or is using private name 'ForeignKeySource'.
*/
export type ForeignKeySource<
  TableName extends string,
  ColumnsShape extends z.ZodRawShape,
  Context extends tmpl.SqlEmitContext,
> = {
  readonly tableName: TableName;
  readonly columnName: ColumnName<ColumnsShape>;
  readonly incomingRefs: Set<
    ForeignKeyDestination<TableName, ColumnsShape, Context>
  >;
  readonly register: (
    rd: ForeignKeyDestination<TableName, ColumnsShape, Context>,
  ) => ForeignKeyDestination<TableName, ColumnsShape, Context>;
};

type ColumnName<ColumnsShape extends z.ZodRawShape> = Extract<
  keyof ColumnsShape,
  string
>;

type ForeignKeyDestination<
  TableName extends string,
  ColumnsShape extends z.ZodRawShape,
  Context extends tmpl.SqlEmitContext,
> = {
  readonly foreignKeyRelNature?: ForeignKeyRelNature<Context>;
  readonly foreignKeySource: ForeignKeySource<TableName, ColumnsShape, Context>;
};

type ForeignKeyRelNature<Context extends tmpl.SqlEmitContext> =
  | TableBelongsToRefDestNature<Context>
  | TableSelfRefDestNature
  | { readonly isExtendsRel: true }
  | { readonly isInheritsRel: true };

type TableBelongsToRefDestNature<Context extends tmpl.SqlEmitContext> = {
  readonly isBelongsToRel: true;
  readonly collectionName?: tmpl.JsTokenSupplier<Context>;
};

type TableSelfRefDestNature = {
  readonly isSelfRef: true;
};

export function foreignKeysFactory<
  TableName extends string,
  ColumnsShape extends z.ZodRawShape,
  Context extends tmpl.SqlEmitContext,
>(
  tableName: TableName,
  zodRawShape: ColumnsShape,
  sdf: ReturnType<typeof d.sqlDomainsFactory<TableName, Context>>,
) {
  type BaggageSchema = {
    [Property in keyof ColumnsShape]: ReturnType<
      typeof sdf.zodTypeBaggageProxy<ColumnsShape[Property]>
    >;
  };

  const isForeignKeyDestination = safety.typeGuard<
    ForeignKeyDestination<TableName, ColumnsShape, Context>
  >(
    "foreignKeySource",
  );

  type ForeignKeyPlaceholder = {
    readonly source: ForeignKeySource<TableName, ColumnsShape, Context>;
    readonly nature?: ForeignKeyRelNature<Context>;
  };
  type ForeignKeyPlaceholderSupplier = {
    readonly foreignKeySrcPlaceholder: ForeignKeyPlaceholder;
  };

  const foreignKeyColumn = <ColumName extends string>(
    columnName: ColumName,
    zodType: z.ZodTypeAny,
    reference: ForeignKeyDestination<TableName, ColumnsShape, Context>,
  ) => {
    const domain = sdf.from(zodType, { identity: columnName });
    const result:
      & typeof domain
      & ForeignKeyDestination<
        TableName,
        ColumnsShape,
        Context
      > = {
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
    reference.foreignKeySource.register(result);
    return result;
  };

  const foreignKeySrcZB = za.zodBaggage<
    ForeignKeyPlaceholder,
    ForeignKeyPlaceholderSupplier
  >("foreignKeySrcPlaceholder");

  const zoSchema = z.object(zodRawShape).strict();
  const zbSchema: BaggageSchema = {} as Any;

  const { shape: tableShape, keys: tableShapeKeys } = zoSchema._getCached();
  for (const key of tableShapeKeys) {
    const member = tableShape[key];
    const placeholder = foreignKeySrcZB.unwrappedBaggage(member);
    const sqlDomain = placeholder
      ? foreignKeyColumn(key as Any, member, {
        foreignKeyRelNature: placeholder.nature,
        foreignKeySource: placeholder.source,
      })
      : sdf.cacheableFrom(member, { identity: key as Any });
    (zbSchema[key] as Any) = sdf.zodTypeBaggageProxy<typeof member>(
      member,
      sqlDomain,
    );
  }

  function belongsToRelation(
    singularSnakeCaseCollName?: string,
    pluralSnakeCaseCollName = singularSnakeCaseCollName
      ? `${singularSnakeCaseCollName}s`
      : undefined,
  ): TableBelongsToRefDestNature<Context> {
    return {
      isBelongsToRel: true,
      collectionName: singularSnakeCaseCollName
        ? tmpl.jsSnakeCaseToken(
          singularSnakeCaseCollName,
          pluralSnakeCaseCollName,
        )
        : undefined,
    };
  }

  function isBelongsToForeignKeyNature(
    o: unknown,
  ): o is TableBelongsToRefDestNature<Context> {
    const isTBFKRN = safety.typeGuard<TableBelongsToRefDestNature<Context>>(
      "isBelongsToRel",
      "collectionName",
    );
    return isTBFKRN(o);
  }

  // the "inferred types" are the same as their original types except without
  // optionals, defaults, or nulls (always required, considered the "CoreZTA");
  type InferReferences = {
    [Property in keyof ColumnsShape]: (nature?: ForeignKeyRelNature<Context>) =>
      & za.CoreZTA<ColumnsShape[Property]>
      & ForeignKeyPlaceholderSupplier;
  };
  type BelongsToReferences = {
    [Property in keyof ColumnsShape]: (
      singularSnakeCaseCollName?: string,
      pluralSnakeCaseCollName?: string,
    ) =>
      & za.CoreZTA<ColumnsShape[Property]>
      & ForeignKeyPlaceholderSupplier;
  };

  const inferredPlaceholder = (columnName: ColumnName<ColumnsShape>) => {
    const incomingRefs = new Set<
      ForeignKeyDestination<
        TableName,
        ColumnsShape,
        Context
      >
    >();
    const refSource: ForeignKeySource<
      TableName,
      ColumnsShape,
      Context
    > = {
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

  const references: InferReferences = {} as Any;
  const belongsTo: BelongsToReferences = {} as Any;
  for (const key of tableShapeKeys) {
    const zodType = tableShape[key];
    (references[key] as Any) = (nature?: ForeignKeyRelNature<Context>) => {
      // trick Typescript into thinking Zod instance is also FK placeholder;
      // this allows assignment of a reference to a Zod object or use as a
      // regular Zod schema; the placeholder is carried in zodType._def
      const cloned = sdf.clearWrappedBaggage(za.clonedZodType(zodType));
      return foreignKeySrcZB.zodTypeBaggageProxy(
        cloned,
        {
          source: inferredPlaceholder(key as ColumnName<ColumnsShape>),
          nature,
        },
      );
    };
    (belongsTo[key] as Any) = (
      singularSnakeCaseCollName?: string,
      pluralSnakeCaseCollName = singularSnakeCaseCollName
        ? `${singularSnakeCaseCollName}s`
        : undefined,
    ) => {
      // trick Typescript into thinking Zod instance is also FK placeholder;
      // this allows assignment of a reference to a Zod object or use as a
      // regular Zod schema; the placeholder is carried in zodType._def
      const cloned = sdf.clearWrappedBaggage(za.clonedZodType(zodType));
      return foreignKeySrcZB.zodTypeBaggageProxy(
        cloned,
        {
          source: inferredPlaceholder(key as ColumnName<ColumnsShape>),
          nature: belongsToRelation(
            singularSnakeCaseCollName,
            pluralSnakeCaseCollName,
          ),
        },
      );
    };
  }

  // TODO: the type-safe part of ForeignKeys doesn't work but the runtime
  // version does. There's some problem with the types carrying through from
  // one table to another so it needs more work.
  type ForeignKeys = {
    [
      Property in keyof ColumnsShape as Extract<
        Property,
        ColumnsShape[Property] extends ForeignKeyPlaceholderSupplier ? Property
          : never
      >
    ]:
      & d.SqlDomain<
        BaggageSchema[Property],
        Context,
        Extract<Property, string>
      >
      & ForeignKeyDestination<
        TableName,
        ColumnsShape,
        Context
      >;
  };

  // see if any references were registered but need to be created
  const foreignKeys: ForeignKeys = {} as Any;
  for (const key of tableShapeKeys) {
    const zodTypeSD = zbSchema[key];
    if (isForeignKeyDestination(zodTypeSD.sqlDomain)) {
      (foreignKeys as Any)[key] = zodTypeSD.sqlDomain;
    }
  }

  // we let Typescript infer function return to allow generics in sqlDomains to
  // be more effective but we want other parts of the `result` to be as strongly
  // typed as possible
  return {
    foreignKeySrcZB,
    foreignKeyColumn,
    references,
    belongsTo,
    foreignKeys,
    isForeignKeyDestination,
    isBelongsToForeignKeyNature,
  };
}
