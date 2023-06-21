import { govnPattern as gp, pgSQLa, SQLa, zod as z } from "./deps.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export class PgDcpKeys<
  Domain extends gp.GovernedDomain,
  Domains extends gp.GovernedDomains<Domain, Context>,
  Context extends gp.GovernedEmitContext,
> extends gp.GovernedKeys<Domain, Domains, Context> {
  constructor(
    readonly domains: Domains,
    readonly pgPkcf = pgSQLa.primaryKeyColumnFactory<Context>(),
  ) {
    super(domains, pgPkcf);
  }

  autoIncPrimaryKey() {
    return this.pgPkcf.serialPrimaryKey();
  }
}

export class PgDcpTemplateState<Context extends gp.GovernedEmitContext>
  extends gp.GovernedTemplateState<Context> {
  public context() {
    return {
      ...SQLa.typicalSqlEmitContext({
        sqlDialect: SQLa.postgreSqlDialect(),
      }),
    } as Context;
  }
}

export class PgDcpIM<
  Domain extends gp.GovernedDomain,
  Domains extends gp.GovernedDomains<Domain, Context>,
  Keys extends PgDcpKeys<Domain, Domains, Context>,
  HousekeepingShape extends z.ZodRawShape,
  TemplateState extends gp.GovernedTemplateState<Context>,
  Context extends gp.GovernedEmitContext,
> extends gp.GovernedIM<
  Domain,
  Domains,
  Keys,
  HousekeepingShape,
  TemplateState,
  Context
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
          Context
        >;
    },
    readonly templateState: TemplateState,
  ) {
    super(domains, keys, housekeeping, templateState);
  }

  static prime<
    Domain extends gp.GovernedDomain,
    Context extends gp.GovernedEmitContext,
  >(sqlNS?: SQLa.SqlNamespaceSupplier) {
    type Domains = gp.GovernedDomains<Domain, Context>;
    type Keys = PgDcpKeys<Domain, Domains, Context>;
    type HousekeepingShape = typeof housekeeping.columns;

    const gts = new gp.GovernedTemplateState<Context>(sqlNS);
    const domains = new gp.GovernedDomains<Domain, Context>();
    const housekeeping = gp.housekeepingMinimal<Domain, Domains, Context>(
      domains,
    );
    return new PgDcpIM<
      Domain,
      Domains,
      Keys,
      HousekeepingShape,
      typeof gts,
      Context
    >(
      domains,
      new PgDcpKeys(domains),
      gp.housekeepingMinimal<Domain, Domains, Context>(domains),
      gts,
    );
  }
}
