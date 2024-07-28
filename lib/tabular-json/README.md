# Tabular JSON Module

## Overview

The Tabular JSON Module (`tabular-json.ts`) provides a set of utilities for
handling and transforming JSON data structures into tabular formats, suitable
for database operations. It leverages the Zod library to define and validate
JSON schema shapes and offers a powerful way to map these structures into SQL
views or flattened JavaScript objects.

## Features

- **Zod Schema Integration**: Define and validate JSON data shapes using Zod.
- **Tabular Mapping**: Transform hierarchical JSON structures into flat tabular
  formats.
- **SQL View Generation**: Automatically generate SQL view definitions for
  accessing JSON data stored in databases.
- **Customizable Field Handling**: Customize how fields are handled, including
  type casting and SQL expression wrapping.

## Usage

See [Tabular JSON Experiments.ts](../../examples//tabular-json/experiment.ts) to
try out these examples in Deno.

### Defining a JSON Schema

Use Zod to define the shape of your JSON data:

```typescript
import { z } from "https://deno.land/x/zod/mod.ts";

const syntheticShape = z.object({
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
```

### Creating a Tabular JSON Instance

Create an instance of `TabularJson` with your schema:

```typescript
import { TabularJson } from "./tabular-json/mod.ts";
const tabularJson = new TabularJson().jsonSchema(syntheticShape);
```

### Generating a JavaScript Transformation

Transform JSON data into a flat object:

```typescript
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
```

If you run the above you'll see:

```json
{
  id: "123",
  name: "John Doe",
  age: 30,
  address_street: "123 Main St",
  address_city: "Anytown",
  address_zipcode: "12345",
  address_geo_lat: 40.7128,
  address_geo_lng: -74.006,
  is_active: true,
  metadata_created_at: "2021-01-01T00:00:00Z",
  metadata_updated_at: "2021-01-02T00:00:00Z",
  metadata_history_0_date: "2021-01-01",
  metadata_history_0_action: "created",
  preferences_notifications_email: true,
  preferences_notifications_sms: false
}
```

### Generating SQL View Definitions

Generate SQL view creation and deletion statements:

```typescript
const { createDDL, dropDDL } = tabularJson.tabularSqlView(
  "user_view",
  "SELECT * FROM users",
  "data",
  false,
);

console.log(dropDDL());
console.log(createDDL());
```

You'll see the following output:

```sql
DROP VIEW IF EXISTS user_view;
CREATE VIEW user_view AS
    WITH jsonSupplierCTE AS (
        SELECT * FROM users
    )
    SELECT
        data ->> 'id' AS id,
        data ->> 'name' AS name,
        data ->> 'age' AS age,
        data -> 'address' ->> 'street' AS street,
        data -> 'address' ->> 'city' AS city,
        data -> 'address' ->> 'zipcode' AS zipcode,
        data -> 'address' -> 'geo' ->> 'lat' AS lat,
        data -> 'address' -> 'geo' ->> 'lng' AS lng,
        data ->> 'isActive' AS isActive,
        data -> 'metadata' ->> 'createdAt' AS createdAt,
        data -> 'metadata' ->> 'updatedAt' AS updatedAt,
        data -> 'metadata' -> 'history' ->> 'date' AS date,
        data -> 'metadata' -> 'history' ->> 'action' AS action,
        data -> 'preferences' -> 'notifications' ->> 'email' AS email,
        data -> 'preferences' -> 'notifications' ->> 'sms' AS sms
    FROM jsonSupplierCTE;
```

## Customization

You can customize how fields are handled using column suppliers and SQL field
access suppliers. Refer to the test cases for more advanced use cases and custom
implementations.
