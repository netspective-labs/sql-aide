import { testingAsserts as ta } from "../../deps-test.ts";
import * as g from "./governance.ts";
import * as mod from "./typical.ts";

const expectType = <T>(_value: T) => {
  // Do nothing, the TypeScript compiler handles this for us
};

interface User {
  readonly name: string;
  readonly address: {
    readonly city: string;
    readonly state: string;
  };
}

const userKV = mod.typicalEntityKV<User>({
  scopeKeys: () => ["user"],
  identityKeys: (e) => [e.name],
});

const userVersionedKV = mod.typicalVersionedEntityKV<User>(() => [1], {
  scopeKeys: () => ["user"],
  identityKeys: (e) => [e.name],
});

const userTextVersionedKV = mod.typicalVersionedEntityKV<
  User,
  g.KeySpace,
  string
>(() => [`v1`], {
  scopeKeys: () => ["user"],
  identityKeys: (e) => [e.name],
});

Deno.test("typicalEntityKV.keysValues should create entity and indexed KV pairs pointing to a single object", () => {
  const user: User = {
    name: "John",
    address: { city: "New York", state: "NY" },
  };

  ta.assertEquals(userKV.keysValues(user), [
    {
      keys: ["user", "$ENTITY_ID", "John"],
      value: { name: "John", address: { city: "New York", state: "NY" } },
    },
    { keys: ["user", "$ENTITY_PROP", "John", "name"], value: "John" },
    {
      keys: ["user", "$ENTITY_PROP", "John", "address", "city"],
      value: "New York",
    },
    {
      keys: ["user", "$ENTITY_PROP", "John", "address", "state"],
      value: "NY",
    },
    {
      keys: ["user", "$PROP_INDEX", "name", "John", "John"],
      value: { name: "John", address: { city: "New York", state: "NY" } },
    },
    {
      keys: ["user", "$PROP_INDEX", "address", "city", "New York", "John"],
      value: { name: "John", address: { city: "New York", state: "NY" } },
    },
    {
      keys: ["user", "$PROP_INDEX", "address", "state", "NY", "John"],
      value: { name: "John", address: { city: "New York", state: "NY" } },
    },
  ]);
});

Deno.test("typicalVersionedEntityKV.keysValues should create entity and indexed KV pairs pointing to a single object with numeric versions", async () => {
  const user: User = {
    name: "John",
    address: { city: "New York", state: "NY" },
  };

  ta.assertEquals(await userVersionedKV.keysValues(user), [
    {
      keys: ["user", "$ENTITY_ID", "John", 1],
      value: { name: "John", address: { city: "New York", state: "NY" } },
    },
    { keys: ["user", "$ENTITY_PROP", "John", "name", 1], value: "John" },
    {
      keys: ["user", "$ENTITY_PROP", "John", "address", "city", 1],
      value: "New York",
    },
    {
      keys: ["user", "$ENTITY_PROP", "John", "address", "state", 1],
      value: "NY",
    },
    {
      keys: ["user", "$PROP_INDEX", "name", "John", "John", 1],
      value: { name: "John", address: { city: "New York", state: "NY" } },
    },
    {
      keys: ["user", "$PROP_INDEX", "address", "city", "New York", "John", 1],
      value: { name: "John", address: { city: "New York", state: "NY" } },
    },
    {
      keys: ["user", "$PROP_INDEX", "address", "state", "NY", "John", 1],
      value: { name: "John", address: { city: "New York", state: "NY" } },
    },
  ]);
});

Deno.test("typicalVersionedEntityKV.keysValues should create entity and indexed KV pairs pointing to a single object with text versions", async () => {
  const user: User = {
    name: "John",
    address: { city: "New York", state: "NY" },
  };

  ta.assertEquals(await userTextVersionedKV.keysValues(user), [
    {
      keys: ["user", "$ENTITY_ID", "John", `v1`],
      value: { name: "John", address: { city: "New York", state: "NY" } },
    },
    { keys: ["user", "$ENTITY_PROP", "John", "name", `v1`], value: "John" },
    {
      keys: ["user", "$ENTITY_PROP", "John", "address", "city", `v1`],
      value: "New York",
    },
    {
      keys: ["user", "$ENTITY_PROP", "John", "address", "state", `v1`],
      value: "NY",
    },
    {
      keys: ["user", "$PROP_INDEX", "name", "John", "John", `v1`],
      value: { name: "John", address: { city: "New York", state: "NY" } },
    },
    {
      keys: [
        "user",
        "$PROP_INDEX",
        "address",
        "city",
        "New York",
        "John",
        `v1`,
      ],
      value: { name: "John", address: { city: "New York", state: "NY" } },
    },
    {
      keys: ["user", "$PROP_INDEX", "address", "state", "NY", "John", `v1`],
      value: { name: "John", address: { city: "New York", state: "NY" } },
    },
  ]);
});

Deno.test("typicalEntityKV.indexKeysBuilder should return keys mapping for an object", () => {
  const entityID = "John";
  const user: User = {
    name: "John",
    address: {
      city: "New York",
      state: "NY",
    },
  };

  const eik = userKV.indexKeysBuilder(user);
  expectType<
    {
      name: {
        entityID: (...idKeys: g.KeySpacePart[]) => g.KeySpace;
        entityProp: (...idKeys: g.KeySpacePart[]) => g.KeySpace;
        propIndex: (...idKeys: g.KeySpacePart[]) => g.KeySpace;
      };
      address: {
        city: {
          entityID: (...idKeys: g.KeySpacePart[]) => g.KeySpace;
          entityProp: (...idKeys: g.KeySpacePart[]) => g.KeySpace;
          propIndex: (...idKeys: g.KeySpacePart[]) => g.KeySpace;
        };
        state: {
          entityID: (...idKeys: g.KeySpacePart[]) => g.KeySpace;
          entityProp: (...idKeys: g.KeySpacePart[]) => g.KeySpace;
          propIndex: (...idKeys: g.KeySpacePart[]) => g.KeySpace;
        };
      };
    }
  >(eik);

  ta.assertEquals([
    eik.name.entityID(entityID),
    eik.name.entityProp(entityID),
    eik.name.propIndex(entityID),
  ], [
    ["user", "$ENTITY_ID", "John"],
    ["user", "$ENTITY_PROP", "John", "name"],
    ["user", "$PROP_INDEX", "name", "John"],
  ]);

  ta.assertEquals([
    eik.address.city.entityID(entityID),
    eik.address.city.entityProp(entityID),
    eik.address.city.propIndex(entityID),
  ], [
    ["user", "$ENTITY_ID", "John"],
    ["user", "$ENTITY_PROP", "John", "address", "city"],
    ["user", "$PROP_INDEX", "address", "city", "John"],
  ]);

  ta.assertEquals([
    eik.address.state.entityID(entityID),
    eik.address.state.entityProp(entityID),
    eik.address.state.propIndex(entityID),
  ], [
    ["user", "$ENTITY_ID", "John"],
    ["user", "$ENTITY_PROP", "John", "address", "state"],
    ["user", "$PROP_INDEX", "address", "state", "John"],
  ]);
});
