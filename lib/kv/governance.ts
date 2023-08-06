// deno-lint-ignore no-explicit-any
type Any = any;

export type KeySpacePart = Uint8Array | string | number | bigint | boolean;
export type KeySpace = KeySpacePart[];

export type StructuredCloneable =
  | null
  | string
  | number
  | boolean
  | Date
  | RegExp
  | Blob
  | File
  | ArrayBuffer
  | Map<StructuredCloneable, StructuredCloneable>
  | Set<StructuredCloneable>
  | Array<StructuredCloneable>
  | { [key: string]: StructuredCloneable };

export type KeysValue<Keys, Value> = {
  readonly keys: Keys;
  readonly value: Value;
};

export function keysValues<Keys extends KeySpace, Value>(
  input: Record<string, Any>,
  keysPrefix: KeySpacePart[] = [],
  options?: {
    readonly keys?: (keys: KeySpacePart[], value: unknown) => Keys | false;
    readonly value?: (value: unknown) => Value;
  },
): KeysValue<Keys, Value>[] {
  let result: KeysValue<Keys, Value>[] = [];

  for (const key in input) {
    const value = input[key];
    const newKeysPrefix = keysPrefix.concat(key);

    if (typeof value === "object" && value !== null) {
      result = result.concat(keysValues(value, newKeysPrefix, options));
    } else {
      const keys = options?.keys?.(newKeysPrefix, value);
      if (typeof keys === "boolean" && keys === false) continue;
      result.push({
        keys: keys ?? (newKeysPrefix as Keys),
        value: options?.value?.(value) ?? value,
      });
    }
  }

  return result;
}

export type EntityKeys<T, Keys extends KeySpace> = {
  [K in keyof T]: T[K] extends object ? EntityKeys<T[K], Keys> : Keys;
};

export function entityKeys<
  T extends Record<string, Any>,
  Keys extends KeySpace,
>(
  obj: T,
  prefix: KeySpace = [],
  options?: {
    readonly keys?: (keys: KeySpacePart[], value: unknown) => Keys;
  },
): EntityKeys<T, Keys> {
  const result: Any = {};
  for (const key in obj) {
    if (typeof obj[key] === "object" && obj[key] !== null) {
      result[key] = entityKeys(obj[key], prefix.concat(key), options);
    } else {
      const keys = prefix.concat(key);
      result[key] = options?.keys?.(keys, obj[key]) ?? keys;
    }
  }
  return result;
}
