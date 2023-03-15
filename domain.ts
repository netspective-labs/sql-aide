import { zod as z } from "./deps.ts";
import * as tmpl from "./sql.ts";
import * as safety from "./safety.ts";
import * as za from "./zod-aide.ts";
import * as l from "./lint.ts";

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

// MAINTENANCE:
// - when adding new ZodType instances you need to update two functions because
//   each introspects the type and wraps zodType._def in SQL-friendly props:
//   - za.clonedZodType(zodType)
//   - sqlDomain(zodType)

// TODO:
// - consider creating new, native, Zod instances instead of wrapping Zod
//   https://github.com/jaylmiller/zodsql/blob/main/src/column.ts
// - consider monkey-patching Zod instances
//   https://github.com/IvanovES/zod-metadata/blob/main/src/index.ts

// deno-lint-ignore no-explicit-any
type Any = any; // make it easy on linter

// this is just a "signature" type to make it easier to document purpose
export type SqlDomainZTE<
  ZTA extends z.ZodTypeAny,
  Context extends tmpl.SqlEmitContext,
  DomainIdentity extends string,
> = za.ZodEnrichment<ZTA, SqlDomain<ZTA, Context, DomainIdentity>>;

// "ZTE" means ZodType Enrichment
export const sqlDomainZTE = za.zodEnrichment<
  SqlDomain<Any, Any, Any>,
  { sqlDomain: SqlDomain<Any, Any, Any> }
>("sqlDomain");

export function nativeReferences<
  DomainsIdentity extends string,
  ZodRawShape extends z.ZodRawShape,
  Context extends tmpl.SqlEmitContext,
>(
  identity: DomainsIdentity,
  zSchema: z.ZodObject<ZodRawShape>,
  sdSchema: SqlDomains<ZodRawShape, Context>,
) {
  type ReferenceSource = {
    readonly identity: DomainsIdentity;
    readonly incomingRefs: Set<ReferenceDestination>;
    readonly register: (rd: ReferenceDestination) => ReferenceDestination;
  };

  type ReferenceDestination = {
    readonly refSource: ReferenceSource;
  };

  type RefSrcPlaceholderSupplier = {
    readonly nativeRefSrcPlaceholder: ReferenceSource;
  };

  const inferables = () => {
    // the "inferred types" are the same as their original types except without
    // optionals, defaults, or nulls (always required, considered the "CoreZTA");
    type InferReferences = {
      [Property in keyof ZodRawShape]: () => za.CoreZTA<ZodRawShape[Property]>;
    };

    const inferredPlaceholder = () => {
      const incomingRefs = new Set<ReferenceDestination>();
      const refSource: ReferenceSource = {
        identity,
        incomingRefs,
        register: (rd) => {
          incomingRefs.add(rd);
          return rd;
        },
      };
      return refSource;
    };

    const inferables: InferReferences = {} as Any;
    const { shape, keys: shapeKeys } = zSchema._getCached();
    for (const key of shapeKeys) {
      const zodType = shape[key];
      (inferables[key] as Any) = () => {
        // because zodSchema may have been cloned/copied from another sqlDomain we
        // want to forceCreate = true
        const placeholderDomain = sqlDomain<
          za.CoreZTA<typeof zodType>,
          Context,
          typeof key
        >(za.coreZTA(sqlDomainZTE.deenriched(zodType)));
        const nativeRefSrcPlaceholder = inferredPlaceholder();
        const nri:
          & SqlDomain<za.CoreZTA<typeof zodType>, Context, typeof key>
          & RefSrcPlaceholderSupplier = {
            nativeRefSrcPlaceholder, // <-- this is what allows isInferencePlaceholder() to pick up the placeholder
            ...placeholderDomain,
          };

        // trick Typescript into thinking the Zod instance is also a SqlDomain;
        // this allows assignment of a reference to a Zod object or use as a
        // regular Zod schema; the sqlDomain is carried in zodType._def
        return sqlDomainZTE.withEnrichment(zodType, () => nri);
      };
    }

    return inferables;
  };

  const references = () => {
    const isInferencePlaceholder = safety.typeGuard<RefSrcPlaceholderSupplier>(
      "nativeRefSrcPlaceholder",
    );

    type References = {
      [
        Property in keyof ZodRawShape as Extract<
          Property,
          ZodRawShape[Property] extends RefSrcPlaceholderSupplier ? Property
            : never
        >
      ]:
        & SqlDomain<ZodRawShape[Property], Context, Extract<Property, string>>
        & ReferenceDestination;
    };

    // see if any references were registered but need to be created
    const references: References = {} as Any;
    const { shape, keys: shapeKeys } = zSchema._getCached();
    for (const key of shapeKeys) {
      const domain = sdSchema[key];
      if (isInferencePlaceholder(domain)) {
        const reference: ReferenceDestination = {
          refSource: domain.nativeRefSrcPlaceholder,
        };
        const zodType = shape[key];
        const finalDomain = sqlDomain(zodType, { identity: key });
        (sdSchema[key] as Any) = {
          ...finalDomain,
          ...reference,
        };
        (references as Any)[key] = finalDomain;
      }
    }

    return references;
  };

  return {
    inferables,
    references,
  };
}

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

