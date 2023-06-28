---
title: Roadmap
---

# Roadmap

_This is a draft page and isn't really a "Roadmap" yet, just mainly some notes
about what features and enhancements we need. It needs significant formatting._

## Governance

- [ ] Learn from [DataHub](https://datahubproject.io/docs/features) about how to
      document and manage meta data ('data governance') artifacts and
      incorporate appropriate governance capabilities. These are DataHub
      features we should understand and perhaps push into DataHub:
  - [ ] Tracing lineage across platforms, datasets, pipelines, charts, etc.
  - [ ] Context about related entities across lineage
  - [ ] Capture and maintain institutional knowledge using folksonomic
        identifiers (tags) and taxonomies
  - [ ] Asset ownership by users and/or user groups
  - [ ] Fine-Grained Access Control with Policies
  - [ ] Metadata quality & usage analytics

## Safety and Security Capabilities

- [x] String literals for injection-safe SQL generation
  - [ ] Integration of
        [pg-format](https://github.com/grantcarthew/deno-pg-format)

## Information Model Evolution (migrations, etc.)

See [Atlas open\-source schema migration tool](https://atlasgo.io/) and create a
SQLa to Atlas schema / DDL file.

See [EdgeDB Migrations](https://www.edgedb.com/showcase/migrations) for some
interesting ideas.

Consider generating [Flyway](https://flywaydb.org/documentation/command/migrate)
and Liquibase migrations.

## DDL (Data Definition Language)

There are two types of DDL: _seed_ and _evolution_ (also known as _migration_).

- [x] Support non-idempotent _seed_ DDL generation using string literal
      templates
- [ ] Support idempotent _evolution_ (_migration_) DDL generation
- [x] CREATE: This command is used to create the database or its objects (like
      table, index, function, views, store procedure, and triggers).
  - [x] Optionally show lint issues as comments
  - [ ] `create table` index rules similar to TableConstraint object - see
        https://use-the-index-luke.com/ for some good ideas
- [!] DROP: This command is used to delete objects from the database.
- [ ] ALTER: This is used to alter the structure of the database.
- [ ] TRUNCATE: This is used to remove all records from a table, including all
      spaces allocated for the records are removed.
- [ ] COMMENT: This is used to add comments to the data dictionary.
- [ ] RENAME: This is used to rename an object existing in the database.
- [ ] support
      [multi-tenant SaaS using Row-Level Security](https://www.thenile.dev/blog/multi-tenant-rls)

## DQL (Data Query Language)

- [x] Trusted SELECT statement to read typed data
- [x] Basic single-entity focused SELECT generated using `table.select({})`
      where object has typed-column names and values are either JS literals or
      SQL expressions.
  - [ ] composable `eq` ("="), `in`, `lt` (less than), `gt` (greater than),
        `lteq`, `gteq`, etc. helpers for choosing criteria conditions for
        values; or, a single `is('=', value)`, `is('>=', value)`,
        `is('in', [...])`, etc.
  - [ ] composable `join` helper for links - without creating yet another DSL on
        to of SQL, allow simple `filter` key on the criteria record similar to
        EdgeDB to introduce JOINs.
  - [ ] composable `order` and `page` helpers.
- [ ] support
      [multi-tenant SaaS using Row-Level Security](https://www.thenile.dev/blog/multi-tenant-rls)
- [ ] generate SQL from [PRQL](https://github.com/prql/prql) using CLI or WASM
      bindigns.
- [ ] Embed SQL statement identities into SQL comments so that slow query
      analyzers and other query planners can distinguish between statements.
- [ ] Simplified type-safe NEFS Axiom-style _query builder_ (select generator)
      using links and filters for typical needs while full SQL is available as
      complexity increases. See [EdgeDB](https://edgedb.com) for interesting
      ideas (such as _composition_, _aggregation functions_, and _nested
      filters_). Read more about the query builder at
      [Designing the ultimate TypeScript query builder](https://www.edgedb.com/blog/designing-the-ultimate-typescript-query-builder).
  - [ ] composable `filter` property
    - [ ] as a function, it would allow user-agent side filtering
          `{ ..., filter: () => [] }`
    - [ ] as a `FilterCriteria`, it would allow SQL-side filtering
- [ ] Untrusted SELECT statement auto-wrapped in CTE for multi-tenant or other
      security policy adherence. This allows aribtrary SQL to be sent from
      untrusted clients but additional where criteria is added via CTE wrapper.
- [ ] [dql/with.ts](https://modern-sql.com/feature/with) similar to how views
      work (type-safe); this will allow us to use
      [transient data](https://modern-sql.com/use-case/unit-tests-on-transient-data)
  - [ ] Creat CTE-based view or stored function returning SETOF TABLE that would
        allow storing data in SQL view code or a LANGUAGE SQL STRICT IMMUTABLE
        function. This would allow us to use to create small "view tables" for
        storing configuration as code (e.g. confidential password data can be
        stored in secure location of server as stateless code to be pulled in
        regularly instead of treated as stateful data in tables). The
        `dcp_context.context` table as well as many other tiny tables could just
        be replaced as views or, at worst, materialed views in case performance
        becomes an issue. The primary benefit of creating rows in small tables
        as views is stateful vs. stateless maintenance.
  - [ ] See if [Kysely](https://koskimas.github.io/kysely/index.html) or similar
        makes sense as type-safe query builder. SNS is not a big fan of using
        anything other than SQL string templates but perhaps if it's type-safe
        enough for non-SQL-experts to use, Kysely could be a candidate.

## DML(Data Manipulation Language)

- [x] Type-safe INSERT single TS/JS object row with `returning` support
  - [x] INSERTS with auto-selected foreign key IDs using `table.select()`
  - [ ] Nested INSERTs with automatic foreign-key support (see
        [EdgeDB nested inserts](https://www.edgedb.com/blog/designing-the-ultimate-typescript-query-builder#nested-inserts))
- [ ] Type-safe INSERT single TS/JS array row with `returning` support
  - [ ] Type-safe INSERT single TS/JS delimited string (e.g. CSV) row with
        `returning` support using string to array transformer
- [ ] Type-safe INSERT multiple TS/JS object rows in single statement (no
      `returning` support)
- [ ] Type-safe INSERT multiple TS/JS array rows in single statement (no
      `returning` support)
  - [ ] Type-safe INSERT multiple delimited string (e.g. CSV) rows in single
        statement (no `returning` support)
- [ ] Support two different kinds of default data: `data storage default` (DSD)
      vs. `user agent session default` (UAD). DSDs are good for values such as
      `created_at` which don't have security policy implications but need to be
      set before storing into the database. UASDs are useful for things like
      `tenant_id`, `fingerprint`, `person_id`, `user_id`, `party_id` or
      multi-tenant / security policy information that comes from user agent
      sessions. UASDs would allow unsafe SQL DML to come from user agents (apps,
      services) but automatically get filled in with _user agent session
      default_ data.
- [ ] incorporate data validation using [ow](https://sindresorhus.com/ow/) or
      similar library as inspiration to show how to wrap domains with data
      validators
- [ ] Use [typebox](https://github.com/sinclairzx81/typebox) or similar to
      generate JSON Schema for each model independently as well as a unified one
      for the entire graph.
  - [ ] If we can generate the JSON Schema tied to Axiom and our domains, then
        [Ajv JSON schema validator](https://ajv.js.org) and other widely used
        libraries can be used to manage the validations without us having to do
        much
- [ ] Logical UPDATE (support immutable records by _updating_ values using
      _inserts_)
- [ ] Physical UPDATE
- [ ] Upsert
- [ ] DELETE
- [ ] CALL: Call a PL/SQL or JAVA subprogram.
- [ ] EXPLAIN PLAN
  - [ ] Integrate with https://explain.dalibo.com/, https://explain.depesz.com/,
        and other visualizers.
- [~] LOCK: Table control concurrency.

## PL (Procedural or Programming Language)

- [x] BODY defines PL (stored function or stored procedure) body
- [x] CONTRACT defines the header, parameter, etcs.

## DCL (Data Control Language)

- [ ] GRANT: This command gives users access privileges to the database.
  - [ ] Refer to https://supabase.com/blog/2021/07/01/roles-postgres-hooks for
        how to manage complex policies such as roles across multiple tenants
- [ ] REVOKE: This command withdraws the user’s access privileges given by using
      the GRANT command.

## TCL (Transaction Control Language)

- COMMIT: Commits a Transaction.
- ROLLBACK: Rollbacks a transaction in case of any error occurs.
- SAVEPOINT: Sets a savepoint within a transaction.
- SET TRANSACTION: Specify characteristics for the transaction.

## Dialect/Engine-specific

These engines / dialects are supported:

- [x] ANSI SQL
- [x] SQLite
  - [ ] Test with [postlite](https://github.com/benbjohnson/postlite),
        [rqlite](https://github.com/rqlite/rqlite) or
        [mvSQLite](https://github.com/losfair/mvsqlite) to allow access to
        SQLite remotely
- [x] PostgreSQL
  - [ ] Create public [bit.io](https://bit.io/) PostgreSQL database to run unit
        tests
- [ ] [DuckDB](https://duckdb.org/) in-process SQL OLAP database management
      system
- [ ] [SurrealDB](https://surrealdb.com/)
- [ ] [dbt](https://www.getdbt.com/) artifacts for transformations = [ ]
      [libSQL](https://github.com/libsql/libsql) with
      [pgwire](https://github.com/sunng87/pgwire)
- [ ] read-only shell commands
  - [ ] [pg-server](https://github.com/oguimbal/pg-server#-usage-as-a-postgres-server-emulator)
        infrastructure for CLI SQL commands
  - [ ] `mergestat` Git SQL
  - [ ] `fselect` File System SQL
  - [ ] `osqueri` infrastructure SQL
  - [ ] `steampipe` infrastructure SQL
  - [ ] `cloudquery` infrastructure SQL
  - [ ] `iasql` infrastructure SQL
  - [ ] [octosql](https://github.com/cube2222/octosql) poly-source SQL
  - [ ] [dsq](https://github.com/multiprocessio/dsq) poly-source SQL with logs
        support; includes
        [go-sqlite3-stdlib](https://github.com/multiprocessio/go-sqlite3-stdlib)
        advanced statistical support as well
- [ ] AlaSQL
- [x] read-write shell commands
  - [ ] [Universal CLI](https://github.com/xo/usql)
- [ ] MySQL
- [ ] Dolt
- [ ] SQL*Server
- [ ] ORACLE
- [ ] EdgeDB

References:

- [PostgreSQL Vs MySQL Syntax](https://tipseason.com/postgres-vs-mysql-syntax-comparision/)

## Dialect Engines

- [ ] Universal
      [PostgreSQL wire interface pg-server](https://github.com/oguimbal/pg-server#-usage-as-a-postgres-server-emulator)
      to as many different engines as possible. When an engine (like DuckDB or
      osQuery, etc.) do not have native TS/JS support consider wrapping in
      `pg-server`.
- [ ] Universal `SqlEngine` and `SqlEngineInstance` interfaces and
      engine-specific implementations to prepare SQL, send into a specific
      database driver and return typed rows (array) or object lists as query
      execution results. All SQL engines support the same query execution
      results so that results and queries can be mixed/matched across engines.

## Engineering and QA (IDE)

- [ ] Render
      [SQL Notebook](https://marketplace.visualstudio.com/items?itemName=cmoog.sqlnotebook)
      output that will allow interactive use through VS Code.

## PostgreSQL

- [x] Anonymous PL/pgSQL and PL/SQL blocks
- [x] Stored procedures definition (namespaced and type-safe)
  - [ ] Should these be moved to ANSI dialect and not specific to PG only?
- [x] Stored functions definition (namespaced and type-safe)
- [ ] Stored routine definition STABLE and other type-safe modifiers
- [ ] CALL stored procedure (SqlTextSupplier as a new stored routine object
      property similar to how a InsertStatementPreparer works. Just like DML is
      tied to a table, CALL should be tied to stored routine header(s) so that
      there's full type-safety integrated into the call)
- [x] Domains
- [x] Extensions
- [x] search_path

## Structural Lint Rules

The system generates lint messages:

- [ ] Missing indexes for primary keys, foreign keys (see
      https://use-the-index-luke.com/)
- [x] Plural vs. singular naming checks
- [x] Foreign key column name should be `X_id` where `X` is the referenced Fkey
      column name
  - [x] `_id` attributes that are not foreign keys (might be OK, might be a
        mistake)
- [ ] Suggest foreign keys when column name is similar to a table names but fkey
      is not defined
- [ ] Integrate advice from
      [Ordering Table Columns in PostgreSQL](https://docs.gitlab.com/ee/development/ordering_table_columns.html)
- [ ] Integrate [SQLFluff](https://github.com/sqlfluff/sqlfluff) or learn from
      their rules.

## Content Lint and Data Validation Rules

- [ ] [Soda Checks Language](https://docs.soda.io/soda-cl/soda-cl-overview.html)
      (SodaCL) style validation rules

## General TODOs

- [ ] Evaluate
      [pg-server](https://github.com/oguimbal/pg-server#-usage-as-a-postgres-server-emulator),
      [pg\-protocol](https://github.com/brianc/node-postgres/tree/master/packages/pg-protocol)
      and [PostgreSQL wire interface](https://github.com/kagis/pgwire) to see if
      it makes sense to unify all access to SQLite and other databases via
      `pg-server`. You can use ChatGPT to create an example by giving it this
      prompt: "Write Typescript code which uses pg-server library to create a
      simple server that can serve custom data using the PostgreSQL wire
      protocol.".
- [ ] Add [`dax` shell tools](https://github.com/dsherret/dax) `SqlTextSupplier`
      wrapper to run external commands, create files, and incorporate their
      output or file references in SQL scripts.
- [ ] integrate [sqlean](https://github.com/nalgeon/sqlean) for advanced SQLite
      functions
- [ ] see if we can get types from SQL select strings using
      [Extract parameter types from string literal types](https://lihautan.com/extract-parameters-type-from-string-literal-types-with-typescript/)
- [ ] Incorporate A16z's
      [Emerging Architectures](https://future.com/emerging-architectures-modern-data-infrastructure/)
      nomenclature and concepts.
- [ ] Check out [Cell Programming Language](https://www.cell-lang.net/) for
      ideas around "stateful programs" and their built-in relationships (vs.
      objects capabilities)
- [ ] Support DOP principles described in
      https://www.manning.com/books/data-oriented-programming
- [ ] Use https://github.com/lorint/AdventureWorks-for-Postgres for unit tests?
  - [ ] Use public [bit.io](https://bit.io/) PostgreSQL database for tests?
- [ ] Use https://github.com/manyuanrong/sql-builder to add tableDefn.select``
- [ ] Add type-safe where criteria builder in DQL SELECT statements so that
      outbound select columns are properly typed but so are in-bound where
      criteria with proper bind-able parameters (using ? or :name strategies).
  - Most of the value should not be derived for generating static SQL
    expressions (which should be written out whenever possible) but using
    Sparx-like QueryDefn dynamic generator for end-user selections
    https://github.com/netspective/NEFS/tree/master/Axiom/src/java/main/com/netspective/axiom/sql/dynamic
    https://github.com/l3aro/pipeline-query-collection
  - We should create a new `where` (or `SQL Expressions`) specific string
    templates literal that can accept experssions like `${a.xyz}` or `${wc.abc}`
    or `${from.name}`.
    - `a` is "SQL statement argument" (similar to stored routines arguments)
      that would automatically emit properly quoted arguments.
    - `wc.*` would be where criteria or similar string builder expressions that
      are in common use like `${wc.in()}` -- be careful to only introduce `wc`
      convenience for type-safety and not make people learn yet another language
    - `from.*` would work by matching `name` with any`TableDefinition` or
      `ViewDefinition` instances in the current scope.
    - `sp.*` and `sf.*` or `sr.*` would point to known stored routines and
      allowing calling them like `${sp.abc(p1, p2, p3)}` which could translate
      to `CALL abc('p1value', p2Value, 'p3value')` etc.
      - each stored routine (stored function/procedure) should have a
        SqlTextSupplier that would generate a `CALL abc(...)` in a type-safe
        manner and not require duplication of SQL. Something like this:
        `${schema.srDefn.call(x, y, z)}`
  - Only introduce high-value type-safety features into template expressions
    which would enhance readability or improve the SQL, not try to replace it or
    create another DSL. `SQLa` is about SQL assembly, not replacing SQL.
- [ ] Implement dml/dto.ts for type-safe Axiom-based data transfer objects
      to/from camel-case JS objects and snake_case SQL-style records
- [ ] [My other database is a compiler](https://blog.chiselstrike.com/my-other-database-is-a-compiler-10fd527a4d78)
      has some interesting ideas about how to take Typescript arrow functions
      and generate SQL from them. Perhaps we can do the same for basic SQL and
      leave advanced SQL for hand-coding?
- [ ] Incorporate
      [Database Performance for Developers](https://use-the-index-luke.com/)
      suggestions into SQLa renderers so that developers just have to give
      feature flags and the proper SQL is generated for them.
- [ ] Incorporate
      [Evolutionary Database Design](https://martinfowler.com/articles/evodb.html)
      principles into SQL rendering infrastructure.
- [ ] See if
      [Database Change and Version Control for Teams](https://www.bytebase.com/_nuxt/img/main.a176dc4.webp)
      makes sense as a generator target.
- [ ] Integrate strategies from the following into the code generated by RF:
  - [ ] [Lesser Known PostgreSQL Features](https://hakibenita.com/postgresql-unknown-features)
  - [ ] [GitLab Migration Style Guide](https://docs.gitlab.com/ee/development/migration_style_guide.html)
  - [ ] [Common DB schema change mistakes](https://postgres.ai/blog/20220525-common-db-schema-change-mistakes#case-1-schema-mismatch)
- [ ] See if it makes sense to integrate
      [arquero](https://uwdata.github.io/arquero/) data frames.

### Related Code

- [ ] Integrate [xlite](https://github.com/x2bool/xlite) SQLite extension to
      query Excel (.xlsx, .xls, .ods) files as virtual tables
- [ ] Integrate [litetree](https://github.com/aergoio/litetree), SQLite with
      Branches (`git`-style)
- [ ] Dependency graphs (relationships from FKs, links, etc.)
- [ ] Generate PlantUML Information Engineering diagrams
- [ ] Consider whether SQLa could join the [UnifiedJs](https://unifiedjs.com/)
      community as another ecosystem (like `remark`, `rehype`, `redot`, etc.)
      with a custom SQL syntax tree (`sst`?) or `unist`.
- [ ] Generate `IMM` markdown files as human-readable documentation
- [ ] Generate [DataHub](https://datahubproject.io/)-ingestable governance meta
      data
- [ ] Generate ORM configurations from SQLa entity definitions
  - [ ] [Kysely](https://github.com/koskimas/kysely)
  - [ ] https://mikro-orm.io/
  - [ ] TypeORM
- [ ] Zod interoperability (convert to/from Axiom and
      [Zod](https://github.com/colinhacks/zod)) because
      [Zod's ecosystem](https://github.com/colinhacks/zod#ecosystem) appears
      robust
  - [ ] See [Slonik](https://github.com/gajus/slonik) integration with Zod as
        inspiration

## References

- [Nine ways to shoot yourself in the foot with PostgreSQL](https://philbooth.me/blog/nine-ways-to-shoot-yourself-in-the-foot-with-postgresql)
