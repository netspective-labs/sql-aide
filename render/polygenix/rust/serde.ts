import * as d from "../../domain/mod.ts";
import * as g from "../../graph.ts";
import * as emit from "../../emit/mod.ts";
import * as tbl from "../../ddl/table/mod.ts";
import * as im from "../info-model.ts";
import * as e from "../governance.ts";

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

export class RustSerDeModels<
  Context extends emit.SqlEmitContext,
  DomainQS extends d.SqlDomainQS,
  DomainsQS extends d.SqlDomainsQS<DomainQS>,
> implements emit.PolygenCellContentSupplier<Context> {
  readonly #typeStrategy: e.PolygenTypeStrategy;
  readonly #namingStrategy: e.PolygenNamingStrategy;
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
    readonly polygenOptions:
      & im.PolygenInfoModelOptions<
        Context,
        DomainQS,
        DomainsQS
      >
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
    this.#typeStrategy = polygenOptions?.typeStrategy ?? ({
      type: (pt) => rustSerDeTypes(pt),
    });

    // Rust likes tables/views/etc. structs to be in CamelCase and field names
    // in snake_case; since SQL columns, etc. are already in snake_case we just
    // return them as is by default.
    this.#namingStrategy = polygenOptions?.namingStrategy ?? ({
      entityName: e.snakeToPascalCase,
      entityAttrName: (sqlIdentifier) => sqlIdentifier,
    });
  }

  namingStrategy(): e.PolygenNamingStrategy {
    return this.#namingStrategy;
  }

  typeStrategy(): e.PolygenTypeStrategy {
    return this.#typeStrategy;
  }

  async entityAttrContent(
    ea: g.GraphEntityAttrReference<
      string,
      string,
      Context,
      DomainQS,
      DomainsQS
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
      await emit.polygenCellContent(this.sqlCtx, pgdt),
    );
    const remarks = tbl.isTablePrimaryKeyColumnDefn(ea.attr)
      ? (pgdtRemarks ? `PRIMARY KEY (${pgdtRemarks})` : pgdtRemarks)
      : pgdtRemarks;
    // deno-fmt-ignore
    return `    ${name}: ${ea.attr.isNullable() ? `Option<${type}>` : type},${remarks ? ` // ${remarks}` : ''}`;
  }

  async entityContent(
    entity: g.GraphEntityDefinition<
      string,
      Context,
      string,
      DomainQS,
      DomainsQS
    >,
  ) {
    const columns: string[] = [];
    // we want to put all the primary keys at the top of the entity
    for (const column of entity.attributes) {
      const ea = { entity: entity, attr: column };
      if (!this.polygenOptions.includeEntityAttr(ea)) continue;
      if (tbl.isTablePrimaryKeyColumnDefn(column)) {
        columns.push(await this.entityAttrContent(ea));
      }
    }

    for (const column of entity.attributes) {
      if (!tbl.isTablePrimaryKeyColumnDefn(column)) {
        const ea = { entity: entity, attr: column };
        if (!this.polygenOptions.includeEntityAttr(ea)) continue;
        columns.push(await this.entityAttrContent(ea));
      }
    }

    const entityRels = this.graph.entityRels.get(
      entity.identity("dictionary-storage"),
    );
    const children: string[] = [];
    if (entityRels && entityRels.inboundRels.length > 0) {
      for (const ir of entityRels.inboundRels) {
        if (typeof ir.nature === "object" && ir.nature.isBelongsTo) {
          if (!this.polygenOptions.includeChildren(ir)) continue;
          const collectionName = ir.nature.collectionName ??
            emit.jsSnakeCaseToken(ir.from.entity.identity("presentation"));
          children.push(
            `    ${
              collectionName(this.sqlCtx, "plural", "rust-struct-member-decl")
            }: Vec<${
              collectionName(this.sqlCtx, "singular", "rust-type-decl")
            }>, // \`${
              ir.from.entity.identity("presentation")
            }\` belongsTo collection`,
          );
        }
      }
    }

    const ns = this.namingStrategy();
    const structName = ns.entityName(
      this.sqlNames.tableName(entity.identity("presentation")),
    );
    return [
      `// \`${entity.identity("presentation")}\` table`,
      `#[derive(Debug, PartialEq, serde::Serialize, serde::Deserialize)]`,
      `pub struct ${structName} {`,
      ...columns,
      ...children,
      `}`,
      "",
    ];
  }

  async polygenContent() {
    const entitiesSrcCode: string[] = [];

    entitiesSrcCode.push("/*");
    for (const entity of this.graph.entities) {
      if (!this.polygenOptions.includeEntity(entity)) {
        continue;
      }

      entitiesSrcCode.push(
        `const ${
          e.snakeToConstantCase(entity.identity("presentation"))
        }: &str = "${entity.identity("presentation")}";`,
      );
    }
    entitiesSrcCode.push("*/");
    entitiesSrcCode.push("");

    for (const entity of this.graph.entities) {
      if (!this.polygenOptions.includeEntity(entity)) {
        continue;
      }

      const sc = await this.entityContent(entity);
      entitiesSrcCode.push(await emit.polygenCellContent(this.sqlCtx, sc));
    }

    const pscSupplier: emit.PolygenCellContent<Context> = entitiesSrcCode.join(
      "\n",
    );
    return pscSupplier;
  }
}
