---
title: Polyglot but SQL-first
---


Our first choice of languages for writing data-centric micro services should be:

- Pure SQL views, materialized views, and stored routines using
  [Postgraphile Schema Design](https://www.graphile.org/postgraphile/postgresql-schema-design/).
- pgSQL views and materialized views and PL/pgSQL stored functions and stored
  procedures when pure SQL is not possible, using
  [Postgraphile Schema Design](https://www.graphile.org/postgraphile/postgresql-schema-design/).

In case SQL or PL/pgSQL is not appropriate:

- PL/Rust, PL/Java, PL/Go, [PL/Deno](https://github.com/supabase/postgres-deno)
  or other type-safe PostgreSQL-hosted language should be prioritized.
- If type-safety is not possible or 3rd party libraries access is more important
  than type-safety then PL/Python, PL/Perl, and other languages should be
  considered.
  - When using PL/Python or other language with package managers, consider using
    guidance such as
    [programmatic access to PIP modules](http://jelly.codes/articles/python-pip-module/)
    so that PostgreSQL server admins are not required for administering module
    dependencies
- The choice of language should depend on how easy the functionality can be
  expressed using
  [Postgraphile Schema Design](https://www.graphile.org/postgraphile/postgresql-schema-design/).

[Cut Out the Middle Tier: Generating JSON Directly from Postgres](https://blog.crunchydata.com/blog/generating-json-directly-from-postgres)
is a good HN discussion about the benefits and pitfalls of the PgDCP approach.
