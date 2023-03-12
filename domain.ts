import { zod as z } from "./deps.ts";
import * as tmpl from "./sql.ts";
import * as l from "./lint.ts";
import * as safety from "./safety.ts";

// MAINTENANCE:
// - when adding new ZodType instances you need to update two functions because
//   each introspects the type and wraps zodType._def in SQL-friendly props:
//   - clonedZodType(zodType)
//   - sqlDomain(zodType)

// TODO:
// - consider creating new, native, Zod instances instead of wrapping Zod
//   https://github.com/jaylmiller/zodsql/blob/main/src/column.ts
// - consider monkey-patching Zod instances
//   https://github.com/IvanovES/zod-metadata/blob/main/src/index.ts

// deno-lint-ignore no-explicit-any
type Any = any; // make it easy on linter

/**
 * Clone a "bare" ZodType, removing Optional, Nullable and Default signatures
 * useful for creating references or other similar use cases.
 * @param original the ZodType we should clone
 * @param referenced if tracking reference graphs, pass along the graph
 * @returns a new instance as close to the type of the original as possible but with Optional, Nullable, or Default signatures
 */
export const clonedZodType = <
  Original extends z.ZodTypeAny,
  Cloned = z.deoptional<Original>,
>(original: Original): Cloned => {
  const zodTypeName = original._def.typeName;
  switch (zodTypeName) {
    case z.ZodFirstPartyTypeKind.ZodOptional:
    case z.ZodFirstPartyTypeKind.ZodNullable:
    case z.ZodFirstPartyTypeKind.ZodDefault: {
      return clonedZodType(original._def.innerType);
    }

    case z.ZodFirstPartyTypeKind.ZodString: {
      return z.string({ ...original._def }) as unknown as Cloned;
    }

    case z.ZodFirstPartyTypeKind.ZodNumber: {
      return z.number({ ...original._def }) as unknown as Cloned;
    }

    default:
      throw new Error(
        `Unable to map Zod type ${zodTypeName} in referenceSource(src).duplicate(zta)`,
      );
  }
};

export const NativeRefSourceType = "nativeSource" as const;
export const NativeRefDestType = "nativeDest" as const;

export type NativeReferenceDest<Context extends tmpl.SqlEmitContext> =
  ReferenceDestination<
    typeof NativeRefDestType,
    Context
  >;
export type NativeReferenceSource<
  Domains extends SqlDomains<Any, Context>,
  DomainsIdentity extends string,
  Context extends tmpl.SqlEmitContext,
> = ReferenceSource<
  typeof NativeRefSourceType,
  NativeReferenceDest<Context>,
  DomainsIdentity,
  Domains,
  Context
>;

export type ReferenceSource<
  SourceType extends string,
  Destination extends ReferenceDestination<Any, Context>,
  DomainsIdentity extends string,
  Domains extends SqlDomains<Any, Context>,
  Context extends tmpl.SqlEmitContext,
> = {
  readonly domainsIdentity: DomainsIdentity;
  readonly sdSchema: Domains;
  readonly refSourceType: SourceType;
  readonly incomingRefs: Set<Destination>;
  readonly register: (rd: Destination) => Destination;
};

export const isReferenceSource = <
  SourceType extends string,
  Destination extends ReferenceDestination<Any, Context>,
  DomainsIdentity extends string,
  Domains extends SqlDomains<Any, Context>,
  Context extends tmpl.SqlEmitContext,
>(
  o: unknown,
): o is ReferenceSource<
  SourceType,
  Destination,
  DomainsIdentity,
  Domains,
  Context
> => {
  const isRS = safety.typeGuard<
    ReferenceSource<SourceType, Destination, DomainsIdentity, Domains, Context>
  >(
    "refSourceType",
    "incomingRefs",
  );
  return isRS(o);
};

/**
 * Mutate the given object so that it "becomes" a ReferenceSource
 * @param o original object, usually a zodType._def
 * @param refSourceType the type of reference
 * @returns o "transformed" (via type signature properties) as a ReferenceSource
 */
