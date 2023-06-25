import * as safety from "../lib/universal/safety.ts";
import * as qs from "../lib/quality-system/mod.ts";
import * as d from "./domain/mod.ts";
import * as emit from "./emit/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export type EntitiesGraphQS<
  DomainQS extends d.SqlDomainQS,
  DomainsQS extends d.SqlDomainsQS<DomainsQS>,
> = qs.Documentable;

export type EntityGraphRefNature<Context extends emit.SqlEmitContext> =
  | "reference"
  | {
    readonly isBelongsTo: true;
    readonly collectionName: emit.JsTokenSupplier<Context> | undefined;
  };

export interface EntityGraphOutboundReference<
  Context extends emit.SqlEmitContext,
  DomainQS extends d.SqlDomainQS,
  DomainsQS extends d.SqlDomainsQS<DomainsQS>,
> {
  readonly from: GraphEntityAttrReference<
    Any,
    Any,
    Context,
    DomainQS,
    DomainsQS
  >;
  readonly to: GraphEntityAttrReference<Any, Any, Context, DomainQS, DomainsQS>;
  readonly nature: EntityGraphRefNature<Context>;
}

export type EntityGraphOutboundReferencesSupplier<
  Context extends emit.SqlEmitContext,
  EntityName extends string,
  DomainQS extends d.SqlDomainQS,
  DomainsQS extends d.SqlDomainsQS<DomainsQS>,
> = (options: {
  readonly entity: GraphEntityDefinition<
    EntityName,
    Context,
    Any,
    DomainQS,
    DomainsQS
  >;
  readonly entityByName: (
    name: EntityName,
  ) =>
    | undefined
    | GraphEntityDefinition<EntityName, Context, Any, DomainQS, DomainsQS>;
  readonly reportIssue: (issue: emit.SqlLintIssueSupplier) => void;
}) => Generator<EntityGraphOutboundReference<Context, DomainQS, DomainsQS>>;

export interface GraphEntityDefinition<
  EntityName extends string,
  Context extends emit.SqlEmitContext,
  AttrName extends string,
  DomainQS extends d.SqlDomainQS,
  DomainsQS extends d.SqlDomainsQS<DomainsQS>,
> {
  readonly identity: (
    purpose:
      | "presentation"
      | "dictionary-storage"
      | "outbound-ref-dict-lookup"
      | "lint-message",
  ) => EntityName;
  readonly attributes: d.SqlDomain<Any, Context, AttrName, DomainQS>[];
  readonly outboundReferences?: EntityGraphOutboundReferencesSupplier<
    Context,
    Any,
    DomainQS,
    DomainsQS
  >;
}

export interface GraphEntityDefinitionSupplier<
  EntityName extends string,
  Context extends emit.SqlEmitContext,
  DomainQS extends d.SqlDomainQS,
  DomainsQS extends d.SqlDomainsQS<DomainsQS>,
> {
  readonly graphEntityDefn: () => GraphEntityDefinition<
    EntityName,
    Context,
    Any,
    DomainQS,
    DomainsQS
  >;
}

export function isGraphEntityDefinitionSupplier<
  EntityName extends string,
  Context extends emit.SqlEmitContext,
  DomainQS extends d.SqlDomainQS,
  DomainsQS extends d.SqlDomainsQS<DomainsQS>,
>(
  o: unknown,
): o is GraphEntityDefinitionSupplier<
  EntityName,
  Context,
  DomainQS,
  DomainsQS
> {
  const isEDS = safety.typeGuard<
    GraphEntityDefinitionSupplier<EntityName, Context, DomainQS, DomainsQS>
  >(
    "graphEntityDefn",
  );
  return isEDS(o);
}

export interface GraphEntityAttrReference<
  EntityName extends string,
  AttrName extends string,
  Context extends emit.SqlEmitContext,
  DomainQS extends d.SqlDomainQS,
  DomainsQS extends d.SqlDomainsQS<DomainsQS>,
