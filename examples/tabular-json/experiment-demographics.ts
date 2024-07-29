import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";
import { TabularJson } from "../../lib/tabular-json/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

const demographicsShape = z.object({
  id: z.string(),
  name: z.string(),
  age: z.number(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    zipcode: z.string(),
    geo: z.object({
      lat: z.number(),
      lng: z.number(),
    }),
  }),
  isActive: z.boolean(),
  metadata: z.object({
    createdAt: z.string(),
    updatedAt: z.string(),
    history: z.array(z.object({
      date: z.string(),
      action: z.string(),
    })),
  }),
  preferences: z.object({
    notifications: z.object({
      email: z.boolean(),
      sms: z.boolean(),
    }),
  }),
});

const tabularJson = new TabularJson(demographicsShape)
  .schemaColumns({
    id: { name: "identity" },
    address: {
      zipcode: {
        name: "postal_code",
        asSqlSelectName: "postal_code",
      },
    },
  });

const flattenJs = tabularJson.tabularJs({ flattenArrays: true });
const flatData = flattenJs({
  id: "123",
  name: "John Doe",
  age: 30,
  address: {
    street: "123 Main St",
    city: "Anytown",
    zipcode: "12345",
    geo: { lat: 40.7128, lng: -74.0060 },
  },
  isActive: true,
  metadata: {
    createdAt: "2021-01-01T00:00:00Z",
    updatedAt: "2021-01-02T00:00:00Z",
    history: [{ date: "2021-01-01", action: "created" }],
  },
  preferences: {
    notifications: { email: true, sms: false },
  },
});

console.log(flatData);

const { createDDL, dropDDL } = tabularJson.tabularSqlView(
  "user_view",
  "SELECT * FROM users",
  "data",
  false,
);

console.log(dropDDL());
console.log(createDDL());
