import * as d from "../domain/mod.ts";
import * as g from "../graph.ts";
import * as emit from "../emit/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export interface PolygenEngine<
  Context extends emit.SqlEmitContext,
  DomainQS extends d.SqlDomainQS,
  DomainsQS extends d.SqlDomainsQS<DomainQS>,
> {
  readonly entityAttrSrcCode: (
    ea: g.GraphEntityAttrReference<
      Any,
      Any,
      Context,
      DomainQS,
      DomainsQS
    >,
  ) => emit.PolygenSrcCode<Context>;
  readonly entitySrcCode: (
    e: g.GraphEntityDefinition<Any, Context, Any, DomainQS, DomainsQS>,
  ) => emit.PolygenSrcCode<Context>;
}
