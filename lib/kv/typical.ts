import * as g from "./governance.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export function typicalEntityKV<
  Entity extends object,
  Keys extends g.KeySpace = g.KeySpace,
>(options?: {
  readonly scopeKeys?: (entity: Entity) => g.KeySpacePart[];
  readonly identityKeys?: (entity: Entity) => g.KeySpacePart[];
}) {
  const indexNatures = [
    "ENTITY_ID", // uniquely indexes the entity identity
    "ENTITY_PROP", // unique indexes of each entity's property name
    "PROP_INDEX", // secondary indexes of each entity's property name which references the full object
  ] as const;
  type IndexNature = typeof indexNatures[number];
  const indexKeys = (
    nature: IndexNature,
    scopeKeys: g.KeySpacePart[],
  ) => [...scopeKeys, `$${nature}`];

  function keysValues(entity: Entity) {
    const scopeKeys = options?.scopeKeys?.(entity) ?? [];
    const entityIdKeys = options?.identityKeys?.(entity) ??
      [JSON.stringify(entity)];

    const entityKV: g.KeysValue<g.KeySpacePart[], Entity> = {
      keys: [...indexKeys("ENTITY_ID", scopeKeys), ...entityIdKeys],
      value: entity,
    };

    const propValueKVs = g.keysValues(entity, [
      ...indexKeys("ENTITY_PROP", scopeKeys),
      ...entityIdKeys,
    ]);
    const entityIndexKVs = g.keysValues(
      entity,
      indexKeys("PROP_INDEX", scopeKeys),
      {
        keys: (keys, value) => [...keys, value, ...entityIdKeys] as Keys,
        value: () => entity,
      },
    );
    return [entityKV, ...propValueKVs, ...entityIndexKVs];
  }

  interface IndexKeysSuppliers<Keys extends g.KeySpace> {
    readonly entityID: (...idKeys: g.KeySpacePart[]) => Keys;
    readonly entityProp: (...idKeys: g.KeySpacePart[]) => Keys;
    readonly propIndex: (...idKeys: g.KeySpacePart[]) => Keys;
  }

  type EntityIndexKeys<T, Keys extends g.KeySpace> = {
    [K in keyof T]: T[K] extends object ? EntityIndexKeys<T[K], Keys>
      : IndexKeysSuppliers<Keys>;
  };

  function indexKeysBuilder(entity: Entity) {
    const scopeKeys = options?.scopeKeys?.(entity) ?? [];
    function buildKeys(
      child: object,
      parentKeys: g.KeySpacePart[] = [],
    ): EntityIndexKeys<Entity, Keys> {
      const result: Any = {};
      for (const entry of Object.entries(child)) {
        const [key, pathValue] = entry;
        if (typeof pathValue === "object" && pathValue !== null) {
          result[key] = buildKeys(pathValue, parentKeys.concat(key));
        } else {
          const pathKeys = parentKeys.concat(key);
          const suppliers: IndexKeysSuppliers<Keys> = {
            entityID: (...idKeys) =>
              [...indexKeys("ENTITY_ID", scopeKeys), ...idKeys] as Keys,
            entityProp: (...idKeys) =>
              [
                ...indexKeys("ENTITY_PROP", scopeKeys),
                ...idKeys,
                ...pathKeys,
              ] as Keys,
            propIndex: (...idKeys) =>
              [
                ...indexKeys("PROP_INDEX", scopeKeys),
                ...pathKeys,
                ...idKeys,
              ] as Keys,
          };
          result[key] = suppliers;
        }
      }
      return result;
    }

    return buildKeys(entity);
  }

  return {
    indexNatures,
    keysValues,
    indexKeysBuilder,
  };
}

export function typicalVersionedEntityKV<
  Entity extends object,
  Keys extends g.KeySpace = g.KeySpace,
  VersionKey extends number | string = number,
>(
  versionKeysSupplier: (entity: Entity) => VersionKey[] | Promise<VersionKey[]>,
  options?: Parameters<typeof typicalEntityKV<Entity, Keys>>[0],
) {
  const entityKV = typicalEntityKV<Entity, Keys>(options);

  async function keysValues(entity: Entity) {
    const versionKeys = await versionKeysSupplier(entity);
    const kv = entityKV.keysValues(entity);
    for (const entry of kv) {
      entry.keys.push(...versionKeys);
    }
    return kv;
  }

  return {
    ...entityKV,
    keysValues,
  };
}
