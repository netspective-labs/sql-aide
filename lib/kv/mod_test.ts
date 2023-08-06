import { testingAsserts as ta } from "../../deps-test.ts";
import * as mod from "./mod.ts";

const expectType = <T>(_value: T) => {
  // Do nothing, the TypeScript compiler handles this for us
};

type VersionedKeys<Version> = [...mod.KeySpace, Version];

interface User {
  readonly name: string;
  readonly address: {
    readonly city: string;
    readonly state: string;
  };
}

Deno.test("keysValues should shred an object into KV pairs", () => {
  ta.assertEquals(
    mod.keysValues({
      name: "John",
      address: { city: "New York", state: "NY" },
    }),
    [
      {
        keys: ["name"],
        value: "John",
      },
      {
        keys: ["address", "city"],
        value: "New York",
      },
      {
        keys: ["address", "state"],
        value: "NY",
      },
    ],
  );
});

Deno.test("keysValues should shred an object into numeric versioned KV pairs", () => {
  ta.assertEquals(
    mod.keysValues<VersionedKeys<number>, mod.StructuredCloneable>(
      {
        name: "John",
        address: { city: "New York", state: "NY" },
      },
      [],
      { keys: (keys) => [...keys, 1] },
    ),
    [
      {
        keys: ["name", 1],
        value: "John",
      },
      {
        keys: ["address", "city", 1],
        value: "New York",
      },
      {
        keys: ["address", "state", 1],
        value: "NY",
      },
    ],
  );
});

Deno.test("keysValues should shred an object into text versioned KV pairs, ignoring one", () => {
  ta.assertEquals(
    mod.keysValues<VersionedKeys<"v1" | "v2">, mod.StructuredCloneable>(
      {
        name: "John",
        address: { city: "New York", state: "NY" },
      },
      [
        "user",
      ],
      {
        keys: (keys, value) => {
          if (keys.join(".") == "user.address.city") {
            return [...keys, "v2"];
          } else {
            if (value == "NY") {
              // if user.address.state === "NY" then don't include it in kv pairs
              return false;
            } else {
              return [...keys, "v1"];
            }
          }
        },
      },
    ),
    [
      {
        keys: ["user", "name", "v1"],
        value: "John",
      },
      {
        keys: ["user", "address", "city", "v2"],
        value: "New York",
      },
    ],
  );
});

Deno.test("keysValues should create indexed KV pairs pointing to a single object", () => {
  const user: User = {
    name: "John",
    address: { city: "New York", state: "NY" },
  };

  ta.assertEquals(
    mod.keysValues<VersionedKeys<"v1">, User>(
      user,
      [
        "user",
      ],
      {
        keys: (keys, value) =>
          keys.join(".") == "user.address.state"
            ? false
            : [...keys, value as mod.KeySpacePart, "v1"],
        value: () => user,
      },
    ),
    [
      {
        keys: ["user", "name", "John", "v1"],
        value: user,
      },
      {
        keys: ["user", "address", "city", "New York", "v1"],
        value: user,
      },
    ],
  );
});

Deno.test("entityKeysValues should create entity and indexed KV pairs pointing to a single object", () => {
  const user: User = {
    name: "John",
    address: { city: "New York", state: "NY" },
  };

  // console.log(
  //   mod.entityKeysValues(
  //     user,
  //     { scopeKeys: () => ["user"], identityKeys: (e) => [e.name] },
  //   ),
  // );

  ta.assertEquals(
    mod.entityKeysValues(
      user,
      { scopeKeys: () => ["user"], identityKeys: (e) => [e.name] },
    ),
    [
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
    ],
  );
});

Deno.test("entityKeys should return keys mapping for an object", () => {
  const user: User = {
    name: "John",
    address: {
      city: "New York",
      state: "NY",
    },
  };

  const unscoped = mod.entityShapedKeys(user);
  expectType<
    { name: mod.KeySpace; address: { city: mod.KeySpace; state: mod.KeySpace } }
  >(
    unscoped,
  );
  ta.assertEquals(unscoped, {
    name: ["name"],
    address: {
      city: ["address", "city"],
      state: ["address", "state"],
    },
  });

  ta.assertEquals(mod.entityShapedKeys(user, ["user"]), {
    name: ["user", "name"],
    address: {
      city: ["user", "address", "city"],
      state: ["user", "address", "state"],
    },
  });

  ta.assertEquals(
    mod.entityShapedKeys(user, [], { keys: (keys) => ["user", 123, ...keys] }),
    {
      name: ["user", 123, "name"],
      address: {
        city: ["user", 123, "address", "city"],
        state: ["user", 123, "address", "state"],
      },
    },
  );
});
