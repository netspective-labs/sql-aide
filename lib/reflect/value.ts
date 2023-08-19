// deno-lint-ignore no-explicit-any
type Any = any;

export type Transformers = {
  readonly transform: (value: string, vn: ValueNature) => Any;
};

export type Emitters = {
  readonly emitTsType: (vn: ValueNature) => string;
  readonly emitTsValue: (value: string, vn: ValueNature) => string;
};

export type ValueNature =
  | { readonly nature: "custom" } & Emitters & Transformers
  | { readonly nature: "undefined" } & Emitters & Transformers
  | { readonly nature: "number" } & Emitters & Transformers
  | { readonly nature: "string" } & Emitters & Transformers
  | { readonly nature: "boolean" } & Emitters & Transformers
  | { readonly nature: "Date" } & Emitters & Transformers
  | { readonly nature: "bigint" } & Emitters & Transformers
  | { readonly nature: "union" } & Emitters & Transformers & {
    readonly accumulate: (unionable?: string) => string[];
  };

export const detectedValueNature = (
  sampleValue?: string,
  emptyVN?: (sampleValue?: string) => ValueNature,
): ValueNature => {
  if (typeof sampleValue === "undefined") {
    return {
      nature: "undefined",
      transform: () => undefined,
      emitTsType: () => `undefined`,
      emitTsValue: () => `undefined`,
    };
  }

  const normalizedValue = sampleValue.trim().toLowerCase();
  if (normalizedValue.length == 0) {
    if (emptyVN) return emptyVN(sampleValue);
    return {
      nature: "undefined",
      transform: () => undefined,
      emitTsType: () => `undefined`,
      emitTsValue: () => `undefined`,
    };
  }

  const defaultEmitters: Emitters = {
    emitTsType: (type) => type.nature,
    emitTsValue: (value) => value,
  };

  // Check for number
  if (!isNaN(Number(sampleValue))) {
    return {
      nature: "number",
      ...defaultEmitters,
      transform: (value) => Number(value),
    };
  } // Check for boolean
  else if (
    ["true", "on", "yes", "false", "off", "no"].includes(normalizedValue)
  ) {
    return {
      nature: "boolean",
      ...defaultEmitters,
      emitTsValue: (value) =>
        ["true", "on", "yes"].includes(value.trim().toLowerCase())
          ? "true"
          : "false",
      transform: (value) =>
        ["true", "on", "yes"].includes(value.trim().toLowerCase())
          ? true
          : false,
    };
  } // Check for date using Date.parse
  else if (!isNaN(Date.parse(sampleValue))) {
    return {
      nature: "Date",
      ...defaultEmitters,
      emitTsValue: (value) => `Date.parse("${value}")`,
      transform: (value) => Date.parse(value),
    };
  } // Check for BigInt (e.g., 123n)
  else if (/^\d+n$/.test(sampleValue)) {
    return {
      nature: "bigint",
      ...defaultEmitters,
      transform: (value) => BigInt(value),
    };
  } // Check for union types (using a convention)
  else if (sampleValue.startsWith("{") && sampleValue.endsWith("}")) {
    const accumlated: string[] = [];
    return {
      nature: "union",
      accumulate: (unionable) => {
        if (unionable && !accumlated.includes(unionable)) {
          accumlated.push(unionable);
        }
        return accumlated;
      },
      emitTsType: () => accumlated.join(" | "),
      emitTsValue: (value) => `"${value.slice(1, -1)}"`,
      transform: (value) => value.slice(1, -1),
    };
  }

  return {
    nature: "string",
    ...defaultEmitters,
    emitTsValue: (value) => `"${value}"`,
    transform: (value) => value,
  };
};

/**
 * Given a sample row of data, try to figure out what the value types should be
 * @param sampleRow the values to use for auto-detection
 * @returns the array of emitters and transformers that cells can use
 */
export function autoDetectValueNatures(sampleRow: string[]) {
  const valueNatures: ValueNature[] = [];
  for (let i = 0; i < sampleRow.length; i++) {
    valueNatures[i] = detectedValueNature(sampleRow[i]);
  }
  return valueNatures;
}

export class TransformArrayValuesStream<
  I extends string[],
  O extends Any[],
> extends TransformStream<I, O> {
  constructor(
    readonly options?: {
      readonly sample?: I;
      readonly finalize?: (row: O) => O;
    },
  ) {
    // TODO: implement sampling mechanism to speed up transformations;
    //       without samples, we do the value deteection for each chunk
    super({
      transform: (
        chunk: I,
        controller: TransformStreamDefaultController<O>,
      ) => {
        let result: Any[] = [];

        for (let i = 0; i < chunk.length; i++) {
          const value = chunk[i];
          const vn = detectedValueNature(value);
          result[i] = vn.transform(value, vn);
        }

        if (this.options?.finalize) result = this.options.finalize(result as O);
        controller.enqueue(result as O);
      },
    });
  }
}

export class TransformObjectValuesStream<
  I extends Record<string, string>,
  O extends Record<string, Any>,
> extends TransformStream<I, O> {
  constructor(
    readonly options?: {
      readonly sample?: I;
      readonly finalize?: (row: O) => O;
    },
  ) {
    // TODO: implement sampling mechanism to speed up transformations;
    //       without samples, we do the value deteection for each chunk
    super({
      transform: (
        chunk: I,
        controller: TransformStreamDefaultController<O>,
      ) => {
        let result: Partial<O> = {};

        for (const key in chunk) {
          const value = chunk[key];
          const vn = detectedValueNature(value);
          (result as Any)[key] = vn.transform(value, vn);
        }

        if (this.options?.finalize) result = this.options.finalize(result as O);
        controller.enqueue(result as O);
      },
    });
  }
}
