# SQL Aide (SQLa) Typescript template literals optimized for emitting SQL

[![codecov](https://codecov.io/gh/netspective-labs/sql-aide/branch/main/graph/badge.svg?token=DPJICL8F4O)](https://codecov.io/gh/netspective-labs/sql-aide)

For any modules that leverage SQL for functionality, assembling and loading SQL
in a deterministically reproducible manner is crucial. `SQLa` is like a static
site generator for SQL files that need to be loaded into a database.

`SQLa` is an _aide_ which helps prepare, organize, assemble, load, and revision
manage type-safe, _deterministically reproducible_, SQL code. SQL Aide (`SQLa`)
is a Deno TypeScript module which uses the power of JavaScript functions and
[Template literals (Template strings)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)
to prepare SQL components as composable building blocks ("SQL partials").

Instead of inventing yet another template language, `SQLa` uses a set of naming
conventions plus the full power of JavaScript (and TypeScript) template strings
to prepare the final SQL that will be assembled and loaded into the database.

`SQLa` is not an ORM or another layer in the middle between the application and
an RDBMS. Instead, `SQLa` is merely a convenient SQL _generator_ and assembler.
It makes the preparation of SQL DDL, DML, and DQL easier for developers but it
does not rewrite SQL or attempt to remove SQL knowledge.

## Init after clone

This repo uses git hooks for maintenance, after cloning the repo in your sandbox
please do the following:

```bash
deno task init
```

## Zod

`SQLa` uses
[Zod's TypeScript\-first schema validation with static type inference](https://zod.dev/)
capabilities to define data structures and introspects Zod's type-safe schema to
generates SQL. You can define tables, views, and other SQL DDL, DML and DQL
statements using Zod then use `SQLa` to emit database-agnostic SQL. This way
your data structures can be used with compile-type type checking but also be
useful at runtime on the server or user agents like browsers and mobile apps.

The bridge between Zod and SQLa is a mapping layer called `Zod Baggage`, defined
in `lib/universal/zod-aide.ts`. It's marked `universal` since it can be used for
other purposes but resides in this repo for convenience. The purpose of
`ZodTypedBaggage` and `zodBaggage` is to allow arbitrary meta data called
_baggage_ to be stored with Zod types (usually scalars). Using this bridge
library we can create SQL-specific data and store it alongside (literally inside
the `ZodType._def` object).

This library and documentation was initially written with a custom Zod-like
library called `Axiom`. In March 2023 Axiom was removed as our underlying data
infrastructure in favor of Zod (which has a
[vibrant ecosystem](https://zod.dev/?id=ecosystem)). Over time, more and more
Axiom legacy should be removed in favor of heavy Zod focus. For example:

- if we need a JSON Schema generated from a SQL DDL definition, we can just use
  a [Zod-to-JSON Schema](https://github.com/StefanTerdell/zod-to-json-schema)
  library without inventing anything ourselves.
- if we need utility functions to manage our Zod-based models try
  [Zod Utilz Framework agnostic utilities](https://github.com/JacobWeisenburger/zod_utilz).
- before writing any new modeling infrastructure code, check the Zod ecosystem;
  if we do end up inventing something, build it on top of Zod whenever possible.

## Terminology

- `domain` refers to the same concept as described in the SQL standard.
  - A domain should be considered an atomic data type, created using Zod as an
    infrastructure library, with optional constraints or restrictions that
    should be placed on what kind of data can go into an attribute or column.
  - `text`, `integer`, etc. are generic domains but a domain may also be
    `person_id`, `daily_purchase_amount`, or any custom business data.
- `attribute` or `property` refers to a named instance of a specific domain. For
  example, `person_id` can be a domain but once it's a named column of a table
  it becomes an _attribute_ or a _property_.
- `entity` is a concrete instance of a group of domain instances such as
  _attributes_ or _properties_. An _entity_ is usally a _table_ in SQL but might
  also be represented as a view or a stored function.
- `link` is a 1:n, n:1, or n:n relationship between entities.
  - Links are typically defined as foreign keys in SQL but could be represented
    as arrays in stored procedures or an ORM.
  - For example, if you had an Order entity (table) with order line and customer
    table foreign keys then the Order's links could be 1:n `items[]` and 1:1
    `customer`.
- `namespace` refers to _physical_ storage grouping (e.g. `schemas` in some
  databases).
- `information model module` (`IMM`) is a _logical_ grouping of multiple
  domains, entities, tables, views, schemas, namespaces, etc.

## Architecture and Strategy

In order to allow the most flexiblity, prefer composition through functions
rather than inheritance through classes.

The main SQLa rendering library should not have any opinions about how to
organize or model relational entities or attributions. That should be left to
consumers of SQLa. The `$RF_HOME/sql/models` module provides a `typical.ts`
which is an opinionated strategy for governing "typical" or "standard"
relational entities and attributes based on "best practices".

![Architecture](mod.drawio.svg)

## SQL rendering module organization

This SQL Aide (`SQLa`) library provides type-safe code generation for the
following types of SQL language constructs.

[Status symbols](https://xit.jotaen.net/):

- [x] Ready for use
- [@] Partially complete
- [ ] Planned, not started yet
- [~] Not planned but could be convinced to add
- [!] Implemented in NL Aide (resFactory/lib/sql) but not yet migrated to `SQLa`

### Domains

- [x] Zod scalars (`string`, `number`, etc.) transparently map to SQL domains
- [x] Text
- [ ] VARCHAR(x)
- [x] Number
- [ ] Date
- [ ] DateTime
- [ ] BigInt
- [ ] JSON
- [ ] JSONB
- [ ] full-text search
  - [ ] PostgreSQL `tsvector` with `GIN` index
  - [ ] PostgreSQL `tsquery`
- [ ] Constrained values using Axiom $.enum
- [ ] Symmetric encrypted text (for transactional data) with automatic
      `sensitive` labeling. See https://github.com/FiloSottile/age et. al but
      use built-in database capabilities through SQL whenever possible
- [ ] Asymmetric encrypted text (for passwords) with automatic `sensitive`
      labeling

#### Domain Capabilities

- [x] identity from Zod object declaration
- [ ] W3C [Decentralized Identifiers](https://www.w3.org/TR/did-core/) (DIDs)
- [x] Zod Typescript type
- [x] Zod Typescript default values
- [x] Zod descriptions
- [x] SQL type
- [x] SQL default values
- [ ] SQL size
- [ ] Zanzibar ([Permify](https://github.com/Permify/permify) style) ACLs
      definition at domain level with enforcement in SQL
- [ ] domain documentation for goverance ([DataHub](https://datahubproject.io/)
      style ERD documentation)
- [ ] type-safe domain labels/tags for governance
      ([DataHub](https://datahubproject.io/) style meta data)
  - [ ] scoped labels for additional governance (e.g. subject areas, PII, PHI,
        etc. grouping)
  - [ ] label sensitive ("secrets") columns so separate meta data is not
        required
  - [ ] label identity (PII, PHI) columns so separate meta data is not required
  - [ ] label validation and other policy
  - [ ] information model labels in case a domain is defined in regulatory or
        external standards (e.g. X12, HL7, FHIR, etc.)
- [x] SQL reference (for foreign key type mirroring where one columns knows
      another column's type automatically)
- [x] Data storage computed values using SQL (e.g. for defaults)
- [ ] Env Var and other dynamic server-side default values
- [ ] `lintIgnore(domain)` wrapper functions to skip certain lint warnings (like
      naming conventions for fkey columns ending in `_id`)
- [ ] User agent computed values for _business logic_ (similar to NEFS Axiom)
- [ ] User agent computed values for _presentation_ (similar to NEFS Axiom)
- [ ] synthetic data generation patterns (e.g. reg ex, functions, etc. that can
      auto-generate synthetic data)
- [ ] arrays of domains (e.g. Text[], Integer[], etc.), like in
      ../models/gitlab.ts
- [ ] JSON Schema properties contributions (each domain can contribute to a JSON
      schema collection)
- [ ] Delimited text (e.g. CSV) schema properties contributions (each domain can
      contribute to the definition of tabular data structure)
- [ ] [Invisible XML](https://invisiblexml.org/) schema properties contributions
- [ ] SQL constraints at storage layer
- [ ] TS/JS constraints for user agent business logic and presentation layers

### Multi-domain Capabilities

When two or more domains need to be coordinated, they are called multi-domains.

- [ ] Multi-domain computed properties

### Entities

- [x] Table
- [ ] Immutable Table (see _Data-Oriented Programming_ patterns)
- [ ] Enum Table (type-safe text key, text values, automatic seeds)
- [ ] Enum Table (text key, numeric values, automatic seeds)
- [ ] Association Table (`M:M` relationship between two entities)
- [ ] Data Vault 2.0 Tables (build on _Immutable Table_ patterns)
- [ ] Unified Star Schema (USS) "presentation layer" measures, bridges, etc.

#### Entities (Table) Capabilities

- [x] identity
- [x] columns ("attributes") declared as domains
- [x] primary key(s)
- [x] foreign key references (outbound)
- [ ] Zanzibar ([Permify](https://github.com/Permify/permify) style) ACLs
      definition in entities and enforcement in SQL
- [ ] columns referenced as foreign keys (inbound, aggregations, to define 1:M,
      1:1, M:1 "links")
- [ ] table labels/tags for grouping of tables like domain labels group columns
  - [ ] rollup sensitive-labeled columns and auto-label tables as sensitive
  - [ ] rollup identity-labeled (PII, PHI) columns and auto-label tables as
        PII/PHI
- [x] JSON Schema (from Zod)
- [ ] [Invisible XML](https://invisiblexml.org/) schema
- [ ] [CSV Schema](http://digital-preservation.github.io/csv-schema/csv-schema-1.1.html),
      [examples](https://github.com/digital-preservation/csv-schema/tree/master/example-schemas)

### Governance

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

#### Safety and Security Capabilities

- [x] String literals for injection-safe SQL generation
  - [ ] Integration of
        [pg-format](https://github.com/grantcarthew/deno-pg-format)

#### Information Model Evolution (migrations, etc.)

See [Atlas open\-source schema migration tool](https://atlasgo.io/) and create a
SQLa to Atlas schema / DDL file.

See [EdgeDB Migrations](https://www.edgedb.com/showcase/migrations) for some
interesting ideas.

Consider generating [Flyway](https://flywaydb.org/documentation/command/migrate)
and Liquibase migrations.

### DDL (Data Definition Language)

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

### DQL (Data Query Language)

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
      complexity increases. See [EdgeDB](edgedb.com) for interesting ideas (such
      as _composition_, _aggregation functions_, and _nested filters_). Read
      more about the query builder at
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

### DML(Data Manipulation Language)

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

### PL (Procedural or Programming Language)

- [x] BODY defines PL (stored function or stored procedure) body
- [x] CONTRACT defines the header, parameter, etcs.

### DCL (Data Control Language)

- [ ] GRANT: This command gives users access privileges to the database.
  - [ ] Refer to https://supabase.com/blog/2021/07/01/roles-postgres-hooks for
        how to manage complex policies such as roles across multiple tenants
- [ ] REVOKE: This command withdraws the user’s access privileges given by using
      the GRANT command.

### TCL (Transaction Control Language)

- COMMIT: Commits a Transaction.
- ROLLBACK: Rollbacks a transaction in case of any error occurs.
- SAVEPOINT: Sets a savepoint within a transaction.
- SET TRANSACTION: Specify characteristics for the transaction.

### Dialect/Engine-specific

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

### Dialect Engines

- [ ] Universal `SqlEngine` and `SqlEngineInstance` interfaces and
      engine-specific implementations to prepare SQL, send into a specific
      database driver and return typed rows (array) or object lists as query
      execution results. All SQL engines support the same query execution
      results so that results and queries can be mixed/matched across engines.

### Engineering and QA (IDE)

- [ ] Render
      [SQL Notebook](https://marketplace.visualstudio.com/items?itemName=cmoog.sqlnotebook)
      output that will allow interactive use through VS Code.

#### PostgreSQL

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

### Structural Lint Rules

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

### Content Lint and Data Validation Rules

- [ ] [Soda Checks Language](https://docs.soda.io/soda-cl/soda-cl-overview.html)
      (SodaCL) style validation rules

## Code

These are the core interfaces:

- `SqlTextSupplier` is a block of partial SQL, almost always a statement
  terminatable by ';'
- `SqlEmitContext` is the shared context which can carry state between blocks of
  SQL

Complex SQL generation requires many different generators working together. To
help coordinate state management across `SqlTextSupplier` instances you use an
instance of `SqlEmitContext`. The simplest context is an empty one which
inherits the base `SqlEmitContext` interface.

```ts
// Type Option 1: if you do not have any custom properties
type SyntheticTmplContext = SQLa.SqlEmitContext;

// Instance Option 1: if you do not have any custom properties
const syntheticTmplContext = () =>
  SQLa.typicalSqlEmitContext() as SyntheticTmplContext;

// Type Option 2: if you have any custom properties
interface SyntheticTmplContext extends SQLa.SqlEmitContext {
  // your custom properties and functions go in here
  myCustomStateProp1: string;
  myCustomStateFunc1: (ctx: SyntheticTmplContext) => string;
}

// Instance Option 2: if you have any custom properties
const syntheticTmplContext = () => {
  const result: SyntheticTmplContext = {
    ...SQLa.typicalSqlEmitContext(),
    // initialize your custom properties
    myCustomStateProp1: "something",
    myCustomStateFunc1: (ctx) => `computed-value with ctx`,
  };
  return result;
};

// whichever option you use, prepare your ctx this way
const ctx = syntheticTmplContext();
```

Once you have your `ctx` prepared, you're ready to use the Typescript string
template literals as your templating engine.

The best way to start is to create each SQL statement generator as an instance
of `SqlTextSupplier`, minimally defining an object which returns a `SQL`
function which prepares a _single SQL statement **without a trailing ';'**:_

```ts
const syntheticTable1Defn: SQL.SqlTextSupplier<SyntheticTmplContext> = {
  SQL: (ctx) =>
    ws.unindentWhitespace(`
      CREATE TABLE "synthetic_table1" (
        "synthetic_table1_id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "column_one_text" TEXT NOT NULL,
        "column_two_text_nullable" TEXT,
        "column_unique" TEXT NOT NULL,
        "column_linted_optional" TEXT,
        "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("column_unique")
      )`),
};
```

If you don't need `ctx` in `SQL: (ctx) =>`, you can leave it out -- the _shared_
state _context_ will be provided so you can use it to store stateful information
about what you've generated.

It's best for templates and generators to be _stateless_ but in complex cases
you might not want to generate copies of text so you might need to track whether
you've generated something already or not. For example, every time you put
`${syntheticTable1Defn}` into a template as an expression its `SQL(ctx)`
function will be called. If you it generate each time it's referenced, you can
skip state management; however, if, for some reason, some parts or some
expressions in that SQL should only be generated in specific circumstances you
would utilize the typed `ctx` instance to do your state management
appropriately.

Once you have prepared your `SqlEmitContext` and `SqlTextSupplier` instances you
can use the template generator:

```ts
const stsOptions = SQLa.typicalSqlTextSupplierOptions<SyntheticTmplContext>();
const templateDefn = SQLa.SQL<SyntheticTmplContext>(stsOptions)`
-- this is a minimal SQL generator template
${syntheticTable1Defn}
`;
console.log(templateDefn.SQL(ctx));
```

`stsOptions` creates a _typical_ (default) set of options. `templateDefn` will
be a new instance of `SQL.SqlTextSupplier<SyntheticTmplContext>`.

The template _definition_ **does not generate** anything and the shared context
properties will not be populated until the template is _executed_ using
`templateDefn.SQL(ctx)`. Calling `const x = templateDefn.SQL(ctx)` will "run"
the template and return the text while populating ctx with any shared state.

Inside the
`SQLa.SQL<SyntheticTmplContext>(stsOptions)\`foo\``string template you can have arbitrary text and a variety of`${expr}`instances where`expr`
can be one or more of:

- A string
- A number
- A single `SQL.SqlTextSupplier<SyntheticTmplContext>` instance
- An array of `SQL.SqlTextSupplier<SyntheticTmplContext>` instances
- A function which accepts a `SyntheticTmplContext` as a parameter and returns a
  single or array of `SQL.SqlTextSupplier<SyntheticTmplContext>` instances.
- The full list of typed `${expr}`s allowed are in [sql.ts](./sql.ts) and fully
  described by the `SqlPartialExpression` algebraic type. If a type is not a
  component of `SqlPartialExpression` then it's not a valid `${expr}`.

Using the mix above, you can prepare all your SQL statements as properly typed
object instances through literal SQL statements or use any SQL generator to
compose your SQL in text.

There are many other features available in generated templates, including:

- Lint state to add warnings/errors, etc. in the emitted SQL
- Events are generated to allow cataloging of what's being written
- Requests to persist portions of the output in separate files
- Behaviors can be defined so an expression at the bottom of generated text may
  safely influence content at the top of generated text and vice-versa
- Properly preserves indentation and whitespace whenever possible to create
  reproducible SQL text (to ease tracking in Git as generated code)

## Table DDL Aides

`SQLa` uses Zod to declare type-safe tables and generate SQL DDL that can be
used directly in template literals.

### Type-safe declarations

Assuming `ctx` and `stsOptions` are setup as in the examples above, you can
import `z` from Zod, prepare a table definition and then use it:

```ts
const typeSafeTable1 = t.tableDefinition("synthetic_table_without_pk", {
  text: z.string(),
  text_nullable: z.string().optional(),
  int: z.number(),
  int_nullable: z.number().optional(),
});

type TypeSafeTable1 = z.infer<typeof typeSafeTable1.zSchema>;
const record: TypeSafeTable1 = {
  text: "required",
  int: 0,
  text_nullable: undefined,
};

const templateDefn = SQLa.SQL<SyntheticTmplContext>(stsOptions)`
-- this is a minimal SQL generator template
${syntheticTable1Defn}

${typeSafeTable1}
`;
console.log(templateDefn.SQL(ctx));
```

`syntheticTable1Defn` is a custom-prepared (not type-safe) but `typeSafeTable1`
is type-safe because it's defined using a Zod schema.

## TODO

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
- [x] Dependency graphs (relationships from FKs, links, etc.)
- [x] Generate PlantUML Information Engineering diagrams
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

## Test Coverage

![Test Code Coverage](https://codecov.io/gh/netspective-labs/sql-aide/branch/main/graphs/sunburst.svg?token=DPJICL8F4O)
