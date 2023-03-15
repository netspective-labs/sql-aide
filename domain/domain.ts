import { zod as z } from "../deps.ts";
import * as tmpl from "../sql.ts";
import * as safety from "../safety.ts";
import * as l from "../lint.ts";

// deno-lint-ignore no-explicit-any
type Any = any; // make it easy on linter

export type SqlDomain<
  ZTA extends z.ZodTypeAny,
  Context extends tmpl.SqlEmitContext,
  DomainIdentity extends string,
> = tmpl.SqlSymbolSupplier<Context> & {
  readonly isSqlDomain: true;
  readonly identity: DomainIdentity;
  readonly isNullable: () => boolean;
  readonly sqlDataType: (
    purpose:
      | "create table column"
      | "stored routine arg"
      | "stored function returns scalar"
      | "stored function returns table column"
      | "type field"
      | "table foreign key ref"
      | "diagram"
      | "PostgreSQL domain",
  ) => tmpl.SqlTextSupplier<Context>;
  readonly sqlDefaultValue?: (
    purpose: "create table column" | "stored routine arg",
  ) => tmpl.SqlTextSupplier<Context>;
  readonly sqlDmlTransformInsertableValue?: (
    supplied: ZTA | undefined,
  ) => ZTA;
  readonly sqlPartial?: (
    destination:
      | "create table, full column defn"
      | "create table, column defn decorators"
      | "create table, after all column definitions",
  ) => tmpl.SqlTextSupplier<Context>[] | undefined;
};

export function zodTypeAnySqlDomainFactory<
  ZodType extends z.ZodTypeAny,
  DomainsIdentity extends string,
  Context extends tmpl.SqlEmitContext,
>() {
  const SQL_DOMAIN_NOT_IN_COLLECTION = "SQL_DOMAIN_NOT_IN_COLLECTION" as const;

  const isSqlDomain = safety.typeGuard<
    SqlDomain<ZodType, Context, DomainsIdentity>
  >("isSqlDomain", "sqlDataType");

  const isSqlDomainSupplier = safety.typeGuard<
    { readonly sqlDomain: SqlDomain<ZodType, Context, DomainsIdentity> }
  >("sqlDomain");

  const defaults = <Identity extends string>(
    zodType: ZodType,
    init?: {
      readonly identity?: Identity;
      readonly isOptional?: boolean;
      readonly parents?: z.ZodTypeAny[];
    },
  ) => {
    const lintIssues: l.SqlLintIssueSupplier[] = [];
    const defaults:
      & Pick<
        SqlDomain<Any, Context, Identity>,
        "identity" | "isSqlDomain" | "sqlSymbol" | "isNullable"
      >
      & l.SqlLintIssuesSupplier = {
        isSqlDomain: true as true, // must not be a boolean but `true`
        identity: (init?.identity ?? SQL_DOMAIN_NOT_IN_COLLECTION) as Identity,
        isNullable: () =>
          init?.isOptional || zodType.isOptional() || zodType.isNullable(),
        sqlSymbol: (ctx: Context) =>
          ctx.sqlNamingStrategy(ctx, { quoteIdentifiers: true }).domainName(
            init?.identity ?? SQL_DOMAIN_NOT_IN_COLLECTION,
          ),
        lintIssues,
        registerLintIssue: (...slis: l.SqlLintIssueSupplier[]) => {
          lintIssues.push(...slis);
        },
      };
    return defaults;
  };

  return {
    SQL_DOMAIN_NOT_IN_COLLECTION,
    isSqlDomain,
    isSqlDomainSupplier,
    defaults,
  };
}

export function zodStringSqlDomainFactory<
  ZodType extends z.ZodType<string, z.ZodStringDef>,
  DomainsIdentity extends string,
  Context extends tmpl.SqlEmitContext,
>() {
  const ztaSDF = zodTypeAnySqlDomainFactory<
    ZodType,
    DomainsIdentity,
    Context
  >();
  return {
    ...ztaSDF,
    string: <Identity extends string>(
      zodType: ZodType,
      init?: {
        readonly identity?: Identity;
        readonly isOptional?: boolean;
        readonly parents?: z.ZodTypeAny[];
      },
    ) => {
      return {
        ...ztaSDF.defaults<Identity>(zodType, init),
        sqlDataType: () => ({ SQL: () => `TEXT` }),
      };
    },
  };
}

export function zodNumberSqlDomainFactory<
  ZodType extends z.ZodType<number, z.ZodStringDef>,
  DomainsIdentity extends string,
  Context extends tmpl.SqlEmitContext,
>() {
  const ztaSDF = zodTypeAnySqlDomainFactory<
    ZodType,
    DomainsIdentity,
    Context
  >();
  return {
    ...ztaSDF,
    number: <Identity extends string>(
      zodType: ZodType,
      init?: {
        readonly identity?: Identity;
        readonly isOptional?: boolean;
        readonly parents?: z.ZodTypeAny[];
      },
    ) => {
      return {
        ...ztaSDF.defaults<Identity>(zodType, init),
        sqlDataType: () => ({ SQL: () => `INTEGER` }),
      };
    },
  };
}

export function zodTypeSqlDomainFactory<
  DomainsIdentity extends string,
  Context extends tmpl.SqlEmitContext,
>() {
  const anySDF = zodTypeAnySqlDomainFactory<Any, DomainsIdentity, Context>();
  const stringSDF = zodStringSqlDomainFactory<
    z.ZodType<string, z.ZodStringDef, string>,
    DomainsIdentity,
    Context
  >();
  const numberSDF = zodNumberSqlDomainFactory<
    z.ZodType<number, z.ZodStringDef, number>,
    DomainsIdentity,
    Context
  >();
  const coreSqlDomain = <Identity extends string, ZodType extends z.ZodTypeAny>(
    zodType: ZodType,
    init?: {
      readonly identity?: Identity;
      readonly isOptional?: boolean;
      readonly parents?: z.ZodTypeAny[];
    },
  ): SqlDomain<ZodType, Context, Identity> => {
    const zodDef = zodType._def;
    switch (zodDef.typeName) {
      case z.ZodFirstPartyTypeKind.ZodOptional: {
        return coreSqlDomain(zodType._def.innerType, {
          ...init,
          isOptional: true,
          parents: init?.parents ? [...init.parents, zodType] : [zodType],
        });
      }

      case z.ZodFirstPartyTypeKind.ZodDefault: {
        return coreSqlDomain(zodType._def.innerType, {
          ...init,
          parents: init?.parents ? [...init.parents, zodType] : [zodType],
        });
      }

      case z.ZodFirstPartyTypeKind.ZodString: {
        return stringSDF.string(zodType, init);
      }

      case z.ZodFirstPartyTypeKind.ZodNumber: {
        return numberSDF.number(zodType, init);
      }

      default:
        throw new Error(
          `Unable to map Zod type ${zodDef.typeName} to SQL domain`,
        );
    }
  };

  return {
    anySDF,
    stringSDF,
    numberSDF,
    coreSqlDomain,
  };
}
