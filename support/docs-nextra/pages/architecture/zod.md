---
title: Zod
---

# Zod

`SQLa` uses
[Zod's TypeScript\-first schema validation with static type inference](https://zod.dev/)
capabilities to define data structures and introspects Zod's type-safe schema to
generates SQL. You can define tables, views, and other SQL DDL, DML and DQL
statements using Zod then use `SQLa` to emit database-agnostic SQL. This way
your data structures can be used with compile-type type checking but also be
useful at runtime on the server or user agents like browsers and mobile apps.

Zod should be seen as the primary developer experience (DX) layer because it has
some great extensions. For example:

- if we need a JSON Schema generated from a SQL DDL definition, we can just use
  a [Zod-to-JSON Schema](https://github.com/StefanTerdell/zod-to-json-schema)
  library without inventing anything ourselves.
- if we need utility functions to manage our Zod-based models try
  [Zod Utilz Framework agnostic utilities](https://github.com/JacobWeisenburger/zod_utilz).
- before writing any new modeling infrastructure code, check the Zod ecosystem;
  if we do end up inventing something, build it on top of Zod whenever possible.

# Bridges

In order to allow Zod to manage our compile-type types and our runtime
validation behaviors we need to create _bridges_ between Zod types and SQLa SQL
domains. There are different techniques for simple zod extensions vs. more
advanced extensions.

## `zodSqlDomainRawCreateParams`

The first, simple but usually effective, bridge between Zod and SQLa is
`render/domain/domain.ts:zodSqlDomainRawCreateParams` which maps our custom JSON
properties and stringifies them into Zod's `description` field.

## Zod Baggage

The second, more extensible, bridge between Zod and SQLa is a mapping layer
called `Zod Baggage`, defined in `lib/universal/zod-aide.ts`. It's marked
`universal` since it can be used for other purposes but resides in this repo for
convenience. The purpose of `ZodTypedBaggage` and `zodBaggage` is to allow
arbitrary meta data called _baggage_ to be stored with Zod types (usually
scalars). Using this bridge library we can create SQL-specific data and store it
alongside (literally inside the `ZodType._def` object).
