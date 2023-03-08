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

export type DomainsMemberIdentity = string;

export type SqlDomain<
  ZTA extends z.ZodTypeAny,
  Context extends tmpl.SqlEmitContext,
> = tmpl.SqlSymbolSupplier<Context> & {
  readonly isSqlDomain: true;
  readonly zodSchema: ZTA;
  readonly identity: DomainsMemberIdentity;
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
  readonly reference: <ForeignIdentity extends string>(
    options?: { readonly foreignIdentity?: ForeignIdentity },
  ) => Omit<SqlDomain<ZTA, Context>, "reference">;
  readonly referenceSD: (inherit: {
    readonly identity: DomainsMemberIdentity;
  }) => SqlDomain<ZTA, Context>;
};

export function isSqlDomain<Context extends tmpl.SqlEmitContext>(
  o: unknown,
): o is SqlDomain<Any, Context> {
  if (!o || typeof o !== "object") return false;
  if ("isSqlDomain" in o && "sqlDataType" in o) return true;
  return false;
}

export interface SqlDomainsSupplier<
  Context extends tmpl.SqlEmitContext,
  ZTA extends z.ZodTypeAny = z.ZodTypeAny,
> {
  domains: SqlDomain<ZTA, Context>[];
}

export function isSqlDomainsSupplier<
  Context extends tmpl.SqlEmitContext,
  ZTA extends z.ZodTypeAny = z.ZodTypeAny,
>(o: unknown): o is SqlDomainsSupplier<Context, ZTA> {
  if (!o || typeof o !== "object") return false;
  if ("domains" in o) return true;
  return false;
}

export const sqlDomain = <
  ZTA extends z.ZodTypeAny,
  Context extends tmpl.SqlEmitContext,
>(zta: ZTA, init: {
  readonly identity: DomainsMemberIdentity;
  readonly isOptional?: boolean;
}): SqlDomain<ZTA, Context> => {
  const lintIssues: l.SqlLintIssueSupplier[] = [];
  const referenceSD = (inherit?: {
    readonly identity?: DomainsMemberIdentity | undefined;
  }) =>
    sqlDomain(zta, {
      identity: inherit?.identity ?? init.identity,
    });
  const defaults = {
    isSqlDomain: true as true, // must not be a boolean but `true`
    zodSchema: zta,
    identity: init.identity,
    sqlSymbol: (ctx: Context) =>
      ctx.sqlNamingStrategy(ctx, { quoteIdentifiers: true }).domainName(
        init.identity,
      ),
    reference: (rOptions?: { readonly foreignIdentity?: string }) => {
      return referenceSD({ identity: rOptions?.foreignIdentity });
    },
    referenceSD,
    lintIssues,
    registerLintIssue: (...slis: l.SqlLintIssueSupplier[]) => {
      lintIssues.push(...slis);
    },
  };

  const zodDef = zta._def;
  switch (zodDef.typeName) {
    case z.ZodFirstPartyTypeKind.ZodOptional: {
      return sqlDomain<ZTA, Context>(zta._def.innerType, {
        ...init,
        isOptional: true,
      });
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
  ZRT extends z.ZodRawShape,
  Context extends tmpl.SqlEmitContext,
>(
  zodRawShape: ZRT,
) {
  const domains: SqlDomain<z.ZodTypeAny, Context>[] = [];
  const schema = z.object(zodRawShape).strict();
  const { shape, keys: shapeKeys } = schema._getCached();
  for (const key of shapeKeys) {
    const member = shape[key];
    domains.push(sqlDomain(member, { identity: key }));
  }

  // we let Typescript infer function return to allow generics to be more
  // easily passed to consumers (if we typed it to an interface we'd limit
  // the type-safety)
  // ESSENTIAL: be sure it adheres to SqlDomainsSupplier contract
  const lintIssues: l.SqlLintIssueSupplier[] = [];
  return {
    isSqlDomains: true as true,
    schema,
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