export function isSqlDomain<Context extends tmpl.SqlEmitContext>(
  o: unknown,
): o is SqlDomain<Any, Context, Any> {
  if (!o || typeof o !== "object") return false;
  if ("isSqlDomain" in o && "sqlDataType" in o) return true;
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
    Context,
    Any
  >;
};

export type SqlDomainsSupplier<Context extends tmpl.SqlEmitContext> = {
  readonly domains: SqlDomain<Any, Context, Any>[];
};

export const SQL_DOMAIN_NOT_IN_COLLECTION =
  "SQL_DOMAIN_NOT_IN_COLLECTION" as const;

export const SQL_DOMAIN_HAS_NO_IDENTITY_FROM_SHAPE =
  "SQL_DOMAIN_HAS_NO_IDENTITY_FROM_SHAPE" as const;

export const sqlDomain = <
  Origin extends z.ZodTypeAny,
  Context extends tmpl.SqlEmitContext,
  DomainIdentity extends string,
>(
  original: Origin,
  init?: {
    readonly identity?: DomainIdentity;
    readonly isNullable?: boolean;
    readonly forceCreate?: boolean;
  },
) => {
  if (!init?.forceCreate) {
    const existing = sqlDomainZTE.enrichment(original) as SqlDomain<
      Origin,
      Context,
      DomainIdentity
    >;
    if (existing) {
      // this means is custom prepared SqlDomain instance attached to a ZTA so
      // we're just going to rename it and use it as-is
      if (existing.identity && SQL_DOMAIN_NOT_IN_COLLECTION) {
        (existing.identity as string) = init?.identity ??
          SQL_DOMAIN_HAS_NO_IDENTITY_FROM_SHAPE;
      }
      return existing;
    }
  }

  const lintIssues: l.SqlLintIssueSupplier[] = [];
  const defaults = {
    isSqlDomain: true as true, // must not be a boolean but `true`
    isNullable: () =>
      init?.isNullable || original.isOptional() || original.isNullable(),
    identity:
      (init?.identity ?? SQL_DOMAIN_NOT_IN_COLLECTION) as DomainIdentity,
    sqlSymbol: (ctx: Context) =>
      ctx.sqlNamingStrategy(ctx, { quoteIdentifiers: true }).domainName(
        init?.identity ?? SQL_DOMAIN_NOT_IN_COLLECTION,
      ),
    lintIssues,
    registerLintIssue: (...slis: l.SqlLintIssueSupplier[]) => {
      lintIssues.push(...slis);
    },
  };

  const attach = (zta: Origin): SqlDomain<Origin, Context, DomainIdentity> => {
    // TODO: should this be replaced with sqlDomainZTE.withEnrichment()?
    const zodDef = zta._def;
    switch (zodDef.typeName) {
      case z.ZodFirstPartyTypeKind.ZodOptional:
      case z.ZodFirstPartyTypeKind.ZodDefault: {
        return attach(zta._def.innerType);
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

  return attach(original);
};

export let sqlDomainsIterationIndex = 0;

export function sqlDomains<
  ZodRawShape extends z.ZodRawShape,
  Context extends tmpl.SqlEmitContext,
  DomainsIdentity extends string,
>(
  zodRawShape: ZodRawShape,
  init?: {
    readonly identity?: (zo: z.ZodObject<ZodRawShape>) => DomainsIdentity;
  },
) {
  sqlDomainsIterationIndex++;
  const sdSchema: SqlDomains<ZodRawShape, Context> = {} as Any;
  const zSchema = z.object(zodRawShape).strict();
  const identity = init?.identity?.(zSchema) ??
    (`anonymous${sqlDomainsIterationIndex}` as DomainsIdentity);
  const { shape, keys: shapeKeys } = zSchema._getCached();
  for (const key of shapeKeys) {
    const member = shape[key];
    const sd = sqlDomain(member, { identity: key });
    (sdSchema[key] as Any) = sd;
  }

  // we let Typescript infer function return to allow generics to be more
  // easily passed to consumers (if we typed it to an interface we'd limit
  // the type-safety)
  // ESSENTIAL: be sure it adheres to SqlDomainsSupplier contract
  const lintIssues: l.SqlLintIssueSupplier[] = [];
  return {
    identity,
    zSchema,
    sdSchema,
    domains: () =>
      Array.from(Object.values(sdSchema)) as SqlDomain<
        Any,
        Context,
        Extract<keyof ZodRawShape, string>
      >[],
    lintIssues,
    registerLintIssue: (...slis: l.SqlLintIssueSupplier[]) => {
      lintIssues.push(...slis);
    },
  };
}

export function sqlReferencableDomains<
  ZodRawShape extends z.ZodRawShape,
  Context extends tmpl.SqlEmitContext,
  DomainsIdentity extends string,
>(
  zodRawShape: ZodRawShape,
  init?: {
    readonly identity?: (zo: z.ZodObject<ZodRawShape>) => DomainsIdentity;
  },
) {
  const common = sqlDomains<ZodRawShape, Context, DomainsIdentity>(
    zodRawShape,
    init,
  );

  // prepare all the typed references from given schema
  const refs = nativeReferences<DomainsIdentity, ZodRawShape, Context>(
    common.identity,
    common.zSchema,
    common.sdSchema,
  );

  // this will replace all reference'd placeholders as real domains
  const references = refs.references();

  // this will prepare all properties to allow them to be inferred as references
  const inferables = refs.inferables();

  return {
    ...common,
    infer: inferables,
    references,
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
