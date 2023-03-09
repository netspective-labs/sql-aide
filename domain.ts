import { zod as z } from "./deps.ts";
import * as tmpl from "./sql.ts";
import * as l from "./lint.ts";

// deno-lint-ignore no-explicit-any
type Any = any; // make it easy on linter

/**
 * A `domain` is an Zod scalar schema valuable for many use cases:
 * - defining a column of a table that may generate create table DDL
 * - defining a column in a select clause
 * - defining a column of a view that may generate create view DDL
 * - defining an argument of a stored function or procedure
 *
 * A domain should be a simple JS/TS object that has no other relationships or
 * dependencies (see 'domains' below for relationships). Domains are effective
 * when they remain type-safe through Zod and should be composable through
 * simple functions and spread operators. This allows, e.g., a column defined
 * for a "create table" DDL defintion to be used as an argument definition for
 * a stored function and vice-versa. Favoring composability over inheritance
 * is the reason why a data definition domain remains a simple JS object
 * instead of a class.
 *
 * A `domains` object groups multiple domains and treats them as a collection.
 * Domains are abstract types valuable for these use cases:
 * - defining a list of columns in a table for DDL
 * - defining a list of select clause columns in SQL statement
 * - defining a list of arguments for a stored function
 */

export type SqlDomain<
  ZTA extends z.ZodTypeAny,
  Context extends tmpl.SqlEmitContext,
  DomainIdentity extends string = string,
> = tmpl.SqlSymbolSupplier<Context> & {
  readonly isSqlDomain: true;
  readonly zodSchema: ZTA;
  readonly identity: DomainIdentity;
  readonly isOptional?: boolean;
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
  readonly reference: (
    options?: { readonly foreignIdentity?: string },
  ) => Omit<SqlDomain<ZTA, Context>, "reference">;
  readonly referenceSD: (inherit?: {
    readonly identity?: string;
  }) => SqlDomain<ZTA, Context>;
  readonly referenceNullableSD: (inherit?: {
    readonly identity?: string;
  }) => SqlDomain<ZTA, Context>;
};

export function isSqlDomain<Context extends tmpl.SqlEmitContext>(
  o: unknown,
): o is SqlDomain<Any, Context> {
  if (!o || typeof o !== "object") return false;
  if ("isSqlDomain" in o && "sqlDataType" in o) return true;
  return false;
}

export type MutatableSqlDomainSupplier<
  ZTA extends z.ZodTypeAny,
  Context extends tmpl.SqlEmitContext,
  DomainIdentity extends string = string,
> = {
  sqlDomain: SqlDomain<ZTA, Context, DomainIdentity>;
};

export function mutateSqlDomainSupplier<
  ZTA extends z.ZodTypeAny,
  Context extends tmpl.SqlEmitContext,
  DomainIdentity extends string = string,
>(mutate: ZTA, sqlDomain: SqlDomain<ZTA, Context, DomainIdentity>) {
  // TODO: will this be a memory leak because ZTA has sqlDomain
  //       and sqlDomain has zodSchema (circular reference?)
  (mutate as unknown as MutatableSqlDomainSupplier<
    ZTA,
    Context,
    DomainIdentity
  >).sqlDomain = sqlDomain;
  return mutate;
}

export type SqlDomainSupplier<
  ZTA extends z.ZodTypeAny,
  Context extends tmpl.SqlEmitContext,
  DomainIdentity extends string = string,
> = Readonly<MutatableSqlDomainSupplier<ZTA, Context, DomainIdentity>>;

export function isSqlDomainSupplier<
  ZTA extends z.ZodTypeAny,
  Context extends tmpl.SqlEmitContext,
  DomainIdentity extends string = string,
>(
  o: unknown,
): o is SqlDomainSupplier<ZTA, Context, DomainIdentity> {
  if (!o || typeof o !== "object") return false;
  if ("sqlDomain" in o && isSqlDomain(o)) return true;
  return false;
}

export type SqlDomains<
  ZodRawShape extends z.ZodRawShape,
  Context extends tmpl.SqlEmitContext,
> = {
  [Property in keyof ZodRawShape]: SqlDomain<
    ZodRawShape[Property] extends z.ZodType<infer T, infer D, infer I>
      ? z.ZodType<T, D, I>
      : never,
    Context
  >;
};

export interface SqlDomainsSupplier<Context extends tmpl.SqlEmitContext> {
  readonly domains: SqlDomain<z.ZodTypeAny, Context>[];
}

export function isSqlDomainsSupplier<Context extends tmpl.SqlEmitContext>(
  o: unknown,
): o is SqlDomainsSupplier<Context> {
  if (!o || typeof o !== "object") return false;
  if ("domains" in o) return true;
  return false;
}

export const SQL_DOMAIN_NOT_IN_COLLECTION =
  "SQL_DOMAIN_NOT_IN_COLLECTION" as const;

export const sqlDomain = <
  ZTA extends z.ZodTypeAny,
  Context extends tmpl.SqlEmitContext,
  DomainIdentity extends string = string,
