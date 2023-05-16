import { zod as z } from "../deps.ts";
import * as safety from "../../lib/universal/safety.ts";
import * as za from "../../lib/universal/zod-aide.ts";
import * as tmpl from "../emit/mod.ts";
import * as d from "./domain.ts";

// deno-lint-ignore no-explicit-any
type Any = any; // make it easy on linter

export type SqlDomains<
  ZodRawShape extends z.ZodRawShape,
  Context extends tmpl.SqlEmitContext,
> = {
  [Property in keyof ZodRawShape]: d.SqlDomain<
    ZodRawShape[Property],
    Context,
    Extract<Property, string>
  >;
};

export type ReferenceSource<EntityIdentity extends string> = {
  readonly identity: EntityIdentity;
  readonly incomingRefs: Set<ReferenceDestination<EntityIdentity>>;
  readonly register: (
    rd: ReferenceDestination<EntityIdentity>,
  ) => ReferenceDestination<EntityIdentity>;
};

type ReferenceDestination<EntityIdentity extends string> = {
  readonly refSource: ReferenceSource<EntityIdentity>;
};

export type SqlDomainsSupplier<Context extends tmpl.SqlEmitContext> = {
  readonly domains: () => d.SqlDomain<Any, Context, Any>[];
};

export function sqlDomainsFactory<
  EntityIdentity extends string,
  Context extends tmpl.SqlEmitContext,
