import * as d from "../domain/mod.ts";
import * as g from "../graph.ts";
import * as emit from "../emit/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export interface PolygenEngine<
  PolygenContext extends emit.PolygenEmitContext,
  SqlContext extends emit.SqlEmitContext,
  DomainQS extends d.SqlDomainQS,
  DomainsQS extends d.SqlDomainsQS<DomainQS>,
> {
  readonly polygenEmitCtx: () => PolygenContext;
  readonly entityAttrSrcCode: (
    ea: g.GraphEntityAttrReference<
      Any,
      Any,
      SqlContext,
      DomainQS,
      DomainsQS
    >,
  ) => emit.PolygenSrcCode<PolygenContext>;
  readonly entitySrcCode: (
    e: g.GraphEntityDefinition<Any, SqlContext, Any, DomainQS, DomainsQS>,
  ) => emit.PolygenSrcCode<PolygenContext>;
}
