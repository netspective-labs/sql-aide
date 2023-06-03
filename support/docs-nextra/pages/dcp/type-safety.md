---
title: Client Application-friendly Type-safety _in the Database_
---

# Client Application-friendly Type-safety _in the Database_

Modern applications demand type-safety (which is why PgDCP recommends TypeScript
or Rust for applications). Since applications should be type-safe, we want our
data models and database objects to also be type-safe. To enhance type-safety,
create custom [domains](https://www.postgresql.org/docs/current/domains.html),
custom enumerations or lookup tables based on inheritance,
[business types](https://www.postgresql.org/docs/current/sql-createtype.html),
and
[inheritable transaction tables](https://www.postgresql.org/docs/current/ddl-inherit.html)
("table types"). Once you're using table inheritance you can use
[table inheritance wrapper functions](https://github.com/trimark-jp/tm-postgres-basics).

## GraphQL-first but REST-capable _in the Database_

All micro services code in PostgreSQL tables, views, functions and stored
procedures will be surfaced through Postgraphile GraphQL first but our AutoBaaS
requirements are that all services should be exposed through safe and secure
REST interfaces via PostgREST (or [pREST](https://github.com/prest/prest)) as a
fallback for non-GraphQL clients. We favor Postgraphile's GraphQL API because it
generates code which honors PostgreSQL security, roles, and unique features more
faithfully than other utilities such as Hasura.
