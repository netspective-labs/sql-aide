import * as d from "../domain/mod.ts";
import * as g from "../graph.ts";
import * as emit from "../emit/mod.ts";

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
  readonly includeEntityAttrGenRemarks: (
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
    includeEntityAttrGenRemarks: () => true,
    includeRelationship: () => true,
    includeChildren: () => true,
    ...inherit,
  };
}
