---
title: Resources
sidebar:
  order: 12
---

## PgDCP Engineering Resources

Platform and site reliability engineers should review:

- [psql command line tutorial and cheat
  sheet](https://github.com/tomcam/postgres)
- [Postgres features showcase \(commented SQL
  samples\)](https://github.com/cybertec-postgresql/postgres-showcase)
- [postgres_dba](https://github.com/NikolayS/postgres_dba) set of useful tools
  for Postgres DBAs and all engineers
- [Set of Practices](https://kukuruku.co/post/postgresql-set-of-practices/) for
  common PG engineering suggestions
- [pgcenter](https://github.com/lesovsky/pgcenter) CLI tool for observing and
  troubleshooting Postgres
- [PGXN client](https://github.com/pgxn/pgxnclient) CLI tool to interact with
  the PostgreSQL Extension Network
- [Useful views and functions for postgreSQL
  DBA's](https://github.com/sahapasci/dba.postgresql)
- [Postgres extension to introspect postgres log
  files](https://github.com/sroeschus/loginfo) from within the database
- [Postgres clone schema utility](https://github.com/denishpatel/pg-clone-schema)
  without need of going outside of database. Makes developers life easy by
  running single function to clone schema with all objects. It is very handy on
  Postgres RDS.
- [An unassuming proposal for PLSQL Continuous Integration using revision
  control, Jenkins and Maven\.](https://github.com/pauldzy/Tentative_PLpgSQL_CI)
- [Securing Your PostgreSQL Database](https://goteleport.com/blog/securing-postgres-postgresql/)
- [Advanced multi\-threaded PostgreSQL connection pooler and request router](https://github.com/yandex/odyssey)
- [Postgres Container Apps: Easy Deploy Postgres Apps](https://blog.crunchydata.com/blog/announcing-postgres-container-apps-easy-deploy-postgres-apps)

Engineers writing stored routines (functions, SPs) should review:

- [Boost your User-Defined Functions in
  PostgreSQL](https://www.ongres.com/blog/boost-your-user-defined-functions-in-postgresql/)
  describes some useful techniques for improving UDFs.
- [Building a recommendation engine inside Postgres with Python and
  Pandas](https://blog.crunchydata.com/blog/recommendation_engine_in_postgres_with_pandas_and_python)
- [postgresql\-plpython\-webservice](https://github.com/bryantbhowell/postgresql-plpython-webservice)
  shows how to caching web service requests via PL/Python
- [Metagration](https://github.com/michelp/metagration), a PostgreSQL migration
  tool written in PostgreSQL
- [BedquiltDB](https://bedquiltdb.github.io/) is a JSON document-store built on
  PostgreSQL using PL/Python

Engineers writing applications should consider these PostgreSQL-native
libraries:

- [makeExtendSchemaPlugin](https://www.graphile.org/postgraphile/make-extend-schema-plugin/)
  merges additional GraphQL types and resolvers into a Postgraphile PostgreSQL
  schema using a similar syntax to
  [graphql-tools](https://www.graphql-tools.com/docs/generate-schema).
- [uuid\-ossp](https://www.postgresql.org/docs/13/uuid-ossp.html) for UUIDs as
  primary keys
- [Universally Unique Lexicographically Sortable Identifier \(ULID\)](https://github.com/iCyberon/pg_ulid)
- [ltree](https://www.postgresql.org/docs/13/ltree.html) for representing labels
  of data stored in a hierarchical tree\-like structure
- [pg_trgm](https://www.postgresql.org/docs/11/pgtrgm.html) module provides
  functions and operators for determining the similarity of alphanumeric text
  based on trigram matching
- [simplified auditing based on SQL logging and FDWs to import
  logs](https://mydbanotebook.org/post/auditing/) instead of writing triggers
  - [Audit Trigger 91plus](https://wiki.postgresql.org/wiki/Audit_trigger_91plus)
    generic trigger function used for recording changes to tables into an audit
    log table
  - [pgMemento](https://github.com/pgMemento/pgMemento) provides an audit trail
    for your data inside a PostgreSQL database using triggers and server\-side
    functions written in PL/pgSQL
  - [Temporal Tables PostgreSQL Extension](https://github.com/arkhipov/temporal_tables)
- [pg_cron](https://github.com/citusdata/pg_cron) to run periodic jobs in
  PostgreSQL
- [shortkey](https://github.com/turbo/pg-shortkey) for YouTube-like Short IDs as
  Postgres Primary Keys
- [dexter](https://github.com/ankane/dexter) automatic indexer
- [message-db](https://github.com/message-db/message-db) message and event store
- [RecDB Recommendation Engine](https://github.com/DataSystemsLab/recdb-postgresql)
- [pg_similarity](http://www.postgresql.org/) extension to support similarity
  queries on PostgreSQL
- [dox Document Database API extension](https://github.com/robconery/dox) when
  needing simple JSON store
- [colpivot.sql](https://github.com/hnsl/colpivot) dynamic row to column
  pivotation/transpose
- [Guidance to implement NIST level 2 RBAC Hierarchical
  RBAC](https://github.com/morenoh149/postgresDBSamples/tree/master/role-based-access-control)
  in PostgreSQL
- [ldap2pg](https://github.com/dalibo/ldap2pg) to synchronize Postgres roles and
  privileges from YAML or LDAP
- [SeeQR](https://www.theseeqr.io/) database analytic tool to compare the
  efficiency of different schemas and queries on a granular level
- [postgres\-basename\-dirname](https://github.com/elfsternberg/postgres-basename-dirname)
  contains functions which provide equivalents to the POSIX functions basename
  and dirname
- [postgresql\-similarity](https://github.com/urbic/postgresql-similarity)
  extension package which provides functions that calculate similarity between
  two strings
- [pg\_median\_utils](https://github.com/greenape/pg_median_utils) functions
  like median_filter which behaves the same as SciPy's
  [medfilt](https://docs.scipy.org/doc/scipy-0.14.0/reference/generated/scipy.signal.medfilt.html)
- [orafce](https://github.com/orafce/orafce) ORACLE compatibility functions
- [postgres\-typescript](https://github.com/Portchain/postgres-typescript)
  generates typescript functions from SQL files and lets you call these
  functions from your app
- [SPARQL compiler functions for
  PostgreSQL](https://github.com/lacanoid/pgsparql)
- [PL/pgSQL implementation of hashids
  library](https://github.com/andreystepanov/hashids.sql), another alternative:
  [plpg\_hashids](https://github.com/array-analytics/plpg_hashids)
- [Helpers for PL/pgSQL applications](https://github.com/luk4z7/plpgsql-tools)
- [session\_variable](https://github.com/splendiddata/session_variable) Postgres
  database extension provides a way to create and maintain session scoped
  variables and constants, more or less like Oracle's global variables
- [Git Based Application Configuration](https://github.com/PaulHatch/konfigraf),
  a Postgres extension that allows you to store and manipulate data in Git
  repositories stored in tables within the database. This is designed to be used
  for storage of configuration data for applications and services.
- [PostgreSQL extension with support for version string
  comparison](https://github.com/repology/postgresql-libversion)

Engineers writing SQL-first code should use the following tools:

- [sqlcheck](https://github.com/jarulraj/sqlcheck) and
  [plpgsql_check](https://github.com/okbob/plpgsql_check) for linting SQL source
  code
- [pgTAP](https://pgtap.org/) - Database testing framework for Postgres
- [pgcmp](https://github.com/cbbrowne/pgcmp) for comparing Postgres database
  schemas
- [Web-based Explain Visualizer \(pev\)](https://github.com/AlexTatiyants/pev)
  and
  [CLI query visualizer (gocmdpev)](https://github.com/simon-engledew/gocmdpev)
  for performance optimization
- [JSON Schema validation for PostgreSQL](https://github.com/gavinwahl/postgres-json-schema)
  when using JSON and JSONB columns
- Use [readable database errors](https://github.com/Shyp/go-dberror) as a guide
  for creating errors in the database which can be used in the front-end
- [postgresqltuner](https://github.com/jfcoz/postgresqltuner) script to analyse
  PostgreSQL database configuration, and give tuning advice
- Use [HyperLogLog data structures](https://github.com/citusdata/postgresql-hll)
  and [TopN PostgreSQL extension](https://github.com/citusdata/postgresql-topn)
  for higher performing value counting when data amounts get large
- See [GraphQL for Postgres](https://github.com/solidsnack/GraphpostgresQL)
  which teaches techniques for how to parse GraphQL queries and transform them
  into SQL, all inside PostgreSQL (this is not production-level code but is good
  for education)
- [Plugin for prettier to support formatting of PostgreSQL\-flavour
  SQL](https://github.com/benjie/prettier-plugin-pg), including function bodies
  in SQL, pgSQL, PLV8, plpython, etc.

Engineers needing to instrument PostgreSQL:

- Deno [Postgres SQL parser](https://github.com/oguimbal/pgsql-ast-parser)
- [pg\_query 2\.0: The easiest way to parse Postgres
  queries](https://pganalyze.com/blog/pg-query-2-0-postgres-query-parser)

Machine Learning without leaving PostgreSQL:

- [Apache MADlib](https://madlib.apache.org/)
- [mindsdb.com](https://mindsdb.com/) for machine Learning without leaving the
  database

Content engineers who need datasets:

- [pgloader](https://pgloader.readthedocs.io/en/latest/index.html) loads data
  from various sources into PostgreSQL
- [ISO\-3166 \- All countries and subcountries in the
  world](https://github.com/morenoh149/postgresDBSamples)

Precision Knowledge:

- [Lesser Known PostgreSQL Features](https://hakibenita.com/postgresql-unknown-features)
- [Evolutionary Database Design](https://martinfowler.com/articles/evodb.html)
- [Intuit’s Data Mesh Strategy](https://medium.com/intuit-engineering/intuits-data-mesh-strategy-778e3edaa017)
- [Web development platform built entirely in
  PostgreSQL](https://github.com/aquametalabs/aquameta)
- [Postgres Analytics \- Tips, best practices &
  extensions](https://github.com/swarm64/webinar-pg-analytics)
- [OWASP API Security Project](https://owasp.org/www-project-api-security/)
- [Beyond REST](https://netflixtechblog.com/beyond-rest-1b76f7c20ef6) is
  Netflix's approach to Rapid Development with GraphQL Microservices
- [6 Common Mistakes for SQL Queries that "Should be
  Working"](https://blog.arctype.com/6-common-mistakes-for-sql-queries/)
- [Postgres Notify for Real Time
  Dashboards](https://blog.arctype.com/postgres-notify-for-real-time-dashboards/)
- [Postgres regex search over 10,000 GitHub repositories \(using only a
  Macbook\)](https://devlog.hexops.com/2021/postgres-regex-search-over-10000-github-repositories)
- [How to Modernize Your Data & Analytics
  Platform](https://www.linkedin.com/pulse/part-1-3-how-modernize-your-data-analytics-platform-alaa/)
  parts
  [one](https://www.linkedin.com/pulse/part-1-3-how-modernize-your-data-analytics-platform-alaa),
  [two](https://www.linkedin.com/pulse/part-2-3-how-modernize-your-data-analytics-platform-alaa),
  [three](https://www.linkedin.com/pulse/part-3-4-toolkit-modernizing-transmission-system-data-alaa-mahjoub),
  and
  [four](https://www.linkedin.com/pulse/part-4-toolkit-modernizing-transmission-system-data-platform-mahjoub).
