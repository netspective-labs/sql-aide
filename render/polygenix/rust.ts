import * as d from "../domain/mod.ts";
import * as g from "../graph.ts";
import * as emit from "../emit/mod.ts";
import * as tbl from "../ddl/table/mod.ts";
import * as imGen from "./info-model.ts";
import { PolygenEngine } from "./engine.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export class RustPolygenEngine<
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

  sqliteTypeToRustType(sqliteType: string): string {
    switch (sqliteType.toLowerCase()) {
      case "integer":
        return "i64"; // SQLite's INTEGER is a 64-bit signed integer
      case "real":
        return "f64"; // REAL in SQLite is a floating point value
      case "text":
        return "String"; // TEXT maps to Rust's String type
      case "blob":
        return "Vec<u8>"; // BLOB is best represented as a byte array
      case "boolean":
        return "bool"; // Boolean type (commonly stored as INTEGER in SQLite)
      case "date":
        return "chrono::NaiveDate"; // Using chrono crate for date
      case "datetime":
        return "chrono::NaiveDateTime"; // Using chrono crate for datetime
      default:
        return "String"; // Default or unknown types can be mapped to String
    }
  }

  entityAttrSrcCode(
    ea: g.GraphEntityAttrReference<
      Any,
      Any,
      Context,
      DomainQS,
      DomainsQS
    >,
  ) {
    const name = this.sqlNames.tableColumnName({
      tableName: ea.entity.identity("presentation"),
      columnName: ea.attr.identity,
    });
    const descr = tbl.isTablePrimaryKeyColumnDefn(ea.attr) ? `PRIMARY KEY` : "";
    const sqlType = this.sqliteTypeToRustType(
      ea.attr.sqlDataType("create table column").SQL(
        this.sqlCtx,
      ),
    );
    // deno-fmt-ignore
    return `    ${name}: ${ea.attr.isNullable() ? `Some(${sqlType})` : sqlType},${descr ? ` // ${descr}` : ''}`;
  }

  entitySrcCode(
    e: g.GraphEntityDefinition<Any, Context, Any, DomainQS, DomainsQS>,
  ) {
    const columns: string[] = [];
    // we want to put all the primary keys at the top of the entity
    for (const column of e.attributes) {
      const ea = { entity: e, attr: column };
      if (!this.polygenSchemaOptions.includeEntityAttr(ea)) continue;
      if (tbl.isTablePrimaryKeyColumnDefn(column)) {
        columns.push(this.entityAttrSrcCode(ea));
      }
    }

    for (const column of e.attributes) {
      if (!tbl.isTablePrimaryKeyColumnDefn(column)) {
        const ea = { entity: e, attr: column };
        if (!this.polygenSchemaOptions.includeEntityAttr(ea)) continue;
        columns.push(this.entityAttrSrcCode(ea));
      }
    }

    const structName = this.sqlNames.tableName(e.identity("presentation"));
    return [
      `#[derive(Debug, PartialEq, serde::Serialize, serde::Deserialize)]`,
      `pub struct ${structName} {`,
      ...columns,
      `}`,
      "",
    ];
  }
}
