---
title: Why DCP
---

# PostgreSQL Data Computing Platform (PgDCP)

SQL Aide (`SQLa`) was created as the infrastructure for PgDCP, an approach for
using PostgreSQL to host tables, views, plus polyglot stored routines and
surface them as GraphQL and REST using Postgraphile, Hasura, and PostgREST (or
[pREST](https://github.com/prest/prest)).

Using PostgreSQL whenever possible is called our _Zero Middleware_ automated
backend as a service (AutoBaaS) strategy. AutoBaaS helps us eliminate signficant
amounts of GraphQL and REST boilerplate code plus reduces the number of
microservices we need to deploy and manage.

_Zero Middleware_ is first and foremost a _technology strategy_ but also comes
with a framework of code generators and reusable components to reducing
data-centric code surfaces to just PostgreSQL with auto-generated,
database-first _secure_ GraphQL and REST endpoints. For use cases when
higher-performance or more secure interfaces are necessary, direct access to
tables, views, and stored routines using PostgreSQL wire protocol is encouraged.

We use `psql` and pure-Postgres migrations as Database as Code (“DaC”) for DDL,
DQL, DML, etc. when possible. Instead of relying on 3rd party dependencies for
schema migrations, we use PostgreSQL-first stored routines themselves along with
`psql` to manage idempotent migrations.

The overall objective for PgDCP is to reduce the number of tools that a
developer needs to know down to just PostgreSQL and `psql` along with SQL and
PL/* hosted languages for all services.

<Callout>
**Stateless, non-data-centric services, are out of scope and are not proper
candidates for PgDCP.**

PgDCP is not suitable for every type of service but it is a great choice for
stateful, data-centric services and applications that can leverage SQL natively.

If a custom micro service is completely stateless and does not have anything to
do with reading, processing or writing structured data, another architecture
should be considered.
</Callout>
