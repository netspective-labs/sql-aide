import { zod as z } from "../../deps.ts";
import * as tmpl from "../../emit/mod.ts";
import * as safety from "../../../lib/universal/safety.ts";
import * as za from "../../../lib/universal/zod-aide.ts";
import * as d from "../../domain/mod.ts";
import * as g from "../../graph.ts";

// deno-lint-ignore no-explicit-any
type Any = any; // make it easy on linter

export function foreignKeysFactory<
  TableName extends string,
  ColumnsShape extends z.ZodRawShape,
  Context extends tmpl.SqlEmitContext,
>(
  tableName: TableName,
  zodRawShape: ColumnsShape,
  sdf: ReturnType<typeof d.sqlDomainsFactory<TableName, Context>>,
) {
  type ColumnName = Extract<keyof ColumnsShape, string>;
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
    readonly foreignKeyRelNature?: ForeignKeyRelNature;
    readonly foreignKeySource: ForeignKeySource;
  };
  const isForeignKeyDestination = safety.typeGuard<ForeignKeyDestination>(
    "foreignKeySource",
  );

  type ForeignKeyPlaceholder = {
    readonly source: ForeignKeySource;
    readonly nature?: ForeignKeyRelNature;
  };
  type ForeignKeyPlaceholderSupplier = {
    readonly foreignKeySrcPlaceholder: ForeignKeyPlaceholder;
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

  type TableBelongsToRefDestNature = {
    readonly isBelongsToRel: true;
    readonly collectionName?: tmpl.JsTokenSupplier<Context>;
  };

  type TableSelfRefDestNature = {
    readonly isSelfRef: true;
  };

  type ForeignKeyRelNature =
    | TableBelongsToRefDestNature
    | TableSelfRefDestNature
    | { readonly isExtendsRel: true }
    | { readonly isInheritsRel: true };

  function belongsToRelation(
    singularSnakeCaseCollName?: string,
    pluralSnakeCaseCollName = singularSnakeCaseCollName
      ? `${singularSnakeCaseCollName}s`
      : undefined,
  ): TableBelongsToRefDestNature {
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
  ): o is TableBelongsToRefDestNature {
    const isTBFKRN = safety.typeGuard<TableBelongsToRefDestNature>(
      "isBelongsToRel",
      "collectionName",
    );
    return isTBFKRN(o);
  }

  // the "inferred types" are the same as their original types except without
  // optionals, defaults, or nulls (always required, considered the "CoreZTA");
  type InferReferences = {
    [Property in keyof ColumnsShape]: (nature?: ForeignKeyRelNature) =>
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

  const references: InferReferences = {} as Any;
  const belongsTo: BelongsToReferences = {} as Any;
  for (const key of tableShapeKeys) {
    const zodType = tableShape[key];
    (references[key] as Any) = (nature?: ForeignKeyRelNature) => {
      // trick Typescript into thinking Zod instance is also FK placeholder;
      // this allows assignment of a reference to a Zod object or use as a
      // regular Zod schema; the placeholder is carried in zodType._def
      const cloned = sdf.clearWrappedBaggage(za.clonedZodType(zodType));
      return foreignKeySrcZB.zodTypeBaggageProxy(
        cloned,
        { source: inferredPlaceholder(key as ColumnName), nature },
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
          source: inferredPlaceholder(key as ColumnName),
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
      & ForeignKeyDestination;
  };

  // see if any references were registered but need to be created
  const foreignKeys: ForeignKeys = {} as Any;
  for (const key of tableShapeKeys) {
    const zodTypeSD = zbSchema[key];
    if (isForeignKeyDestination(zodTypeSD.sqlDomain)) {
      (foreignKeys as Any)[key] = zodTypeSD.sqlDomain;
    }
  }

  const outboundReferences: g.EntityGraphOutboundReferencesSupplier<
    Context,
    TableName
  > = function* (
    { entity, entityByName, reportIssue },
  ): Generator<g.EntityGraphOutboundReference<Context>> {
    for (const key of tableShapeKeys) {
      const zodTypeSD = zbSchema[key];
      if (isForeignKeyDestination(zodTypeSD.sqlDomain)) {
        const fks = zodTypeSD.sqlDomain.foreignKeySource;
        const target = entityByName(fks.tableName);
        if (target) {
          const attr = target.attributes.find((sd) =>
            sd.identity == fks.columnName
          );
          if (attr) {
            yield {
              from: { entity, attr: zodTypeSD.sqlDomain },
              to: { entity: target, attr },
              nature: isBelongsToForeignKeyNature(fks)
                ? { isBelongsTo: true, collectionName: fks.collectionName }
                : "reference",
            };
          } else {
            reportIssue({
              // deno-fmt-ignore
              lintIssue: `table column '${fks.columnName}' referenced in foreignKey ${JSON.stringify(fks)} not found in graph`,
            });
          }
        } else {
          reportIssue({
            // deno-fmt-ignore
            lintIssue: `table '${fks.tableName}' referenced in foreignKey ${JSON.stringify(fks)} not found in graph`,
          });
        }
      }
    }
  };

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
    outboundReferences,
  };
}
