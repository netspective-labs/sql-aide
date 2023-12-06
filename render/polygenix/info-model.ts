import * as d from "../domain/mod.ts";
import * as g from "../graph.ts";
import * as emit from "../emit/mod.ts";
import { PolygenEngine } from "./engine.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export interface PolygenInfoModelOptions<
  PolygenContext extends emit.PolygenEmitContext,
  SqlContext extends emit.SqlEmitContext,
  DomainQS extends d.SqlDomainQS,
  DomainsQS extends d.SqlDomainsQS<DomainQS>,
> {
  readonly includeEntityAttr: (
    ea: g.GraphEntityAttrReference<
      Any,
      Any,
      SqlContext,
      DomainQS,
      DomainsQS
    >,
  ) => boolean;
  readonly includeEntity: (
    e: g.GraphEntityDefinition<Any, SqlContext, Any, DomainQS, DomainsQS>,
  ) => boolean;
  readonly includeRelationship: (
    edge: g.GraphEdge<SqlContext, Any, Any>,
  ) => boolean;
  readonly includeChildren: (
    ir: g.EntityGraphInboundRelationship<
      Any,
      Any,
      SqlContext,
      DomainQS,
      DomainsQS
    >,
  ) => boolean;
}

export function typicalPolygenInfoModelOptions<
  PolygenContext extends emit.PolygenEmitContext,
  SqlContext extends emit.SqlEmitContext,
  DomainQS extends d.SqlDomainQS,
  DomainsQS extends d.SqlDomainsQS<DomainQS>,
>(
  inherit?: Partial<
    PolygenInfoModelOptions<PolygenContext, SqlContext, DomainQS, DomainsQS>
  >,
): PolygenInfoModelOptions<PolygenContext, SqlContext, DomainQS, DomainsQS> {
  // we let type inference occur so generics can follow through
  return {
    includeEntity: () => true,
    includeEntityAttr: () => true,
    includeRelationship: () => true,
    includeChildren: () => true,
    ...inherit,
  };
}

/**
 * Encapsulates polyglot source code generation code for information models
 * like tables, views to be represented as structs, types, etc.
 */
export class PolygenInfoModelNotebook<
  PolygenContext extends emit.PolygenEmitContext,
  Entity extends g.GraphEntityDefinition<
    Any,
    SqlContext,
    Any,
    DomainQS,
    DomainsQS
  >,
  SqlContext extends emit.SqlEmitContext,
  DomainQS extends d.SqlDomainQS,
  DomainsQS extends d.SqlDomainsQS<DomainQS>,
> extends emit.PolygenNotebook<PolygenContext> {
  constructor(
    readonly engine: PolygenEngine<
      PolygenContext,
      SqlContext,
      DomainQS,
      DomainsQS
    >,
    readonly sqlCtx: SqlContext,
    readonly entityDefns: (ctx: SqlContext) => Generator<Entity>,
    readonly polygenSchemaOptions: PolygenInfoModelOptions<
      PolygenContext,
      SqlContext,
      DomainQS,
      DomainsQS
    >,
  ) {
    super();
  }

  async entitiesSrcCode() {
    const peCtx = this.engine.polygenEmitCtx();
    const graph = g.entitiesGraph(this.sqlCtx, this.entityDefns);

    const entitiesSrcCode: string[] = [];
    for (const entity of graph.entities) {
      if (!this.polygenSchemaOptions.includeEntity(entity)) {
        continue;
      }

      const sc = this.engine.entitySrcCode(entity);
      entitiesSrcCode.push(await emit.sourceCodeText(peCtx, sc));
    }

    const pscSupplier: emit.PolygenSrcCodeSupplier<PolygenContext> = {
      sourceCode: () => {
        return entitiesSrcCode.join("\n");
      },
    };
    return pscSupplier;
  }
}
