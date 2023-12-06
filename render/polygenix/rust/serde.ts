import * as d from "../../domain/mod.ts";
import * as g from "../../graph.ts";
import * as emit from "../../emit/mod.ts";
import * as tbl from "../../ddl/table/mod.ts";
import * as imGen from "../info-model.ts";
import { PolygenEngine } from "../engine.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export class RustSerDePolygenEngine<
  Context extends emit.SqlEmitContext,
  DomainQS extends d.SqlDomainQS,
  DomainsQS extends d.SqlDomainsQS<DomainQS>,
> implements PolygenEngine<Context, DomainQS, DomainsQS> {
  readonly sqlNames: emit.SqlObjectNames;

  constructor(
    readonly sqlCtx: Context,
    readonly polygenSchemaOptions: imGen.PolygenInfoModelOptions<
      Context,
      DomainQS,
      DomainsQS
    >,
  ) {
    this.sqlNames = sqlCtx.sqlNamingStrategy(sqlCtx);
  }

  polygenixRustType(
    ea: g.GraphEntityAttrReference<
      Any,
      Any,
      Context,
      DomainQS,
      DomainsQS
    >,
    pt: string,
  ): [type: string, remarks: string | undefined] {
    let result: [type: string, remarks: string];
    switch (pt) {
      case "integer":
        result = ["i64", `'${pt}' maps directly to Rust type`];
        break;
      case "float":
        result = ["f64", `'${pt}' maps directly to Rust type`];
        break;
      case "text":
      case "string":
        result = ["String", `'${pt}' maps directly to Rust type`];
        break;
      case "blob":
        result = ["Vec<u8>", `'${pt}' maps directly to Rust type`];
        break;
      case "boolean":
        result = ["bool", `'${pt}' maps directly to Rust type`];
        break;
      case "date":
        result = ["chrono::NaiveDate", `Using chrono crate for '${pt}'`];
        break;
      case "datetime":
        result = ["chrono::NaiveDateTime", `Using chrono crate for '${pt}'`]; // Using chrono crate for datetime
        break;
      default:
        result = [
          "String",
          `uknown type '${pt}', mapping to String by default`,
        ];
    }
    return this.polygenSchemaOptions.includeEntityAttrGenRemarks(ea)
      ? result
      : [result[0], undefined];
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
    const name = this.sqlNames.tableColumnName({
      tableName: ea.entity.identity("presentation"),
      columnName: ea.attr.identity,
    });
    const pgdt = ea.attr.polygenixDataType("info-model");
    const [pgdtSC, pgdtRemarks] = this.polygenixRustType(
      ea,
      await emit.sourceCodeText(this.sqlCtx, pgdt),
    );
    const remarks = tbl.isTablePrimaryKeyColumnDefn(ea.attr)
      ? (pgdtRemarks ? `PRIMARY KEY (${pgdtRemarks})` : pgdtRemarks)
      : pgdtRemarks;
    // deno-fmt-ignore
    return `    ${name}: ${ea.attr.isNullable() ? `Some(${pgdtSC})` : pgdtSC},${remarks ? ` // ${remarks}` : ''}`;
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

    const structName = this.sqlNames.tableName(entity.identity("presentation"));
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
