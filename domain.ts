import { zod as z } from "./deps.ts";
import * as tmpl from "./sql.ts";
import * as l from "./lint.ts";

// TODO:
// - consider creating new, native, Zod instances instead of wrapping Zod
//   https://github.com/jaylmiller/zodsql/blob/main/src/column.ts
// - consider monkey-patching Zod instances
//   https://github.com/IvanovES/zod-metadata/blob/main/src/index.ts

// deno-lint-ignore no-explicit-any
type Any = any; // make it easy on linter

export type ReferenceSource = {
  readonly isReferenceSource: true;
  readonly incomingRefs: Set<ReferenceDestination>;
};

export type ReferenceDestination = {
  readonly isReferenceDestination: true;
};

export function referencedSource<Original extends z.ZodTypeAny>(
  original: Original,
): [Original, ReferenceSource] {
  const clone = (zta: Original): Original => {
    const zodTypeName = zta._def.typeName;
    switch (zodTypeName) {
      case z.ZodFirstPartyTypeKind.ZodOptional:
      case z.ZodFirstPartyTypeKind.ZodDefault: {
        return clone(zta._def.innerType);
      }

      case z.ZodFirstPartyTypeKind.ZodString: {
        return z.string({ ...zta._def }) as unknown as Original;
      }

      case z.ZodFirstPartyTypeKind.ZodNumber: {
        return z.number({ ...zta._def }) as unknown as Original;
      }

      default:
        throw new Error(
          `Unable to map Zod type ${zodTypeName} in referenceSource(src).duplicate(zta)`,
        );
    }
  };

  const cloned = clone(original);
  const refDest = cloned as unknown as ReferenceDestination;
  ((refDest.isReferenceDestination) as Any) = true;

  const refSrc = original as unknown as ReferenceSource;
  ((refSrc.isReferenceSource) as Any) = true;
  let incomingRefs = refSrc.incomingRefs;
  if (!incomingRefs) {
    incomingRefs = new Set<ReferenceDestination>();
    ((refSrc.incomingRefs) as Any) = incomingRefs;
  }
  incomingRefs.add(refDest);
  return [cloned, refSrc];
}

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
  readonly identity: DomainIdentity;
  readonly isNullable?: boolean;
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

/**
 * Wrap a native Zod type's _def instance to hold our custom SqlDomain props
 * in a single object and then just return the zod schema so it can be used
 * as-is by any Zod consumers. We do this "patching" because it allows any
 * Zod type to be used in Typescript with a strongly-typed SqlDomain.
 * @param zodSchema the Zod scalar we want to wrap
 * @param sqlDomain the extra SQL domain properties we want to store
 * @returns the zodSchema instance passed-in with _def.sqlDomain mutated
 */
export function zodTypeSqlDomain<
  ZodIn extends z.ZodTypeAny,
  SqlDomainOut extends SqlDomain<ZodIn, Context, DomainIdentity>,
  Context extends tmpl.SqlEmitContext,
  DomainIdentity extends string = string,
>(zodSchema: ZodIn, sqlDomain: SqlDomain<ZodIn, Context, DomainIdentity>) {
  (zodSchema._def as unknown as MutatableSqlDomainSupplier<
    ZodIn,
    Context,
    DomainIdentity
  >).sqlDomain = sqlDomain;
  // after this point, isSqlDomainSupplier(zodSchema) will return true
  // and sqlDomain() will use that to find its SqlDomain properties.
  return zodSchema as ZodIn & SqlDomainOut;
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
  if ("sqlDomain" in o && isSqlDomain(o.sqlDomain)) return true;
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

export const SQL_DOMAIN_HAS_NO_IDENTITY_FROM_SHAPE =
  "SQL_DOMAIN_HAS_NO_IDENTITY_FROM_SHAPE" as const;

// DELETE_ME: more help available at:
// - https://github.com/github.com/RobinTail/express-zod-api/blob/main/src/metadata.ts
// - https://github.com/github.com/anfivewer/an5wer/blob/main/packages/util-react/src/mst/zod/zod-to-mst.ts
// - https://github.com/sachinraja/zod-to-ts/blob/main/src/index.ts
// - https://github.com/drizzle-team/drizzle-orm/blob/main/drizzle-zod/src/pg/index.ts

export const sqlDomain = <
  ZTA extends z.ZodTypeAny,
  Context extends tmpl.SqlEmitContext,
  DomainIdentity extends string = string,
>(zta: ZTA, init?: {
  readonly identity?: DomainIdentity;
  readonly isNullable?: boolean;
}): SqlDomain<ZTA, Context> => {
  if (isSqlDomainSupplier<ZTA, Context>(zta._def)) {
    // this means is custom prepared SqlDomain instance attached to a ZTA so
    // we're just going to rename it and use it as-is
    if (zta._def.sqlDomain.identity && SQL_DOMAIN_NOT_IN_COLLECTION) {
      (zta._def.sqlDomain.identity as string) = init?.identity ??
        SQL_DOMAIN_HAS_NO_IDENTITY_FROM_SHAPE;
    }
    return zta._def.sqlDomain;
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
      isNullable: true,
    });

  const defaults = {
    isSqlDomain: true as true, // must not be a boolean but `true`
    isNullable: zta.isOptional(),
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
    case z.ZodFirstPartyTypeKind.ZodOptional:
    case z.ZodFirstPartyTypeKind.ZodDefault: {
      return sqlDomain<ZTA, Context>(
        zta._def.innerType,
        init
          ? {
            ...init,
            isNullable: true,
          }
          : { isNullable: true },
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

  // we use this if we want to make a copy of a type (like foreign key ref);
  // we track all references/referenced (TODO: will this be a memory leak due
  // to circular references?); each copy will "deoptionalize" meaning it's
  // going to not be optional as a reference even if it's optional in the src
  type Referencables = {
    [Property in keyof ZodRawShape]: () => ZodRawShape[Property] extends
      z.ZodOptionalType<Any>
      ? z.deoptional<ZodRawShape[Property]> & ReferenceDestination
      : (ZodRawShape[Property] extends z.ZodType<infer T, infer D, infer I>
        ? z.ZodType<T, D, I> & ReferenceDestination
        : never);
  };
  const referencables: Referencables = {} as Any;
  const referenced = new Set<ReferenceSource>();
  for (const key of shapeKeys) {
    (referencables[key] as Any) = () => {
      // expensive but easiest approach -- let Zod make a "copy" for us
      const [newInstance, rd] = referencedSource(zSchema.shape[key as Any]);
      referenced.add(rd);
      return newInstance;
    };
  }

  // we let Typescript infer function return to allow generics to be more
  // easily passed to consumers (if we typed it to an interface we'd limit
  // the type-safety)
  // ESSENTIAL: be sure it adheres to SqlDomainsSupplier contract
  const lintIssues: l.SqlLintIssueSupplier[] = [];
  return {
    zSchema,
    referencables,
    referenced,
    sdSchema,
    domains,
    lintIssues,
    registerLintIssue: (...slis: l.SqlLintIssueSupplier[]) => {
      lintIssues.push(...slis);
    },
  };
}

export function domainLintIssue(
  lintIssue: string,
  options?: Partial<Omit<l.SqlLintIssueSupplier, "lintIssue">>,
): l.SqlLintIssueSupplier {
  const { location, consequence } = options ?? {};
  return {
    lintIssue,
    location: location
      ? (typeof location === "string"
        ? ((options) =>
          options?.maxLength ? location!.slice(0, options.maxLength) : location)
        : location)
      : undefined,
    consequence,
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