>() {
  let sqlDomainsIterationIndex = 0;
  const sdf = d.zodTypeSqlDomainFactory<Any, Context>();
  const zb = za.zodBaggage<
    d.SqlDomain<Any, Context, Any>,
    d.SqlDomainSupplier<Any, Any, Context>
  >("sqlDomain");

  const sqlDomains = <
    RawShape extends z.ZodRawShape,
    BaggageSchema extends {
      [Property in keyof RawShape]: ReturnType<
        typeof zb.zodTypeBaggageProxy<RawShape[Property]>
      >;
    },
    SqlDomainSchema extends {
      [Property in keyof RawShape]: d.SqlDomain<
        RawShape[Property],
        Context,
        Extract<Property, string>
      >;
    },
    SqlSymbolSuppliersSchema extends {
      [Property in keyof RawShape]: tmpl.SqlSymbolSupplier<Context>;
    },
    SqlSymbolsSchema extends {
      [Property in keyof RawShape]: (ctx: Context) => string;
    },
  >(zodRawShape: RawShape, init?: {
    readonly identity?: (init: {
      readonly zoSchema: z.ZodObject<RawShape>;
      readonly zbSchema: BaggageSchema;
      readonly sdSchema: SqlDomainSchema;
    }) => EntityIdentity;
  }) => {
    const zoSchema = z.object(zodRawShape).strict();
    const zbSchema: BaggageSchema = {} as Any;
    const sdSchema: SqlDomainSchema = {} as Any;
    const domains: d.SqlDomain<Any, Context, Any>[] = [];
    const symbolSuppliers: SqlSymbolSuppliersSchema = {} as Any;
    const symbols: SqlSymbolsSchema = {} as Any;

    const { shape, keys: shapeKeys } = zoSchema._getCached();
    for (const key of shapeKeys) {
      const member = shape[key];
      (zbSchema[key] as Any) = zb.zodTypeBaggageProxy<typeof member>(
        member,
        sdf.cacheableFrom(member, { identity: key as Any }),
      );
      const { sqlDomain } = zbSchema[key];
      (sdSchema[key] as Any) = sqlDomain;
      (symbolSuppliers[key] as Any) = { sqlSymbol: sqlDomain.sqlSymbol };
      (symbols[key] as Any) = sqlDomain.sqlSymbol;
      domains.push(sqlDomain);
    }

    const identity = init?.identity?.({ zoSchema, zbSchema, sdSchema }) ??
      (`anonymous${++sqlDomainsIterationIndex}` as EntityIdentity);
    return {
      identity,
      zoSchema,
      zbSchema,
      sdSchema,
      domains,
      symbolSuppliers,
      symbols,
    };
  };

  function sqlReferencableDomains<
    RawShape extends z.ZodRawShape,
    DomainsIdentity extends string,
  >(
    zodRawShape: RawShape,
    init?: {
      readonly identity?: (
        init: { readonly zoSchema: z.ZodObject<RawShape> },
      ) => EntityIdentity;
    },
  ) {
    const common = sqlDomains(zodRawShape, init);

    type RefSrcPlaceholderSupplier = {
      readonly nativeRefSrcPlaceholder: ReferenceSource<EntityIdentity>;
    };

    const inferables = () => {
      // the "inferred types" are the same as their original types except without
      // optionals, defaults, or nulls (always required, considered the "CoreZTA");
      type InferReferences = {
        [Property in keyof RawShape]: () => za.CoreZTA<RawShape[Property]>;
      };

      const inferredPlaceholder = () => {
        const incomingRefs = new Set<ReferenceDestination<EntityIdentity>>();
        const refSource: ReferenceSource<EntityIdentity> = {
          identity: common.identity,
          incomingRefs,
          register: (rd) => {
            incomingRefs.add(rd);
            return rd;
          },
        };
        return refSource;
      };

      const inferables: InferReferences = {} as Any;
      const { shape, keys: shapeKeys } = common.zoSchema._getCached();
      for (const key of shapeKeys) {
        const zodType = shape[key];
        (inferables[key] as Any) = () => {
          // because zodSchema may have been cloned/copied from another sqlDomain we
          // want to forceCreate = true
          const placeholder = sdf.cacheableFrom(zodType, {
            identity: key as DomainsIdentity,
          });
          const nativeRefSrcPlaceholder = inferredPlaceholder();
          const nri:
            & d.SqlDomain<za.CoreZTA<typeof zodType>, Context, typeof key>
            & RefSrcPlaceholderSupplier = {
              nativeRefSrcPlaceholder, // <-- this is what allows isInferencePlaceholder() to pick up the placeholder
              ...placeholder,
            };

          // trick Typescript into thinking the Zod instance is also a SqlDomainSupplier;
          // this allows assignment of a reference to a Zod object or use as a
          // regular Zod schema; the sqlDomain is carried in zodType._def
          return zb.zodTypeBaggageProxy<typeof zodType>(
            zodType,
            nri,
          );
        };
      }

      return inferables;
    };

    const references = () => {
      const isInferencePlaceholder = safety.typeGuard<
        RefSrcPlaceholderSupplier
      >("nativeRefSrcPlaceholder");

      type References = {
        [
          Property in keyof RawShape as Extract<
            Property,
            RawShape[Property] extends RefSrcPlaceholderSupplier ? Property
              : never
          >
        ]:
          & d.SqlDomain<
            RawShape[Property],
            Context,
            Extract<Property, string>
          >
          & ReferenceDestination<EntityIdentity>;
      };

      // see if any references were registered but need to be created
      const references: References = {} as Any;
      const { zoSchema, zbSchema } = common;
      const { shape, keys: shapeKeys } = zoSchema._getCached();
      for (const key of shapeKeys) {
        const domain = zbSchema[key].sqlDomain;
        if (isInferencePlaceholder(domain)) {
          const reference: ReferenceDestination<EntityIdentity> = {
            refSource: domain.nativeRefSrcPlaceholder,
          };
          const zodType = shape[key];
          const finalDomain = sdf.cacheableFrom(zodType, {
            identity: key as DomainsIdentity,
          });
          (zbSchema[key].sqlDomain as Any) = {
            ...finalDomain,
            ...reference,
          };
          (references as Any)[key] = zbSchema[key].sqlDomain;
        }
      }

      return references;
    };

    return {
      ...common,
      infer: inferables(),
      references: references(),
    };
  }

  return {
    ...zb,
    ...sdf,
    sqlDomains,
    sqlReferencableDomains,
  };
}
