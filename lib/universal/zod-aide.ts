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
  function titleCase(str: string): string {
    return str.replace(/(?:^|\s)\w/g, (match) => {
      return match.toUpperCase();
    });
  }

  // deno-fmt-ignore
  const isProxyQueryProp = `is${titleCase(String(baggageProperty))}Proxy` as const;
  const isBaggageSupplier = (o: unknown): o is BaggageSupplier => {
    if (o && typeof o === "object" && (o as Any)[baggageProperty]) return true;
    return false;
  };

  const clearWrappedBaggage = <ZodType extends z.ZodTypeAny>(
    zodType: ZodType,
  ): ZodType => {
    delete (zodType._def as Any)[baggageProperty];
    delete (zodType._def as Any)[isProxyQueryProp];

    const zodTypeName = zodType._def.typeName;
    switch (zodTypeName) {
      case z.ZodFirstPartyTypeKind.ZodOptional:
      case z.ZodFirstPartyTypeKind.ZodNullable:
      case z.ZodFirstPartyTypeKind.ZodDefault: {
        return clearWrappedBaggage(zodType._def.innerType);
      }

      default: {
        return zodType;
      }
    }
  };

  const storeWrappedBaggage = <ZodType extends z.ZodTypeAny>(
    zodType: ZodType,
    value: Baggage | undefined,
  ): z.ZodTypeAny => {
    const zodTypeName = zodType._def.typeName;
    switch (zodTypeName) {
      case z.ZodFirstPartyTypeKind.ZodOptional:
      case z.ZodFirstPartyTypeKind.ZodNullable:
      case z.ZodFirstPartyTypeKind.ZodDefault: {
        return storeWrappedBaggage(zodType._def.innerType, value);
      }

      default: {
        if (value) {
          (zodType._def as Any)[baggageProperty] = value;
          (zodType._def as Any)[isProxyQueryProp] = true;
        } else {
          delete (zodType._def as Any)[baggageProperty];
          delete (zodType._def as Any)[isProxyQueryProp];
        }
        return zodType;
      }
    }
  };

  const unwrappedBaggage = <ZodType extends z.ZodTypeAny>(
    zodType: ZodType,
  ): Baggage | undefined => {
    const zodTypeName = zodType._def.typeName;
    switch (zodTypeName) {
      case z.ZodFirstPartyTypeKind.ZodOptional:
      case z.ZodFirstPartyTypeKind.ZodNullable:
      case z.ZodFirstPartyTypeKind.ZodDefault: {
        return unwrappedBaggage(zodType._def.innerType);
      }

      default: {
        return (zodType._def as Any)[baggageProperty];
      }
    }
  };

  const zodTypeBaggageProxy = <ZodType extends z.ZodTypeAny>(
    zodType: ZodType,
    defaultValue?: Baggage | undefined,
  ) => {
    if (defaultValue) {
      storeWrappedBaggage(zodType, defaultValue);
    }

    return new Proxy<ZodType>(
      zodType,
      {
        set(target, property, value) {
          if (property == baggageProperty) {
            storeWrappedBaggage(zodType, value);
            return true;
          }
          return Reflect.set(target, property, value);
        },
        deleteProperty(target, property) {
          if (property == baggageProperty) {
            storeWrappedBaggage(zodType, undefined);
            return true;
          }
          return Reflect.deleteProperty(target, property);
        },
        get(target, property) {
          if (property == isProxyQueryProp) {
            return true;
          }
          if (property == baggageProperty) {
            return unwrappedBaggage(target);
          }
          return Reflect.get(target, property);
        },
        has(target, property) {
          if (property == baggageProperty) {
            return unwrappedBaggage(target) ? true : false;
          }
          return Reflect.has(target, property);
        },
      },
    ) as ZodType & BaggageSupplier;
  };

  return {
    isBaggageSupplier,
    isProxyQueryProp,
    zodTypeBaggageProxy,
    storeWrappedBaggage,
    unwrappedBaggage,
    clearWrappedBaggage,
  };
}

// this is just a "signature" type to make it easier to document purpose
export type ZodEnrichment<
  ZTA extends z.ZodTypeAny,
  Enrichment,
  Result = ZTA & Enrichment,
> = Result;

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
 * Remove unhelpful inspection lines from Deno.inspect(zodType) or similar output.
 * @param text result of Deno.inspect(zodType)
 * @returns same text except without unhelpful [Function] and other usually undefined attributes
 */
export function filteredInspect(text: string) {
  return text.replaceAll(
    /^\s+(_type|_output|_input|errorMap|spa|parse|safeParse|parseAsync|safeParseAsync|refine|refinement|superRefine|optional|nullable|nullish|array|promise|or|and|transform|brand|default|catch|describe|pipe|isNullable|isOptional)\:.*\n/gm,
    "",
  ).replaceAll(/\n\n/gm, "");
}

export function writeDebugFile(name: string, ...inspect: unknown[]) {
  Deno.writeTextFileSync(
    name,
    filteredInspect(
      inspect.map((i) =>
        typeof i === "string" ? i : Deno.inspect(inspect, { depth: 10 })
      ).join("\n"),
    ),
  );
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
