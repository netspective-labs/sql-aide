import * as d from "../../domain/mod.ts";
import * as g from "../../graph.ts";
import * as emit from "../../emit/mod.ts";
import * as tbl from "../../ddl/table/mod.ts";
import * as imGen from "../info-model.ts";
import * as e from "../engine.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export function rustSerDeTypes(pt: string, options?: {
  readonly notFound: () => e.PolygenTypeSupplier;
}): e.PolygenTypeSupplier {
  let result: e.PolygenTypeSupplier;
  switch (pt) {
    case "integer":
      result = { type: "i64", remarks: `'${pt}' maps directly to Rust type` };
      break;
    case "float":
      result = { type: "f64", remarks: `'${pt}' maps directly to Rust type` };
      break;
    case "text":
    case "string":
      result = {
        type: "String",
        remarks: `'${pt}' maps directly to Rust type`,
      };
      break;
    case "blob":
      result = {
        type: "Vec<u8>",
        remarks: `'${pt}' maps directly to Rust type`,
      };
      break;
    case "boolean":
      result = {
        type: "bool",
        remarks: `'${pt}' maps directly to Rust type`,
      };
      break;
    case "date":
      result = {
        type: "chrono::NaiveDate",
        remarks: `Using chrono crate for '${pt}'`,
      };
      break;
    case "datetime":
    case "timestamp":
      result = {
        type: "chrono::NaiveDateTime",
        remarks: `Using chrono crate for '${pt}'`,
      };
      break;
    default:
      result = options?.notFound?.() ?? ({
        type: "String",
        remarks: `uknown type '${pt}', mapping to String by default`,
      });
  }
  return result;
}

export class RustSerDePolygenEngine<
  Context extends emit.SqlEmitContext,
  DomainQS extends d.SqlDomainQS,
  DomainsQS extends d.SqlDomainsQS<DomainQS>,
> implements e.PolygenEngine<Context, DomainQS, DomainsQS> {
  readonly #typeStrategy: e.PolygenEngineTypeStrategy;
  readonly #namingStrategy: e.PolygenEngineNamingStrategy;
  readonly sqlNames: emit.SqlObjectNames;

  constructor(
    readonly sqlCtx: Context,
    readonly polygenSchemaOptions:
      & imGen.PolygenInfoModelOptions<
        Context,
        DomainQS,
        DomainsQS
      >
      & { readonly typeStrategy?: e.PolygenEngineTypeStrategy }
      & { readonly namingStrategy?: e.PolygenEngineNamingStrategy },
  ) {
    this.sqlNames = sqlCtx.sqlNamingStrategy(sqlCtx);
    this.#typeStrategy = polygenSchemaOptions?.typeStrategy ?? ({
      type: (pt) => rustSerDeTypes(pt),
    });

    // Rust likes tables/views/etc. structs to be in CamelCase and field names
    // in snake_case; since SQL columns, etc. are already in snake_case we just
    // return them as is by default.
    this.#namingStrategy = polygenSchemaOptions?.namingStrategy ?? ({
      entityName: e.snakeToPascalCase,
      entityAttrName: (sqlIdentifier) => sqlIdentifier,
    });
  }

  namingStrategy(): e.PolygenEngineNamingStrategy {
    return this.#namingStrategy;
  }

  typeStrategy(): e.PolygenEngineTypeStrategy {
    return this.#typeStrategy;
  }

  async entityAttrSrcCode(
    ea: g.GraphEntityAttrReference<
      Any,
      Any,
      Context,
      DomainQS,
      DomainsQS
    >,
    _e: g.GraphEntityDefinition<Any, Context, Any, DomainQS, DomainsQS>,
    _graph: ReturnType<
      typeof g.entitiesGraph<
        Any,
        Context,
        DomainQS,
        DomainsQS,
        g.EntitiesGraphQS<DomainQS, DomainsQS>
      >
    >,
  ) {
    const ns = this.namingStrategy();
    const name = ns.entityAttrName(this.sqlNames.tableColumnName({
      tableName: ea.entity.identity("presentation"),
      columnName: ea.attr.identity,
    }));
    const pgdt = ea.attr.polygenixDataType("info-model");
    const types = this.typeStrategy();
    const { type, remarks: pgdtRemarks } = types.type(
      await emit.sourceCodeText(this.sqlCtx, pgdt),
    );
    const remarks = tbl.isTablePrimaryKeyColumnDefn(ea.attr)
      ? (pgdtRemarks ? `PRIMARY KEY (${pgdtRemarks})` : pgdtRemarks)
      : pgdtRemarks;
    // deno-fmt-ignore
    return `    ${name}: ${ea.attr.isNullable() ? `Option<${type}>` : type},${remarks ? ` // ${remarks}` : ''}`;
  }

  async entitySrcCode(
    entity: g.GraphEntityDefinition<Any, Context, Any, DomainQS, DomainsQS>,
    graph: ReturnType<
      typeof g.entitiesGraph<
        Any,
        Context,
        DomainQS,
        DomainsQS,
        g.EntitiesGraphQS<DomainQS, DomainsQS>
      >
    >,
  ) {
    const columns: string[] = [];
    // we want to put all the primary keys at the top of the entity
    for (const column of entity.attributes) {
      const ea = { entity: entity, attr: column };
      if (!this.polygenSchemaOptions.includeEntityAttr(ea)) continue;
      if (tbl.isTablePrimaryKeyColumnDefn(column)) {
        columns.push(await this.entityAttrSrcCode(ea, entity, graph));
      }
    }

    for (const column of entity.attributes) {
      if (!tbl.isTablePrimaryKeyColumnDefn(column)) {
        const ea = { entity: entity, attr: column };
        if (!this.polygenSchemaOptions.includeEntityAttr(ea)) continue;
        columns.push(await this.entityAttrSrcCode(ea, entity, graph));
      }
    }

    const entityRels = graph.entityRels.get(
      entity.identity("dictionary-storage"),
    );
    const children: string[] = [];
    if (entityRels && entityRels.inboundRels.length > 0) {
      for (const ir of entityRels.inboundRels) {
        if (typeof ir.nature === "object" && ir.nature.isBelongsTo) {
          if (!this.polygenSchemaOptions.includeChildren(ir)) continue;
          children.push(`// TODO: children -> ${ir.nature.collectionName}`);
        }
      }
    }

    const ns = this.namingStrategy();
    const structName = ns.entityName(
      this.sqlNames.tableName(entity.identity("presentation")),
    );
    return [
      `#[derive(Debug, PartialEq, serde::Serialize, serde::Deserialize)]`,
      `pub struct ${structName} {`,
      ...columns,
      ...children,
      `}`,
      "",
    ];
  }
}