> {
  readonly entity: GraphEntityDefinition<
    EntityName,
    Context,
    Any,
    DomainQS,
    DomainsQS
  >;
  readonly attr: d.SqlDomain<Any, Context, AttrName, DomainQS>;
}

export interface GraphEdge<
  Context extends emit.SqlEmitContext,
  DomainQS extends d.SqlDomainQS,
  DomainsQS extends d.SqlDomainsQS<DomainsQS>,
> {
  readonly source: GraphEntityAttrReference<
    Any,
    Any,
    Context,
    DomainQS,
    DomainsQS
  >;
  readonly ref: GraphEntityAttrReference<
    Any,
    Any,
    Context,
    DomainQS,
    DomainsQS
  >;
}

export interface EntityGraphInboundRelationship<
  FromName extends string,
  ToName extends string,
  Context extends emit.SqlEmitContext,
  DomainQS extends d.SqlDomainQS,
  DomainsQS extends d.SqlDomainsQS<DomainsQS>,
> {
  readonly from: GraphEntityAttrReference<
    FromName,
    Any,
    Context,
    DomainQS,
    DomainsQS
  >;
  readonly to: GraphEntityDefinition<ToName, Context, Any, DomainQS, DomainsQS>;
  readonly nature: EntityGraphRefNature<Context>;
}

export interface EntityGraphInboundRelationshipBackRef<
  BackRefName extends string,
  FromName extends string,
  ToName extends string,
  Context extends emit.SqlEmitContext,
  DomainQS extends d.SqlDomainQS,
  DomainsQS extends d.SqlDomainsQS<DomainsQS>,
> {
  name: BackRefName;
  rel: EntityGraphInboundRelationship<
    FromName,
    ToName,
    Context,
    DomainQS,
    DomainsQS
  >;
}

export function entitiesGraph<
  Entity extends GraphEntityDefinition<Any, Context, Any, DomainQS, DomainsQS>,
  Context extends emit.SqlEmitContext,
  DomainQS extends d.SqlDomainQS,
  DomainsQS extends d.SqlDomainsQS<DomainsQS>,
  GraphQS extends EntitiesGraphQS<DomainQS, DomainsQS>,
>(
  ctx: Context,
  entityDefns: (ctx: Context) => Generator<Entity>,
  graphQS?: GraphQS,
) {
  const lintIssues: emit.SqlLintIssueSupplier[] = [];
  const entities: Entity[] = [];
  const entitiesByName = new Map<string, Entity>();
  const entityRels = new Map<string, {
    readonly entity: Entity;
    readonly inboundRels: EntityGraphInboundRelationship<
      Any,
      Any,
      Context,
      Any,
      Any
    >[];
  }>();
  const edges: GraphEdge<Context, DomainQS, DomainsQS>[] = [];

  for (const ed of entityDefns(ctx)) {
    const entityName = ed.identity("dictionary-storage");
    entitiesByName.set(entityName, ed);
    entityRels.set(entityName, {
      entity: ed,
      inboundRels: [],
    });
    entities.push(ed);
  }

  for (const src of entities) {
    if (!src.outboundReferences) continue;

    for (
      const outbRef of src.outboundReferences({
        entity: src,
        entityByName: (name) => entitiesByName.get(name),
        reportIssue: (issue) => lintIssues.push(issue),
      })
    ) {
      const toeName = outbRef.to.entity.identity("outbound-ref-dict-lookup");
      const toEntity = entityRels.get(toeName);
      if (toEntity) {
        toEntity.inboundRels.push({
          from: outbRef.from,
          to: toEntity.entity,
          nature: outbRef.nature,
        });
        edges.push({ source: outbRef.from, ref: outbRef.to });
      } else {
        lintIssues.push({
          lintIssue: `entity '${toeName}' referenced in ${
            JSON.stringify(outbRef)
          } not found in graph, available: [${
            Array.from(entitiesByName.keys()).join(", ")
          }]`,
        });
      }
    }
  }

  return {
    lintIssues,
    entities,
    entitiesByName,
    entityRels,
    edges,
    graphQS,
  };
}
