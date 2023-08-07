import { testingAsserts as ta } from "../../deps-test.ts";
import * as mod from "./governance.ts";

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
