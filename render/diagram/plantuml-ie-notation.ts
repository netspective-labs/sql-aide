import * as SQLa from "../mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export interface PlantUmlIeOptions<
  Context extends SQLa.SqlEmitContext,
  DomainQS extends SQLa.SqlDomainQS,
  DomainsQS extends SQLa.SqlDomainsQS<DomainQS>,
> {
  readonly diagramName: string;
  readonly includeEntityAttr: (
    ea: SQLa.GraphEntityAttrReference<Any, Any, Context, DomainQS, DomainsQS>,
  ) => boolean;
  readonly elaborateEntityAttr?: (
    ea: SQLa.GraphEntityAttrReference<Any, Any, Context, DomainQS, DomainsQS>,
    entity: (
      name: string,
    ) =>
      | SQLa.GraphEntityDefinition<Any, Context, Any, DomainQS, DomainsQS>
      | undefined,
    ns: SQLa.SqlObjectNames,
  ) => string;
  readonly includeEntity: (
    e: SQLa.GraphEntityDefinition<Any, Context, Any, DomainQS, DomainsQS>,
  ) => boolean;
  readonly includeRelationship: (
    edge: SQLa.GraphEdge<Context, Any, Any>,
  ) => boolean;
  readonly relationshipIndicator: (
    edge: SQLa.GraphEdge<Context, Any, Any>,
  ) => string | false;
  readonly includeChildren: (
    ir: SQLa.EntityGraphInboundRelationship<
      Any,
      Any,
      Context,
      DomainQS,
      DomainsQS
    >,
  ) => boolean;
}

export function typicalPlantUmlIeOptions<
  Context extends SQLa.SqlEmitContext,
  DomainQS extends SQLa.SqlDomainQS,
  DomainsQS extends SQLa.SqlDomainsQS<DomainQS>,
>(
  inherit?: Partial<PlantUmlIeOptions<Context, DomainQS, DomainsQS>>,
): PlantUmlIeOptions<Context, DomainQS, DomainsQS> {
  // we let type inference occur so generics can follow through
  return {
    diagramName: "IE",
    includeEntity: () => true,
    includeEntityAttr: () => true,
    includeRelationship: () => true,
    includeChildren: () => true,
    elaborateEntityAttr: () => "",
    relationshipIndicator: (_edge) => {
      return "|o..o{";
    },
    ...inherit,
  };
}

export function plantUmlIE<
  Entity extends SQLa.GraphEntityDefinition<
    Any,
    Context,
    Any,
    DomainQS,
    DomainsQS
  >,
  Context extends SQLa.SqlEmitContext,
  DomainQS extends SQLa.SqlDomainQS,
  DomainsQS extends SQLa.SqlDomainsQS<DomainQS>,
>(
  ctx: Context,
  entityDefns: (ctx: Context) => Generator<Entity>,
  puieOptions: PlantUmlIeOptions<Context, DomainQS, DomainsQS>,
) {
  const graph = SQLa.entitiesGraph(ctx, entityDefns);
  const ns = ctx.sqlNamingStrategy(ctx);

  const attrPuml = (
    ea: SQLa.GraphEntityAttrReference<Any, Any, Context, DomainQS, DomainsQS>,
  ) => {
    const tcName = ns.tableColumnName({
      tableName: ea.entity.identity("presentation"),
      columnName: ea.attr.identity,
    });
    const required = ea.attr.isNullable() ? " " : "*";
    const name = SQLa.isTablePrimaryKeyColumnDefn(ea.attr)
      ? `**${tcName}**`
      : tcName;
    const descr = puieOptions.elaborateEntityAttr?.(
      ea,
      (name) => graph.entitiesByName.get(name),
      ns,
    );
    const sqlType = ea.attr.sqlDataType("diagram").SQL(ctx);
    return `    ${required} ${name}: ${sqlType}${descr ?? ""}`;
  };

  const entityPuml = (
    e: SQLa.GraphEntityDefinition<Any, Context, Any, DomainQS, DomainsQS>,
  ) => {
    const columns: string[] = [];
    // we want to put all the primary keys at the top of the entity
    for (const column of e.attributes) {
      const ea = { entity: e, attr: column };
      if (!puieOptions.includeEntityAttr(ea)) continue;
      if (SQLa.isTablePrimaryKeyColumnDefn(column)) {
        columns.push(attrPuml(ea));
        columns.push("    --");
      }
    }

    for (const column of e.attributes) {
      if (!SQLa.isTablePrimaryKeyColumnDefn(column)) {
        const ea = { entity: e, attr: column };
        if (!puieOptions.includeEntityAttr(ea)) continue;
        columns.push(attrPuml(ea));
      }
    }

    const rels = graph.entityRels.get(e.identity("dictionary-storage"));
    const children: string[] = [];
    if (rels && rels.inboundRels.length > 0) {
      for (const ir of rels.inboundRels) {
        if (typeof ir.nature === "object" && ir.nature.isBelongsTo) {
          if (!puieOptions.includeChildren(ir)) continue;
          const collectionName = ir.nature.collectionName ??
            SQLa.jsSnakeCaseToken(ir.from.entity.identity("presentation"));
          children.push(
            `    ${collectionName(ctx, "plural", "js-class-member-decl")}: ${
              collectionName(ctx, "singular", "ts-type-decl")
            }[]`,
          );
        }
      }
    }
    if (children.length > 0) {
      children.unshift("    --");
    }

    return [
      "",
      `  entity "${ns.tableName(e.identity("presentation"))}" as ${
        ns.tableName(e.identity("presentation"))
      } {`,
      ...columns,
      ...children,
      `  }`,
    ];
  };

  const tablesPuml = () => {
    let result: string[] = [];
    for (const table of entityDefns(ctx)) {
      if (!puieOptions.includeEntity(table)) {
        continue;
      }

      result = result.concat(entityPuml(table));
    }
    return result;
  };

  const relationshipsPuml = () => {
    const result: string[] = [];
    for (const rel of graph.edges) {
      if (!puieOptions.includeRelationship(rel)) {
        continue;
      }
      const src = rel.source;
      const ref = rel.ref;
      // Relationship types see: https://plantuml.com/es/ie-diagram
      // Zero or One	|o--
      // Exactly One	||--
      // Zero or Many	}o--
      // One or Many	}|--
      const relIndicator = puieOptions.relationshipIndicator(rel);
      if (relIndicator) {
        result.push(
          `  ${
            ns.tableName(ref.entity.identity("presentation"))
          } ${relIndicator} ${
            ns.tableName(src.entity.identity("presentation"))
          }`,
        );
      }
    }
    if (result.length > 0) result.unshift("");
    return result;
  };

  const content = [
    `@startuml ${puieOptions.diagramName}`,
    "  hide circle",
    "  skinparam linetype ortho",
    "  skinparam roundcorner 20",
    "  skinparam class {",
    "    BackgroundColor White",
    "    ArrowColor Silver",
    "    BorderColor Silver",
    "    FontColor Black",
    "    FontSize 12",
    "  }",
    ...tablesPuml(),
    ...relationshipsPuml(),
    "@enduml",
  ].join("\n");

  return {
    graph,
    content,
  };
}
