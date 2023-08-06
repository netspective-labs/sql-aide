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

export const entityIndexNature = [
  "ENTITY_ID", // uniquely indexes the entity identity
  "ENTITY_PROP", // unique indexes of each entity's property name
  "PROP_INDEX", // secondary indexes of each entity's property name which references the full object
] as const;
export type EntityIndexNature = typeof entityIndexNature[number];

export function entityKeysValues<
  Entity extends object,
  Keys extends KeySpace = KeySpace,
>(entity: Entity, options?: {
  readonly scopeKeys?: (entity: Entity) => KeySpacePart[];
  readonly identityKeys?: (entity: Entity) => KeySpacePart[];
  readonly indexKeys?: (
    nature: EntityIndexNature,
    scopeKeys: KeySpacePart[],
  ) => Keys;
}) {
  const indexKeys = options?.indexKeys ??
    ((nature, scopeKeys) => [...scopeKeys, `$${nature}`]);

  const scopeKeys = options?.scopeKeys?.(entity) ?? [];
  const entityIdKeys = options?.identityKeys?.(entity) ??
    [JSON.stringify(entity)];

  const entityKV: KeysValue<KeySpacePart[], Entity> = {
    keys: [...indexKeys("ENTITY_ID", scopeKeys), ...entityIdKeys],
    value: entity,
  };

  const propValueKVs = keysValues(entity, [
    ...indexKeys("ENTITY_PROP", scopeKeys),
    ...entityIdKeys,
  ]);
  const entityIndexKVs = keysValues(
    entity,
    indexKeys("PROP_INDEX", scopeKeys),
    {
      keys: (keys, value) => [...keys, value, ...entityIdKeys] as Keys,
      value: () => entity,
    },
  );
  return [entityKV, ...propValueKVs, ...entityIndexKVs];
}

export type EntityShapedKeys<T, Keys extends KeySpace> = {
  [K in keyof T]: T[K] extends object ? EntityShapedKeys<T[K], Keys> : Keys;
};

export function entityShapedKeys<
  Entity extends Record<string, Any>,
  Keys extends KeySpace,
>(
  entity: Entity,
  prefix: KeySpace = [],
  options?: {
    readonly keys?: (keys: KeySpacePart[], value: unknown) => Keys;
  },
): EntityShapedKeys<Entity, Keys> {
  const result: Any = {};
  for (const key in entity) {
    if (typeof entity[key] === "object" && entity[key] !== null) {
      result[key] = entityShapedKeys(entity[key], prefix.concat(key), options);
    } else {
      const keys = prefix.concat(key);
      result[key] = options?.keys?.(keys, entity[key]) ?? keys;
    }
  }
  return result;
}
