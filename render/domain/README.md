# SQLa Domains

A `domain` is an Zod scalar schema valuable for many use cases:

- defining a column of a table that may generate create table DDL
- defining a column in a select clause
- defining a column of a view that may generate create view DDL
- defining an argument of a stored function or procedure

A domain should be a simple JS/TS object that has no other relationships or
dependencies (see 'domains' below for relationships). Domains are effective when
they remain type-safe through Zod and should be composable through simple
functions and spread operators. This allows, e.g., a column defined for a
"create table" DDL defintion to be used as an argument definition for a stored
function and vice-versa. Favoring composability over inheritance is the reason
why a data definition domain remains a simple JS object instead of a class.

A `domains` object groups multiple domains and treats them as a collection.
Domains are abstract types valuable for these use cases:

- defining a list of columns in a table for DDL
- defining a list of select clause columns in SQL statement
- defining a list of arguments for a stored function

## MAINTENANCE:

- when adding new ZodType instances you need to update two functions because
  each introspects the type and wraps zodType._def in SQL-friendly props:
  - za.clonedZodType(zodType)
  - sqlDomain(zodType)

## Cross-platform DB Types to add

These should be setup as pre-defined so each governed schema does not need to
recreate (in `sqlType` use the dialect to generate DB-specific variations):

- [ ] array
- [ ] bigint
- [ ] bigserial
- [ ] blob
- [ ] boolean
- [ ] char
- [ ] cidr
- [ ] date
- [ ] double-precision
- [ ] enum
- [ ] inet
- [ ] integer
- [ ] interval
- [ ] jsonb
- [ ] json
- [ ] macaddr8
- [ ] macaddr
- [ ] numeric
- [ ] real
- [ ] serial
- [ ] smallint
- [ ] smallserial
- [ ] text
- [ ] timestamp
- [ ] time
- [ ] uuid
- [ ] varchar

## TODO:

- consider creating new, native, Zod instances instead of wrapping Zod
  https://github.com/jaylmiller/zodsql/blob/main/src/column.ts
- consider monkey-patching Zod instances
  https://github.com/IvanovES/zod-metadata/blob/main/src/index.ts