export function asReferenceSource<
  SourceType extends string,
  Destination extends ReferenceDestination<Any, Context>,
  Source extends ReferenceSource<
    SourceType,
    Destination,
    DomainsIdentity,
    Domains,
    Context
  >,
  DomainsIdentity extends string,
  Domains extends SqlDomains<Any, Context>,
  Context extends tmpl.SqlEmitContext,
>(
  o: unknown,
  refSourceType: SourceType,
  enhance?: (result: Source) => Source,
): Source {
  if (
    isReferenceSource<
      SourceType,
      Destination,
      DomainsIdentity,
      Domains,
      Context
    >(o)
  ) return o as Source;

  const incomingRefs = new Set<Destination>();
  const result = o as Source;
  ((result.refSourceType) as Any) = refSourceType;
  ((result.incomingRefs) as Any) = incomingRefs;
  ((result.register) as Any) = (rd: Destination) => {
    incomingRefs.add(rd);
    return rd;
  };
  return enhance ? enhance(result) : result;
}

export type ReferenceDestination<
  DestType extends string,
  Context extends tmpl.SqlEmitContext,
> = {
  readonly refSource: ReferenceSource<
    Any,
    ReferenceDestination<DestType, Context>,
    Any,
    Any,
    Any
  >;
  readonly refDestType: DestType;
};

/**
 * Mutate the given object so that it "becomes" a ReferenceDestination
 * @param o original object, usually a zodType._def
 * @param refSourceType the type of reference
 * @returns o "transformed" (via type signature properties) as a ReferenceDestination
 */
export function asReferenceDestination<
  Destination extends ReferenceDestination<Any, Any>,
  DestType extends string,
>(
  o: unknown,
  refDestType: DestType,
  enhance?: (result: Destination) => Destination,
) {
  if (isReferenceDestination<Destination, DestType>(o)) {
    return o;
  }
  const result = o as Destination;
  ((result.refDestType) as Any) = refDestType;
  return enhance ? enhance(result) : result;
}

export const isReferenceDestination = <
  Destination extends ReferenceDestination<DestType, Any>,
  DestType extends string,
>(o: unknown): o is Destination => {
  const isRD = safety.typeGuard<ReferenceDestination<DestType, Any>>(
    "refDestType",
  );
  return isRD(o);
};

export type SqlDomainReferencesFactory<
  Source extends ReferenceSource<Any, Any, Any, Any, Context>,
  Destination extends ReferenceDestination<Any, Context>,
  Domain extends SqlDomain<Any, Context>,
  Context extends tmpl.SqlEmitContext,
> = {
  readonly prepareSource: (o: unknown) => Source;
  readonly prepareDest: (o: unknown, domain: Domain) => Destination;
};

export function sqlDomainReferencesFactory<
  Source extends ReferenceSource<Any, Any, Any, Any, Context>,
  Destination extends ReferenceDestination<Any, Context>,
  Domain extends SqlDomain<Any, Context>,
  Graph extends SqlDomainReferencesFactory<
    Source,
    Destination,
    Domain,
    Context
  >,
  Context extends tmpl.SqlEmitContext,
