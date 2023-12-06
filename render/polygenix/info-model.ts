import * as d from "../domain/mod.ts";
import * as g from "../graph.ts";
import * as emit from "../emit/mod.ts";
import { PolygenEngine } from "./engine.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export interface PolygenInfoModelOptions<
  Context extends emit.SqlEmitContext,
  DomainQS extends d.SqlDomainQS,
  DomainsQS extends d.SqlDomainsQS<DomainQS>,
> {
  readonly includeEntityAttr: (
    ea: g.GraphEntityAttrReference<
      Any,
      Any,
      Context,
      DomainQS,
      DomainsQS
    >,
  ) => boolean;
  readonly includeEntity: (
    e: g.GraphEntityDefinition<Any, Context, Any, DomainQS, DomainsQS>,
  ) => boolean;
  readonly includeRelationship: (
    edge: g.GraphEdge<Context, Any, Any>,
  ) => boolean;
  readonly includeChildren: (
    ir: g.EntityGraphInboundRelationship<
      Any,
      Any,
      Context,
      DomainQS,
      DomainsQS
    >,
  ) => boolean;
}

export function typicalPolygenInfoModelOptions<
  Context extends emit.SqlEmitContext,
  DomainQS extends d.SqlDomainQS,
  DomainsQS extends d.SqlDomainsQS<DomainQS>,
>(
  inherit?: Partial<
    PolygenInfoModelOptions<Context, DomainQS, DomainsQS>
  >,
): PolygenInfoModelOptions<Context, DomainQS, DomainsQS> {
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
  Entity extends g.GraphEntityDefinition<
    Any,
    Context,
    Any,
    DomainQS,
    DomainsQS
  >,
  Context extends emit.SqlEmitContext,
  DomainQS extends d.SqlDomainQS,
  DomainsQS extends d.SqlDomainsQS<DomainQS>,
> extends emit.PolygenNotebook<Context> {
  constructor(
    readonly engine: PolygenEngine<
      Context,
      DomainQS,
      DomainsQS
    >,
    readonly sqlCtx: Context,
    readonly entityDefns: (ctx: Context) => Generator<Entity>,
    readonly polygenSchemaOptions: PolygenInfoModelOptions<
      Context,
      DomainQS,
      DomainsQS
    >,
  ) {
    super();
  }

  async entitiesSrcCode() {
    const graph = g.entitiesGraph(this.sqlCtx, this.entityDefns);

    const entitiesSrcCode: string[] = [];
    for (const entity of graph.entities) {
      if (!this.polygenSchemaOptions.includeEntity(entity)) {
        continue;
      }

      const sc = this.engine.entitySrcCode(entity);
      entitiesSrcCode.push(await emit.sourceCodeText(this.sqlCtx, sc));
    }

    const pscSupplier: emit.PolygenSrcCodeSupplier<Context> = {
      sourceCode: () => {
        return entitiesSrcCode.join("\n");
      },
    };
    return pscSupplier;
  }
}
