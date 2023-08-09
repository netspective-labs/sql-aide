# Key/Value Pairs (`kv`) Aide

The `kv` module provides utilities to convert complex, nested objects into a
more manageable structure for storage in a key-value (KV) store.

- `keysValues` takes an object and converts it into an array of key-value pairs,
  each with an associated version number (if a versioning function is supplied).
  It flattens nested structures into a list of key paths, and assigns a version
  number to each distinct path if requested.

* `typicalEntityKV` returns an object which accepts a typed object and returns
  several utility functions.

# TODO

- [ ] Use [ulid](https://deno.land/x/ulid) as default identity strategy
- [ ] Review [deno-kv-sqlite](https://github.com/jsejcksn/deno-kv-sqlite)
      Key-Value storage backed by SQLite to see if we want to incorporate that
      style into SQLa (but generalize it so that it can be backed by any SQL
      database)
- [ ] Review [kvdex](https://github.com/oliver-oloughlin/kvdex) Database wrapper
      for Deno KV to see if we can apply an SQL layer on top
- [ ] Review [deno-kv-plus](https://github.com/Kycermann/deno-kv-plus)
      Transactions that commit without overwriting one another, for Deno KV. If
      we went end up using Deno KV as a store we might want to use this or
      integrate it into SQLa
- [ ] Review [graphql-yoga](https://github.com/dotansimha/graphql-yoga) and
      [denokv-graphql](https://github.com/vwkd/denokv-graphql) GraphQL bindings
      for Deno KV as a potential replacement for SQL in case SQL on top of Deno
      KV is too hard.
