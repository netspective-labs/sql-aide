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

/**
 * A single keys-value pair which consists of an array of keys and a value.
 */
export type KeysValue<Keys, Value> = {
  readonly keys: Keys;
  readonly value: Value;
};

/**
 * Takes an object and converts it into an array of key-value pairs. It flattens
 * nested structures into a list of key paths, and customizes keys using the
 * `keys` callback.
 * @param input - The object to extract keys and values from.
 * @param keysPrefix - An array of keys to prefix to all extracted keys.
 * @param options - Options to configure the keys extraction.
 * @returns An array of keys-value pairs extracted from the object.
 */
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
