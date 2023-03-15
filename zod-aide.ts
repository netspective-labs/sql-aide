import { zod as z } from "./deps.ts";

// DELETE_ME: more help available at:
// - https://github.com/github.com/RobinTail/express-zod-api/blob/main/src/metadata.ts
// - https://github.com/github.com/anfivewer/an5wer/blob/main/packages/util-react/src/mst/zod/zod-to-mst.ts
// - https://github.com/sachinraja/zod-to-ts/blob/main/src/index.ts
// - https://github.com/drizzle-team/drizzle-orm/blob/main/drizzle-zod/src/pg/index.ts

// deno-lint-ignore no-explicit-any
type Any = any; // make it easy on linter

export type CoreZTA<T extends z.ZodTypeAny> = T extends z.ZodOptional<infer U>
  ? CoreZTA<U>
  : T extends z.ZodNullable<infer U> ? CoreZTA<U>
  : T extends z.ZodDefault<infer U> ? CoreZTA<U>
  : T;

export function coreZTA<
  T extends z.ZodTypeAny,
  Result extends CoreZTA<T> = CoreZTA<T>,
>(
  original: T,
) {
  return (
      original instanceof z.ZodOptional ||
      original instanceof z.ZodNullable || original instanceof z.ZodDefault
    )
    ? original._def.innerType as z.ZodTypeAny as Result
    : original as unknown as Result;
}

// this is just a "signature" type to make it easier to document purpose
export type ZodEnrichment<
  ZTA extends z.ZodTypeAny,
  Enrichment,
  Result = ZTA & Enrichment,
> = Result;

/**
 * Arbitrarily "enrich" a ZodType._def with custom properties.
 * @param property identifies our enrichment in _def
 * @returns a class-like object with utility functions
 */
export function zodEnrichment<
  Enrichment,
  EnrichmentSupplier extends { [key: string]: Enrichment } = {
    [key: string]: Enrichment;
  },
  EnrichmentProp extends keyof EnrichmentSupplier = keyof EnrichmentSupplier,
>(property: EnrichmentProp) {
  const isEnrichmentSupplier = (o: unknown): o is EnrichmentSupplier => {
    if (o && typeof o === "object" && property in o) return true;
    return false;
  };

  const isEnrichedDef = (ztd: z.ZodTypeDef): boolean => {
    if (isEnrichmentSupplier(ztd)) return true;

    if ("typeName" in ztd && "innerType" in ztd) {
      const ztaDef = ztd as {
        readonly typeName: z.ZodFirstPartyTypeKind;
        readonly innerType: unknown;
      };
      switch (ztaDef.typeName) {
        case z.ZodFirstPartyTypeKind.ZodOptional:
        case z.ZodFirstPartyTypeKind.ZodNullable:
        case z.ZodFirstPartyTypeKind.ZodDefault: {
          return isEnrichedType(ztaDef.innerType);
        }
      }
    }
    return false;
  };

  const isEnrichedType = (o: unknown): boolean => {
    if (o && typeof o === "object" && "_def" in o) {
      return isEnrichedDef(o._def as z.ZodTypeDef);
    }
    return false;
  };

  const enrichment = (zta: z.ZodTypeAny, ...ancestors: z.ZodTypeAny[]): [
    es: EnrichmentSupplier,
    path: z.ZodTypeAny[],
  ] | undefined => {
    if (isEnrichmentSupplier(zta._def)) {
      return [zta._def as EnrichmentSupplier, [...ancestors, zta]];
    }

    switch (zta._def.typeName) {
      case z.ZodFirstPartyTypeKind.ZodOptional:
      case z.ZodFirstPartyTypeKind.ZodNullable:
      case z.ZodFirstPartyTypeKind.ZodDefault: {
        return enrichment(zta._def.innerType, ...ancestors);
      }
    }

    return undefined;
  };

  const deenriched = <ZodType extends z.ZodTypeAny>(zta: ZodType): ZodType => {
    if (isEnrichmentSupplier(zta._def)) {
      delete zta._def[property];
      return zta;
    }

    switch (zta._def.typeName) {
      case z.ZodFirstPartyTypeKind.ZodOptional:
      case z.ZodFirstPartyTypeKind.ZodNullable:
      case z.ZodFirstPartyTypeKind.ZodDefault: {
        return deenriched(zta._def.innerType);
      }
    }

    return zta;
  };

  return {
    isEnrichmentSupplier,
    isEnrichedType,
    isEnrichedDef,
    isEnriched: (search: unknown) => {
      // this can check either a type or a _def
      if (isEnrichmentSupplier(search)) return true;
      if (isEnrichedType(search)) return true;
    },
    enrichmentSupplier: (search: z.ZodTypeAny) => {
      const result = enrichment(search);
      if (result) return result[0];
      return undefined;
    },
    enrichmentSupplierPath: (search: z.ZodTypeAny) => enrichment(search),
    enrichment: (search: z.ZodTypeAny) => {
      const result = enrichment(search);
      if (result) return result[0][property] as Enrichment;
      return undefined;
    },
    withEnrichmentCustom: <
      ZodIn extends z.ZodTypeAny,
      E extends Enrichment,
      ZodOut = ZodIn & E,
    >(zodSchema: ZodIn, e: E) => {
      // don't search, just forcibly set
      (zodSchema._def as Any)[property] = e;

      // this will trick the type-script compiler into thinking the ZodType
      // has an enrichment so compile-type type checking will work well;
      // at runtime you use enrichment(search) to find at proper depth.
      return zodSchema as unknown as ZodOut;
    },
    withEnrichment: <
      ZodIn extends z.ZodTypeAny,
      E extends Enrichment,
      ZodOut = ZodIn & E,
    >(zodSchema: ZodIn, enrichment: () => E) => {
      // only set if it doesn't already exist somewhere in the ZodType
      if (!isEnrichedType(zodSchema)) {
        (zodSchema._def as Any)[property] = enrichment();
      }

      // this will trick the type-script compiler into thinking the ZodType
      // has an enrichment so compile-type type checking will work well;
      // at runtime you use enrichment(search) to find at proper depth.
      return zodSchema as unknown as ZodOut;
    },
    deenriched,
  };
}

/**
 * Clone a "bare" ZodType, removing Optional, Nullable and Default signatures
 * useful for creating references or other similar use cases.
 * @param original the ZodType we should clone
 * @param referenced if tracking reference graphs, pass along the graph
 * @returns a new instance as close to the type of the original as possible but with Optional, Nullable, or Default signatures
 */
export const clonedZodType = <Original extends z.ZodTypeAny, Cloned = Original>(
  original: Original,
): Cloned => {
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