>(enhance?: (result: Graph) => Graph) {
  const result = {
    prepareSource: (o: unknown) => asReferenceSource(o, NativeRefSourceType),
    prepareDest: (o: unknown, _domain: Domain) =>
      asReferenceDestination(o, NativeRefDestType),
  } as unknown as Graph;
  return enhance ? enhance(result) : result;
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

export type SiblingDomainsSupplier<
  DomainsIdentity extends string,
  ZodRawShape extends z.ZodRawShape,
  Context extends tmpl.SqlEmitContext,
> = {
  readonly siblingDomains: () => SqlDomainsDefinition<
    DomainsIdentity,
    ZodRawShape,
    Context
  >;
};

export function isSiblingDomainsSupplier<
  DomainsIdentity extends string,
  ZodRawShape extends z.ZodRawShape,
  Context extends tmpl.SqlEmitContext,
>(o: unknown): o is SiblingDomainsSupplier<
  DomainsIdentity,
  ZodRawShape,
  Context
> {
  const isSDS = safety.typeGuard<
    SiblingDomainsSupplier<
      DomainsIdentity,
      ZodRawShape,
      Context
    >
  >("siblingDomains");
  return isSDS(o);
}

export const sqlDomain = <
  Original extends z.ZodTypeAny,
  Context extends tmpl.SqlEmitContext,
  DomainIdentity extends string = string,
>(
  original: Original,
  init?: {
    readonly identity?: DomainIdentity;
    readonly isNullable?: boolean;
    readonly refsGraph?: SqlDomainReferencesFactory<
      NativeReferenceSource<Any, Any, Context>,
      NativeReferenceDest<Context>,
      SqlDomain<Original, Context>,
      Context
    >;
  } & Partial<SiblingDomainsSupplier<Any, Any, Context>>,
) => {
  if (!isSiblingDomainsSupplier(original._def) && init?.siblingDomains) {
    ((original._def as SiblingDomainsSupplier<Any, Any, Context>)
      .siblingDomains as Any) = init.siblingDomains;
  }

  if (isSqlDomainSupplier<Original, Context>(original._def)) {
    // this means is custom prepared SqlDomain instance attached to a ZTA so
    // we're just going to rename it and use it as-is
    if (original._def.sqlDomain.identity && SQL_DOMAIN_NOT_IN_COLLECTION) {
      (original._def.sqlDomain.identity as string) = init?.identity ??
        SQL_DOMAIN_HAS_NO_IDENTITY_FROM_SHAPE;
    }
    return original._def.sqlDomain;
  }

  const lintIssues: l.SqlLintIssueSupplier[] = [];
  const defaults = {
    isSqlDomain: true as true, // must not be a boolean but `true`
    isNullable: () =>
      init?.isNullable || original.isOptional() || original.isNullable(),
    identity: init?.identity as DomainIdentity ?? SQL_DOMAIN_NOT_IN_COLLECTION,
    sqlSymbol: (ctx: Context) =>
      ctx.sqlNamingStrategy(ctx, { quoteIdentifiers: true }).domainName(
        init?.identity ?? SQL_DOMAIN_NOT_IN_COLLECTION,
      ),
    lintIssues,
    registerLintIssue: (...slis: l.SqlLintIssueSupplier[]) => {
      lintIssues.push(...slis);
    },
  };

  const attach = (zta: Original): SqlDomain<Original, Context> => {
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

export type SqlDomainsDefinition<
  DomainsIdentity extends string,
  ZodRawShape extends z.ZodRawShape,
  Context extends tmpl.SqlEmitContext,
> = {
  readonly domainsIdentity: DomainsIdentity;
  readonly zSchema: ZodRawShape;
  readonly sdSchema: SqlDomains<ZodRawShape, Context>;
};

export type SqlDomainsGraph<
  DomainIdentity extends string,
  Source extends ReferenceSource<Any, Any, Any, Any, Context>,
  Destination extends ReferenceDestination<Any, Context>,
  DomainRefsFactory extends SqlDomainReferencesFactory<
    Source,
    Destination,
    Any,
    Context
  >,
  Context extends tmpl.SqlEmitContext,
> = {
  readonly referenced: Set<
    ReferenceSource<Any, Any, DomainIdentity, Any, Context>
  >;
  readonly references: Set<ReferenceDestination<Any, Context>>;
  readonly anonymousIdentity: <
    Object extends z.ZodObject<Shape>,
    Shape extends z.ZodRawShape,
  >(target: Object) => DomainIdentity;
  readonly domainRefsFactory: (identity: DomainIdentity) => DomainRefsFactory;
  readonly prepareRef: <
    Original extends z.ZodTypeAny,
    Domain extends SqlDomain<Original, Context>,
    Destination extends ReferenceDestination<Any, Context>,
    Cloned = z.deoptional<Original>,
  >(original: Original, destDomain: Domain) => Cloned & Destination;
  readonly register: (rd: Destination, rs: Source) => void;
};

export function defaultDomainsGraph<
  Context extends tmpl.SqlEmitContext,
>() {
  let anonymousIdIndex = 0;
  const domainsRefsGraphs = new Map<
    string,
    SqlDomainReferencesFactory<Any, Any, Any, Context>
  >();
  const referenced = new Set<ReferenceSource<Any, Any, Any, Any, Context>>();
  const references = new Set<ReferenceDestination<Any, Context>>();
  const result: SqlDomainsGraph<
    string,
    ReferenceSource<Any, Any, Any, Any, Context>,
    ReferenceDestination<Any, Context>,
    SqlDomainReferencesFactory<Any, Any, Any, Context>,
    Context
  > = {
    referenced,
    references,
    anonymousIdentity: (zSchema) => {
      anonymousIdIndex++;
      const { keys: shapeKeys } = zSchema._getCached();
      return `anonymous${anonymousIdIndex}://${shapeKeys.join(",")}`;
    },
    domainRefsFactory: (identity) => {
      let drg = domainsRefsGraphs.get(identity);
      if (!drg) {
        drg = sqlDomainReferencesFactory<Any, Any, Any, Any, Context>();
        domainsRefsGraphs.set(identity, drg!);
      }
      return drg!;
    },
    prepareRef: (original, destDomain) => {
      const sds = original._def;
      if (isSiblingDomainsSupplier(sds)) {
        const sd = sds.siblingDomains();
        const drefsGraph = result.domainRefsFactory(sd.domainsIdentity);
        const cloned = clonedZodType(original);
        const refDest = drefsGraph.prepareDest(cloned._def, destDomain);
        const refSrc = drefsGraph.prepareSource(original._def);
        result.register(refDest, refSrc);
        return cloned as Any; // TODO: properly type this for better maintenance
      } else {
        console.dir(original);
        throw Error(`${original} doesn't supply siblings`);
      }
    },
    register: (rd, rs) => {
      rs.register(rd);
      referenced.add(rs);
      references.add(rd);
    },
  };
  return {
    anonymousIdIndex,
    domainsRefsGraphs,
    ...result,
  };
}

export const globalDefaultDomainsGraph = defaultDomainsGraph();

export function sqlDomains<
  ZodRawShape extends z.ZodRawShape,
  DomainsGraph extends SqlDomainsGraph<
    Any,
    Any,
    Any,
    Any,
    Context
  >,
  Context extends tmpl.SqlEmitContext,
  DomainsIdentity extends string,
>(
  zodRawShape: ZodRawShape,
  domainsGraph: DomainsGraph = globalDefaultDomainsGraph as Any,
  init?: {
    readonly identity?: DomainsIdentity;
  },
) {
  const sdSchema: SqlDomains<ZodRawShape, Context> = {} as Any;
  const domains: SqlDomain<z.ZodTypeAny, Context>[] = [];
  const zSchema = z.object(zodRawShape).strict();
  const identity = init?.identity ?? domainsGraph.anonymousIdentity(zSchema);
  const domainRefsGraph = domainsGraph.domainRefsFactory(identity);
  const { shape, keys: shapeKeys } = zSchema._getCached();
  for (const key of shapeKeys) {
    const member = shape[key];
    const sd = sqlDomain(member, {
      identity: key,
      siblingDomains: () => ({
        domainsIdentity: identity,
        zSchema,
        sdSchema,
      }),
    });
    (sdSchema[key] as Any) = sd;
    domains.push(sd);
  }

  // we use this if we want to make a copy of a type (like foreign key ref);
  // we track all references/referenced (TODO: will this be a memory leak due
  // to circular references?); each copy will "deoptionalize" meaning it's
  // going to not be optional as a reference even if it's optional in the src
  type Referencables = {
    [Property in keyof ZodRawShape]: () =>
      & z.deoptional<ZodRawShape[Property]>
      & ReferenceDestination<Any, Context>;
  };
  const referencables: Referencables = {} as Any;
  for (const key of shapeKeys) {
    const original = zSchema.shape[key as Any];
    (referencables[key] as Any) = () =>
      domainsGraph.prepareRef(original, sdSchema[key] as Any);
  }

  // we let Typescript infer function return to allow generics to be more
  // easily passed to consumers (if we typed it to an interface we'd limit
  // the type-safety)
  // ESSENTIAL: be sure it adheres to SqlDomainsSupplier contract
  const lintIssues: l.SqlLintIssueSupplier[] = [];
  return {
    identity,
    zSchema,
    referencables,
    domainsGraph,
    domainRefsGraph,
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
