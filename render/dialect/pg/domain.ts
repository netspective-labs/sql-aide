import { zod as z } from "../../deps.ts";
import * as safety from "../../../lib/universal/safety.ts";
import { unindentWhitespace as uws } from "../../../lib/universal/whitespace.ts";
import * as tmpl from "../../emit/mod.ts";
import * as d from "../../domain/mod.ts";
import * as s from "../../ddl/schema.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export interface DomainDefinition<
  ZodType extends z.ZodTypeAny,
  DomainName extends string,
  Context extends tmpl.SqlEmitContext,
  DomainQS extends d.SqlDomainQS,
> extends
  tmpl.SqlTextSupplier<Context>,
  d.SqlDomain<ZodType, Context, DomainName, DomainQS> {
  readonly domainName: DomainName;
  readonly isIdempotent: boolean;
}

export interface DomainDefnOptions<
  DomainsIdentity extends string,
  Context extends tmpl.SqlEmitContext,
> {
  readonly isIdempotent?: boolean;
  readonly warnOnDuplicate?: (
    identifier: string,
    ctx: Context,
  ) => DomainsIdentity;
  readonly humanFriendlyFmtIndent?: string;
}

export function pgDomainsFactory<
  DomainsIdentity extends string,
  Context extends tmpl.SqlEmitContext,
  DomainQS extends d.SqlDomainQS,
  DomainsQS extends d.SqlDomainsQS<DomainsQS>,
>() {
  const df = d.sqlDomainsFactory();

  function isDomainDefinition<
    ZodType extends z.ZodTypeAny,
    DomainName extends DomainsIdentity,
  >(
    o: unknown,
  ): o is DomainDefinition<ZodType, DomainName, Context, DomainQS> {
    const isSD = safety.typeGuard<
      DomainDefinition<ZodType, DomainName, Context, DomainQS>
    >(
      "domainName",
      "SQL",
    );
    return df.anySDF.isSqlDomain(o) && isSD(o);
  }

  const pgDomainRef = <
    SchemaName extends string,
    Target extends string,
  >(
    schema: s.SchemaDefinition<SchemaName, Context>,
    identity: Target,
  ) => {
    const result: d.SqlDomain<Any, Context, Target, DomainQS> = {
      isSqlDomain: true as true, // must not be a boolean but `true`
      identity,
      isNullable: () => false,
      sqlSymbol: (ctx) =>
        ctx.sqlNamingStrategy(ctx, { quoteIdentifiers: true, qnss: schema })
          .domainName(identity),
      sqlDataType: () => ({
        SQL: (ctx) => {
          return ctx.sqlNamingStrategy(ctx, {
            quoteIdentifiers: true,
            qnss: schema,
          }).domainName(identity);
        },
      }),
      polygenixDataType: () => ((ctx) => {
        return ctx.sqlNamingStrategy(ctx, {
          quoteIdentifiers: true,
          qnss: schema,
        }).domainName(identity);
      }),
    };
    return result;
  };

  const pgDomainDefn = <
    ZodType extends z.ZodTypeAny,
    DomainName extends DomainsIdentity,
  >(
    dd: d.SqlDomain<ZodType, Context, DomainName, DomainQS>,
    domainName: DomainName,
    ddOptions?:
      & DomainDefnOptions<DomainName, Context>
      & { nsOptions?: tmpl.SqlObjectNamingStrategyOptions },
  ) => {
    const { isIdempotent = false, humanFriendlyFmtIndent: hffi } = ddOptions ??
      {};
    const result:
      & tmpl.SqlTextLintIssuesPopulator<Context>
      & tmpl.SqlTextSupplier<Context> = {
        populateSqlTextLintIssues: () => {},
        SQL: (ctx) => {
          const identifier = ctx.sqlNamingStrategy(ctx, ddOptions?.nsOptions)
            .domainName(domainName);
          const asType = dd.sqlDataType("PostgreSQL domain").SQL(ctx);
          if (isIdempotent) {
            if (ddOptions?.warnOnDuplicate) {
              const [_, quotedWarning] = ctx.sqlTextEmitOptions.quotedLiteral(
                ddOptions.warnOnDuplicate(identifier, ctx),
              );
              return hffi
                ? uws(`
                  BEGIN
                  ${hffi}CREATE DOMAIN ${identifier} AS ${asType};
                  EXCEPTION
                  ${hffi}WHEN DUPLICATE_OBJECT THEN
                  ${hffi}${hffi}RAISE NOTICE ${quotedWarning};
                  END`)
                : `BEGIN CREATE DOMAIN ${identifier} AS ${asType}; EXCEPTION WHEN DUPLICATE_OBJECT THEN RAISE NOTICE ${quotedWarning}; END`;
            } else {
              return hffi
                ? uws(`
                  BEGIN
                  ${hffi}CREATE DOMAIN ${identifier} AS ${asType};
                  EXCEPTION
                  ${hffi}WHEN DUPLICATE_OBJECT THEN -- ignore error without warning
                  END`)
                : `BEGIN CREATE DOMAIN ${identifier} AS ${asType}; EXCEPTION WHEN DUPLICATE_OBJECT THEN /* ignore error without warning */ END`;
            }
          } else {
            return `CREATE DOMAIN ${identifier} AS ${asType}`;
          }
        },
      };

    return {
      ...dd,
      identity: domainName, // this overrides dd.identity
      sqlSymbol: (ctx: Context | tmpl.SqlNamingStrategySupplier) => {
        return ctx.sqlNamingStrategy(ctx, ddOptions?.nsOptions).domainName(
          domainName,
        );
      }, // this overrides dd.sqlSymbol
      isValid: true,
      domainName: domainName,
      isIdempotent,
      ...result,
    };
  };

  const serial = () => {
    const zodType = z.number();
    const sd = df.numberSDF.integer<z.ZodNumber, Any>(zodType);
    return df.zodTypeBaggageProxy<z.ZodNumber>(zodType, sd) as unknown as
      & z.ZodNumber
      & { sqlDomain: typeof sd };
  };

  const serialNullable = () => {
    const zodType = z.number().optional();
    const sd = df.numberSDF.integerNullable<z.ZodOptional<z.ZodNumber>, Any>(
      zodType,
    );
    return df.zodTypeBaggageProxy<z.ZodOptional<z.ZodNumber>>(
      zodType,
      sd,
    ) as unknown as z.ZodNumber & { sqlDomain: typeof sd };
  };

  return {
    ...df,
    pgDomainDefn,
    isDomainDefinition,
    serial,
    serialNullable,
    pgDomainRef,
  };
}
