import * as d from "../../domain/mod.ts";
import * as g from "../../graph.ts";
import * as emit from "../../mod.ts";
import * as im from "../info-model.ts";
import * as e from "../governance.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export interface PlantUmlIeOptions<
  Context extends emit.SqlEmitContext,
  DomainQS extends emit.SqlDomainQS,
  DomainsQS extends emit.SqlDomainsQS<DomainQS>,
> extends im.PolygenInfoModelOptions<Context, DomainQS, DomainsQS> {
  readonly diagramName: string;
  readonly elaborateEntityAttr?: (
    ea: emit.GraphEntityAttrReference<Any, Any, Context, DomainQS, DomainsQS>,
    entity: (
      name: string,
    ) =>
      | emit.GraphEntityDefinition<Any, Context, Any, DomainQS, DomainsQS>
      | undefined,
    ns: emit.SqlObjectNames,
  ) => string;
  readonly relationshipIndicator: (
    edge: emit.GraphEdge<Context, Any, Any>,
  ) => string | false;
}

export function typicalPlantUmlIeOptions<
  Context extends emit.SqlEmitContext,
  DomainQS extends emit.SqlDomainQS,
  DomainsQS extends emit.SqlDomainsQS<DomainQS>,
>(
  inherit?: Partial<PlantUmlIeOptions<Context, DomainQS, DomainsQS>>,
): PlantUmlIeOptions<Context, DomainQS, DomainsQS> {
  // we let type inference occur so generics can follow through
  return {
    ...im.typicalPolygenInfoModelOptions(inherit),
    diagramName: "IE",
    elaborateEntityAttr: () => "",
    relationshipIndicator: (_edge) => {
      return "|o..o{";
    },
    ...inherit,
  };
}

export class PlantUmlIe<
  Context extends emit.SqlEmitContext,
  DomainQS extends d.SqlDomainQS,
  DomainsQS extends d.SqlDomainsQS<DomainQS>,
> implements emit.PolygenCellContentSupplier<Context> {
  readonly sqlNames: emit.SqlObjectNames;
  readonly graph: ReturnType<
    typeof g.entitiesGraph<
      g.GraphEntityDefinition<string, Context, string, DomainQS, DomainsQS>,
      Context,
      DomainQS,
      DomainsQS,
      g.EntitiesGraphQS<DomainQS, DomainsQS>
    >
  >;

  constructor(
    readonly sqlCtx: Context,
    readonly entityDefns: (
      ctx: Context,
    ) => Generator<
      g.GraphEntityDefinition<string, Context, string, DomainQS, DomainsQS>
    >,
    readonly puieOptions:
      & PlantUmlIeOptions<Context, DomainQS, DomainsQS>
      & { readonly typeStrategy?: e.PolygenTypeStrategy }
      & { readonly namingStrategy?: e.PolygenNamingStrategy },
  ) {
    this.sqlNames = sqlCtx.sqlNamingStrategy(sqlCtx);
    this.graph = g.entitiesGraph<
      g.GraphEntityDefinition<string, Context, string, DomainQS, DomainsQS>,
      Context,
      DomainQS,
      DomainsQS,
      g.EntitiesGraphQS<DomainQS, DomainsQS>
    >(
      this.sqlCtx,
      this.entityDefns,
    );
  }

  // deno-lint-ignore require-await
  async entityAttrContent(
    ea: g.GraphEntityAttrReference<
      string,
      string,
      Context,
      DomainQS,
      DomainsQS
    >,
  ) {
    const tcName = this.sqlNames.tableColumnName({
      tableName: ea.entity.identity("presentation"),
      columnName: ea.attr.identity,
    });
    const required = ea.attr.isNullable() ? " " : "*";
    const name = emit.isTablePrimaryKeyColumnDefn(ea.attr)
      ? `**${tcName}**`
      : tcName;
    const descr = this.puieOptions.elaborateEntityAttr?.(
      ea,
      (name) => this.graph.entitiesByName.get(name),
      this.sqlNames,
    );
    const sqlType = ea.attr.sqlDataType("diagram").SQL(this.sqlCtx);
    return `    ${required} ${name}: ${sqlType}${descr ?? ""}`;
  }

  async entityContent(
    e: g.GraphEntityDefinition<Any, Context, Any, DomainQS, DomainsQS>,
  ) {
    const columns: string[] = [];
    // we want to put all the primary keys at the top of the entity
    for (const column of e.attributes) {
      const ea = { entity: e, attr: column };
      if (!this.puieOptions.includeEntityAttr(ea)) continue;
      if (emit.isTablePrimaryKeyColumnDefn(column)) {
        columns.push(await this.entityAttrContent(ea));
        columns.push("    --");
      }
    }

    for (const column of e.attributes) {
      if (!emit.isTablePrimaryKeyColumnDefn(column)) {
        const ea = { entity: e, attr: column };
        if (!this.puieOptions.includeEntityAttr(ea)) continue;
        columns.push(await this.entityAttrContent(ea));
      }
    }

    const rels = this.graph.entityRels.get(e.identity("dictionary-storage"));
    const children: string[] = [];
    if (rels && rels.inboundRels.length > 0) {
      for (const ir of rels.inboundRels) {
        if (typeof ir.nature === "object" && ir.nature.isBelongsTo) {
          if (!this.puieOptions.includeChildren(ir)) continue;
          const collectionName = ir.nature.collectionName ??
            emit.jsSnakeCaseToken(ir.from.entity.identity("presentation"));
          children.push(
            `    ${
              collectionName(this.sqlCtx, "plural", "js-class-member-decl")
            }: ${collectionName(this.sqlCtx, "singular", "ts-type-decl")}[]`,
          );
        }
      }
    }
    if (children.length > 0) {
      children.unshift("    --");
    }

    const tableName = this.sqlNames.tableName(e.identity("presentation"));
    return [
      "",
      `  entity "${tableName}" as ${tableName} {`,
      ...columns,
      ...children,
      `  }`,
    ];
  }

  async polygenContent() {
    const tablesPuml: string[] = [];
    for (const table of this.entityDefns(this.sqlCtx)) {
      if (!this.puieOptions.includeEntity(table)) {
        continue;
      }

      tablesPuml.push(...await this.entityContent(table));
    }

    const relationshipsPuml: string[] = [];
    for (const rel of this.graph.edges) {
      if (!this.puieOptions.includeRelationship(rel)) {
        continue;
      }
      const src = rel.source;
      const ref = rel.ref;
      // Relationship types see: https://plantuml.com/es/ie-diagram
      // Zero or One	|o--
      // Exactly One	||--
      // Zero or Many	}o--
      // One or Many	}|--
      const relIndicator = this.puieOptions.relationshipIndicator(rel);
      if (relIndicator) {
        relationshipsPuml.push(
          `  ${
            this.sqlNames.tableName(ref.entity.identity("presentation"))
          } ${relIndicator} ${
            this.sqlNames.tableName(src.entity.identity("presentation"))
          }`,
        );
      }
    }
    if (relationshipsPuml.length > 0) relationshipsPuml.unshift("");

    const content: emit.PolygenCellContent<Context> = [
      `@startuml ${this.puieOptions.diagramName}`,
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
      ...tablesPuml,
      ...relationshipsPuml,
      "@enduml",
    ].join("\n");
    return content;
  }
}
