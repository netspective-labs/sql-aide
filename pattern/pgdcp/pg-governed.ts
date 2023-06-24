import { govnPattern as gp, pgSQLa, SQLa, zod as z } from "./deps.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export type PgDcpDomainQS = gp.GovernedDomainQS;
export type PgDcpDomainsQS = SQLa.SqlDomainsQS<PgDcpDomainQS>;

export class PgDcpKeys<
  DomainQS extends PgDcpDomainQS,
  DomainsQS extends PgDcpDomainsQS,
  Domains extends gp.GovernedDomains<DomainQS, DomainsQS, Context>,
  Context extends gp.GovernedEmitContext,
> extends gp.GovernedKeys<Domains, Context, DomainQS, DomainsQS> {
  constructor(
    readonly domains: Domains,
    readonly pgPkcf = pgSQLa.primaryKeyColumnFactory<Context, DomainQS>(),
  ) {
    super(domains, pgPkcf);
  }

  autoIncPrimaryKey() {
    return this.pgPkcf.serialPrimaryKey();
  }
}

export class PgDcpTemplateState<
  Context extends gp.GovernedEmitContext,
  DomainQS extends PgDcpDomainQS,
> extends gp.GovernedTemplateState<Context, DomainQS> {
  public context() {
    return {
      ...SQLa.typicalSqlEmitContext({
        sqlDialect: SQLa.postgreSqlDialect(),
      }),
    } as Context;
  }
}

export class PgDcpIM<
  DomainQS extends PgDcpDomainQS,
  DomainsQS extends PgDcpDomainsQS,
  Domains extends gp.GovernedDomains<DomainQS, DomainsQS, Context>,
  Keys extends PgDcpKeys<DomainQS, DomainsQS, Domains, Context>,
  HousekeepingShape extends z.ZodRawShape,
  TemplateState extends gp.GovernedTemplateState<Context, DomainQS>,
  Context extends gp.GovernedEmitContext,
> extends gp.GovernedIM<
  Domains,
  Keys,
  HousekeepingShape,
  TemplateState,
  Context,
  DomainQS,
  DomainsQS
> {
  constructor(
    readonly domains: Domains,
    readonly keys: Keys,
    readonly housekeeping: {
      readonly columns: HousekeepingShape;
      readonly insertStmtPrepOptions: <TableName extends string>() =>
        SQLa.InsertStmtPreparerOptions<
          TableName,
          Any,
          Any,
          Context,
          DomainQS
        >;
    },
    readonly templateState: TemplateState,
  ) {
    super(domains, keys, housekeeping, templateState);
  }

  static prime<
    DomainQS extends PgDcpDomainQS,
    DomainsQS extends PgDcpDomainsQS,
    Context extends gp.GovernedEmitContext,
  >(sqlNS?: SQLa.SqlNamespaceSupplier) {
    type Domains = gp.GovernedDomains<DomainQS, DomainsQS, Context>;
    type Keys = PgDcpKeys<DomainQS, DomainsQS, Domains, Context>;
    type HousekeepingShape = typeof housekeeping.columns;

    const gts = new gp.GovernedTemplateState<Context, DomainQS>(sqlNS);
    const domains = new gp.GovernedDomains<DomainQS, DomainsQS, Context>();
    const housekeeping = gp.housekeepingMinimal<
      Domains,
      Context,
      DomainQS,
      DomainsQS
    >(
      domains,
    );
    return new PgDcpIM<
      DomainQS,
      DomainsQS,
      Domains,
      Keys,
      HousekeepingShape,
      typeof gts,
      Context
    >(
      domains,
      new PgDcpKeys(domains),
      gp.housekeepingMinimal<Domains, Context, DomainQS, DomainsQS>(
        domains,
      ),
      gts,
    );
  }
}
