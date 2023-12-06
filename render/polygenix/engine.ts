import * as d from "../domain/mod.ts";
import * as g from "../graph.ts";
import * as emit from "../emit/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export interface PolygenTypeSupplier {
  readonly type: emit.PolygenSrcCodeText;
  readonly remarks?: string;
}

export interface PolygenEngineTypeStrategy {
  readonly type: (abstractType: string) => PolygenTypeSupplier;
}

export interface PolygenEngine<
  Context extends emit.SqlEmitContext,
  DomainQS extends d.SqlDomainQS,
  DomainsQS extends d.SqlDomainsQS<DomainQS>,
> {
  readonly typeStrategy: () => PolygenEngineTypeStrategy;
  readonly entityAttrSrcCode: (
    ea: g.GraphEntityAttrReference<
      Any,
      Any,
      Context,
      DomainQS,
      DomainsQS
    >,
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
  ) => emit.PolygenSrcCodeSync<Context> | Promise<emit.PolygenSrcCode<Context>>;
  readonly entitySrcCode: (
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
  ) => emit.PolygenSrcCodeSync<Context> | Promise<emit.PolygenSrcCode<Context>>;
}
