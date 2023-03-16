import { zod as z } from "../../deps.ts";

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

/**
 * Look through the given ZodType and return an array of the deepest level
 * first, next level second, and so on until we reach the original
 * @param search the ZodType to inspect
 * @returns an array of ZodType elements starting with the innermost child
 */
export function wrappedZTAs<T extends z.ZodTypeAny>(search: T) {
  const result: z.ZodTypeAny[] = [search];
  let cursor: z.ZodTypeAny = search;
  while (cursor._def && "innerType" in cursor._def) {
    cursor = cursor._def.innerType;
    if (cursor) result.unshift(cursor);
  }
  return result;
}

export type ZodTypedBaggage<
  ZTA extends z.ZodTypeAny,
  Baggage,
  BaggageSupplier extends { [key: string]: Baggage },
  Result = ZTA & BaggageSupplier,
> = Result;

export function zodBaggage<
  Baggage,
  BaggageSupplier extends { [key: string]: Baggage } = {
    [key: string]: Baggage;
  },
  BaggageProp extends keyof BaggageSupplier = keyof BaggageSupplier,
>(baggageProperty: BaggageProp) {
  const isBaggageSupplier = (o: unknown): o is BaggageSupplier => {
    if (o && typeof o === "object" && (o as Any)[baggageProperty]) return true;
    return false;
  };

  function zodTypeBaggage<ZodType extends z.ZodTypeAny>(
    origin: ZodType,
    defaultValue?: Baggage | undefined,
    options?: {
      readonly forceCreate: boolean;
    },
  ) {
    let store: Baggage | undefined = defaultValue;
    return new Proxy<ZodType>(origin, {
      set(target, property, value) {
        if (typeof property === "string" && property == baggageProperty) {
          if (store && !options?.forceCreate) return false;
          store = value;
          return true;
        }
        return Reflect.set(target, property, value);
      },
      get(target, property) {
        if (typeof property === "string" && property == baggageProperty) {
          return store;
        }
        return Reflect.get(target, property);
      },
    }) as ZodTypedBaggage<ZodType, Baggage, BaggageSupplier>; // trick TypeScript into thinking Baggage is part of ZodType
  }

  const zodIntrospection = "zodIntrospection" as const;
  function introspectableZodTypeBaggage<
    ZodType extends z.ZodTypeAny,
    Introspection = {
      readonly proxiedZodType: ZodType;
      readonly coreZTA: () => CoreZTA<ZodType>;
      readonly wrappedZTAs: () => z.ZodTypeAny[];
      readonly cloned: () => ZodType;
      readonly clonedCoreZTA: () => CoreZTA<ZodType>;
    },
    IntrospectionSupplier = {
      readonly zodIntrospection: Introspection;
    },
  >(
    origin: ZodType,
    defaultValue?: Baggage | undefined,
    options?: {
      readonly forceCreate: boolean;
    },
  ) {
    const ps: Introspection = {
      proxiedZodType: origin,
      wrappedZTAs: () => wrappedZTAs(origin),
      coreZTA: () => coreZTA(origin),
      cloned: () => clonedZodType(origin),
      clonedCoreZTA: () => coreZTA(clonedZodType(origin)),
    } as Introspection;
    let store: Baggage | undefined = defaultValue;
    return new Proxy<ZodType>(origin, {
      set(target, property, value) {
        if (typeof property === "string" && property == baggageProperty) {
          if (store && !options?.forceCreate) return false;
          store = value;
          return true;
        }
        return Reflect.set(target, property, value);
      },
      get(target, property) {
        switch (property) {
          case baggageProperty:
            return store;

          case zodIntrospection:
            return ps;
        }
        return Reflect.get(target, property);
      },
    }) as
      & ZodTypedBaggage<ZodType, Baggage, BaggageSupplier>
      & IntrospectionSupplier; // trick TypeScript into thinking Baggage is part of ZodType
  }

  return { isBaggageSupplier, zodTypeBaggage, introspectableZodTypeBaggage };
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

// from: https://github.com/skarab42/zoxy

type ValidProperty<Data, Property extends keyof Data> = Data[Property] extends
  NonNullable<Data[Property]> ? never
  : Property;

type ZoxyProxy<Data, Prefix extends string> = {
  [
    Property in keyof Data as `${Prefix}${Property extends string
      ? ValidProperty<Data, Property>
      : never}`
  ]-?: (
    value: Data[Property],
  ) => Zoxy<NonNullable<Data[Property]>, Prefix>;
};

export type ZoxyOptions<Prefix extends string> = {
  prefix?: Prefix;
};

export type Zoxy<Data, Prefix extends string> = ZoxyProxy<Data, Prefix> & Data;

export function zoxy<
  Schema extends z.AnyZodObject,
  Data extends z.TypeOf<Schema>,
  Prefix extends string = "$",
>(
  schema: Schema,
  data: Data,
  options?: ZoxyOptions<Prefix>,
): Zoxy<z.TypeOf<Schema>, Prefix> {
  schema.parse(data);

  const prefix = options?.prefix ?? "$";
  const shape = schema.shape as Record<
    PropertyKey,
    z.ZodType<unknown, z.ZodTypeDef, unknown>
  >;

  return new Proxy<Data>(data, {
    set(target, property, value) {
      return Reflect.set(
        target,
        property,
        shape[property as keyof Data].parse(value),
      );
    },
    /** Prout */
    get(target, property) {
      if (typeof property === "string" && property.startsWith(prefix)) {
        const subProperty = property.slice(prefix.length);
        let anyZodType = shape[subProperty];

        if (anyZodType instanceof z.ZodOptional) {
          anyZodType = anyZodType.unwrap() as z.ZodTypeAny;
        }

        if (!anyZodType) {
          throw new Error(
            `There is no zod schema found for the property '${subProperty}'.`,
          );
        }

        return (defaultValue: unknown) => {
          const currentValue = Reflect.get(target, subProperty) as unknown;

          if (currentValue === undefined) {
            Reflect.set(target, subProperty, anyZodType?.parse(defaultValue));
          }

          const value = Reflect.get(target, subProperty) as unknown;

          if (
            anyZodType instanceof z.ZodObject && value &&
            typeof value === "object"
          ) {
            return zoxy(anyZodType, value, options) as Zoxy<
              z.AnyZodObject,
              Prefix
            >;
          }

          return value;
        };
      }

      const currentValue = Reflect.get(target, property) as unknown;

      if (currentValue && typeof currentValue === "object") {
        const anyZodObject = shape[property] as z.AnyZodObject | undefined;

        if (anyZodObject instanceof z.ZodObject) {
          return zoxy(anyZodObject, currentValue, options);
        }
      }

      return currentValue;
    },
  }) as unknown as Zoxy<z.TypeOf<Schema>, Prefix>;
}
