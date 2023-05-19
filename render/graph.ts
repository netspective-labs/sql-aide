import * as safety from "../lib/universal/safety.ts";
import * as d from "./domain/mod.ts";
import * as emit from "./emit/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export type EntityGraphRefNature<Context extends emit.SqlEmitContext> =
  | "reference"
  | {
    readonly isBelongsTo: true;
    readonly collectionName: emit.JsTokenSupplier<Context> | undefined;
  };

export interface EntityGraphOutboundReference<
  Context extends emit.SqlEmitContext,
> {
  readonly from: GraphEntityAttrReference<Any, Any, Context>;
  readonly to: GraphEntityAttrReference<Any, Any, Context>;
  readonly nature: EntityGraphRefNature<Context>;
}

export type EntityGraphOutboundReferencesSupplier<
  Context extends emit.SqlEmitContext,
  EntityName extends string,
> = (options: {
  readonly entity: GraphEntityDefinition<EntityName, Context, Any>;
  readonly entityByName: (
    name: EntityName,
  ) => undefined | GraphEntityDefinition<EntityName, Context, Any>;
  readonly reportIssue: (issue: emit.SqlLintIssueSupplier) => void;
}) => Generator<EntityGraphOutboundReference<Context>>;

export interface GraphEntityDefinition<
  EntityName extends string,
  Context extends emit.SqlEmitContext,
  AttrName extends string,
> {
  readonly identity: (
    purpose:
      | "presentation"
      | "dictionary-storage"
      | "outbound-ref-dict-lookup"
      | "lint-message",
  ) => EntityName;
  readonly attributes: d.SqlDomain<Any, Context, AttrName>[];
  readonly outboundReferences?: EntityGraphOutboundReferencesSupplier<
    Context,
    Any
  >;
}

export interface GraphEntityDefinitionSupplier<
  EntityName extends string,
  Context extends emit.SqlEmitContext,
> {
  readonly graphEntityDefn: () => GraphEntityDefinition<
    EntityName,
    Context,
    Any
  >;
}

export function isGraphEntityDefinitionSupplier<
  EntityName extends string,
  Context extends emit.SqlEmitContext,
>(
  o: unknown,
): o is GraphEntityDefinitionSupplier<EntityName, Context> {
  const isEDS = safety.typeGuard<
    GraphEntityDefinitionSupplier<EntityName, Context>
  >(
    "graphEntityDefn",
  );
  return isEDS(o);
}

export interface GraphEntityAttrReference<
  EntityName extends string,
  AttrName extends string,
  Context extends emit.SqlEmitContext,
> {
  readonly entity: GraphEntityDefinition<EntityName, Context, Any>;
  readonly attr: d.SqlDomain<Any, Context, AttrName>;
}

export interface GraphEdge<Context extends emit.SqlEmitContext> {
  readonly source: GraphEntityAttrReference<Any, Any, Context>;
  readonly ref: GraphEntityAttrReference<Any, Any, Context>;
}

export interface EntityGraphInboundRelationship<
  FromName extends string,
  ToName extends string,
  Context extends emit.SqlEmitContext,
> {
  readonly from: GraphEntityAttrReference<FromName, Any, Context>;
  readonly to: GraphEntityDefinition<ToName, Context, Any>;
  readonly nature: EntityGraphRefNature<Context>;
}

export interface EntityGraphInboundRelationshipBackRef<
  BackRefName extends string,
  FromName extends string,
  ToName extends string,
  Context extends emit.SqlEmitContext,
> {
  name: BackRefName;
  rel: EntityGraphInboundRelationship<FromName, ToName, Context>;
}

export function entitiesGraph<
  Entity extends GraphEntityDefinition<Any, Context, Any>,
  Context extends emit.SqlEmitContext,
>(
  ctx: Context,
  entityDefns: (ctx: Context) => Generator<Entity>,
) {
  const lintIssues: emit.SqlLintIssueSupplier[] = [];
  const entities: Entity[] = [];
  const entitiesByName = new Map<string, Entity>();
  const entityRels = new Map<string, {
    readonly entity: Entity;
    readonly inboundRels: EntityGraphInboundRelationship<Any, Any, Context>[];
  }>();
  const edges: GraphEdge<Context>[] = [];

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
  };
}