>(zta: ZTA, init?: {
  readonly identity?: DomainIdentity;
  readonly isOptional?: boolean;
}): SqlDomain<ZTA, Context> => {
  if (isSqlDomainSupplier<ZTA, Context>(zta)) {
    // TODO: will this be a memory leak because ZTA has sqlDomain?
    return zta.sqlDomain;
  }

  const lintIssues: l.SqlLintIssueSupplier[] = [];
  const referenceSD = (inherit?: {
    readonly identity?: string | undefined;
  }) =>
    sqlDomain(zta, {
      identity: inherit?.identity ?? init?.identity ??
        SQL_DOMAIN_NOT_IN_COLLECTION,
    });
  const referenceNullableSD = (inherit?: {
    readonly identity?: string | undefined;
  }) =>
    sqlDomain(zta, {
      identity: inherit?.identity ?? init?.identity ??
        SQL_DOMAIN_NOT_IN_COLLECTION,
      isOptional: true,
    });

  const defaults = {
    isSqlDomain: true as true, // must not be a boolean but `true`
    zodSchema: zta,
    identity: init?.identity as DomainIdentity ?? SQL_DOMAIN_NOT_IN_COLLECTION,
    sqlSymbol: (ctx: Context) =>
      ctx.sqlNamingStrategy(ctx, { quoteIdentifiers: true }).domainName(
        init?.identity ?? SQL_DOMAIN_NOT_IN_COLLECTION,
      ),
    reference: (rOptions?: { readonly foreignIdentity?: string }) => {
      return referenceSD({
        identity: rOptions?.foreignIdentity,
      });
    },
    referenceSD,
    referenceNullableSD,
    lintIssues,
    registerLintIssue: (...slis: l.SqlLintIssueSupplier[]) => {
      lintIssues.push(...slis);
    },
  };

  const zodDef = zta._def;
  switch (zodDef.typeName) {
    case z.ZodFirstPartyTypeKind.ZodOptional: {
      return sqlDomain<ZTA, Context>(
        zta._def.innerType,
        init
          ? {
            ...init,
            isOptional: true,
          }
          : { isOptional: true },
      );
    }

    case z.ZodFirstPartyTypeKind.ZodString: {
      return {
        ...defaults,
        sqlDataType: () => ({ SQL: () => `TEXT` }),
      };
    }

    case z.ZodFirstPartyTypeKind.ZodNumber: {
      return {
        ...defaults,
        sqlDataType: () => ({ SQL: () => `INTEGER` }),
      };
    }

    default:
      throw new Error(
        `Unable to map Zod type ${zodDef.typeName} to SQL domain`,
      );
  }
};

export function sqlDomains<
  ZodRawShape extends z.ZodRawShape,
  Context extends tmpl.SqlEmitContext,
>(
  zodRawShape: ZodRawShape,
) {
  const sdSchema: SqlDomains<ZodRawShape, Context> = {} as Any;
  const domains: SqlDomain<z.ZodTypeAny, Context>[] = [];
  const zSchema = z.object(zodRawShape).strict();
  const { shape, keys: shapeKeys } = zSchema._getCached();
  for (const key of shapeKeys) {
    const member = shape[key];
    const sd = sqlDomain(member, { identity: key });
    (sdSchema[key] as Any) = sd;
    domains.push(sd);
  }

  // we let Typescript infer function return to allow generics to be more
  // easily passed to consumers (if we typed it to an interface we'd limit
  // the type-safety)
  // ESSENTIAL: be sure it adheres to SqlDomainsSupplier contract
  const lintIssues: l.SqlLintIssueSupplier[] = [];
  return {
    zSchema,
    sdSchema,
    domains,
    lintIssues,
    registerLintIssue: (...slis: l.SqlLintIssueSupplier[]) => {
      lintIssues.push(...slis);
    },
  };
}

/**
 * Transform a Zod schema with "methods", basically functions attached to the
 * parsed result that make it convenient to enhanced the parsed object. The idea
 * came from github.com/alii/azs.
 * @param schema the original Zod schema we're proxying
 * @param methods the list of functions we want to attach to the parsed schema
 * @returns new Zod schema with automatic transformation
 */
export function zodSchemaProxy<
  Proxy,
  ZodTypeDef extends z.ZodTypeDef,
  In,
  Methods extends Record<
    string,
    (this: Proxy, value: Proxy, ...args: Any[]) => Any
  >,
>(
  schema: z.Schema<Proxy, ZodTypeDef, In>,
  methods: Methods,
) {
  type DropFirstTuple<T extends Any[]> = T extends [Any, ...infer R] ? R
    : never;

  return schema.transform((value) => {
    // @ts-expect-error Keys are passed in the next lines
    const proxy: {
      [Key in keyof Methods]: (
        ...args: DropFirstTuple<Parameters<Methods[Key]>>
      ) => ReturnType<Methods[Key]>;
    } = {};

    for (const prop in methods) {
      if (!(prop in methods)) {
        continue;
      }
      proxy[prop] = (...args) =>
        methods[prop].call(value, value, ...args) as ReturnType<
          Methods[keyof Methods]
        >;
    }

    return {
      ...value,
      ...proxy,
    };
  });
}
