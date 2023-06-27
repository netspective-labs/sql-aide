---
title: SQLpp
---
import { Callout, Steps } from 'nextra-theme-docs'

<!-- # `SQLpp` - SQL Preprocessor -->

`SQLpp` (available in `./lib/pre-process/mod.ts`) is a cross-database utility
designed for pre-processing SQL files. Its functionality mirrors a subset of the
meta-commands provided by PostgreSQL's `psql` utility.

<Callout>
**Why SQLpp when we have SQLa**? Full-fledged SQL generators like SQLa, while
powerful, can often be overwhelming due to their complexity, especially for
DBAs who already know `psql` or developers who don't know Typescript. SQLa may
be overkill for simpler tasks where existing SQL files already contain working
SQL code and you just need simple declarative variable replacements.
</Callout>

`psql` is a terminal-based front-end to PostgreSQL. It enables users to type in
SQL queries interactively, issue them to PostgreSQL, and see the query results.
`psql` also provides a number of meta-commands and various shell-like features
to facilitate writing scripts and automating a wide variety of tasks.

Key among these meta-commands are `\set` and `\include`, which allow for setting
variables and including other SQL scripts respectively.

SQLpp adopts the similar meta-command functionalities offered by `psql` for
pre-processing SQL files. It enables you to define and override `\set` variables
within your SQL source code and support `include` statements, akin to `psql`.

However, unlike `psql`, which directly executes SQL queries on PostgreSQL
databases, SQLpp focuses on preparing SQL files for execution.

The primary advantage of SQLpp over `psql` is its database-agnostic nature.
While `psql` is specifically designed for PostgreSQL databases, SQLpp's output
can be utilized across almost all databases. This includes SQLite, DuckDB, Dolt,
MySQL, SQL*Server, among others.

SQLpp provides a unique and efficient solution for SQL file pre-processing.
While it does not execute SQL like `psql`, its focus on SQL preparation and its
wide compatibility with almost all databases make it an incredibly useful
utility in various SQL-related operations.

This does not mean that SQLpp is a substitute for SQL generators in all
scenarios, but rather that it serves a distinct purpose and offers unique
advantages in certain situations.

SQLpp, with its simple syntax mirroring a subset of PostgreSQL's `psql` utility
meta-commands, offers a more intuitive and easier to learn approach to SQL
pre-processing. This makes it an ideal tool for those new to SQL or those that
know existing tools like `psql` well.

SQLpp is an excellent choice for situations where complex SQL generation is not
necessary. This might include scenarios where you're dealing with simpler
queries, or when you need to quickly prototype SQL scripts without type-safety
in mind.

## Usage Summary

Use the `help` command for usage instructions:

```bash
deno run -A ./lib/pre-process/mod.ts help   # explicity run in Deno
./lib/pre-process/mod.ts help               # use the built-in shebang
./lib/pre-process/mod.ts help psql          # get help on a specific command
```

Usage: `mod.ts psql <src>`

Options:

```bash
-h, --help                     - Show this help.
-s, --src      <psql-file...>  - additional SQL source file(s)
-i, --inspect                  - show inspection output instead of emitting SQL source
--set.*        <variable>      - --set.XYZ=value would override XYZ with value provided
```

Examples:

```bash
$ lib/pre-process/mod.ts psql lib/sql/pg/upsert.sql
$ lib/pre-process/mod.ts psql lib/sql/pg/upsert.sql --set.unit_test_schema=some_other_schema
```

<Callout>
  _Dialects_ other than `psql` (e.g. Microsoft's `sqlcmd`, MySQL's client meta
  commands or ORACLE's SQL Loader) could also be implemented to allow SQL
  templates compatibility across databases. If you have ideas please consider
  contributing them or creating issues to make suggestions.
</Callout>

## `psql`-style Usage

Preprocess text in a way that `psql` would. Specifically, allow `\set` variables
to be defined in the source and overridden via CLI.

<Callout>
  Currently SQLpp only supports a subset of `psql` meta commands but it is
  extensible so more meta commands may be added. If you need other meta commands
  you can contribute them or create tickets for suggested additions.
</Callout>

## `\include`

Supports these types of `include` statements (must be at the start of a line):

```psql
\i filename.sql
\include ../filename.sql
\include '../filename.sql'
\include "../filename.sql"
```

Similar to `psql`, `\i` and `\include` are synonyms; relative files are resolved
from the current working directory but other rules can be provided as well.

## `\ir`

Supports these types of _include relative_ statements:

```psql
\ir filename.sql
\ir 'filename.sql'
\ir "filename.sql"
```

Similar to `psql`, `\ir` includes files relative to the location of the source
file. Because _source file_ might not be clear in the context of SQLpp you may
need to provide a callback function to the preprocessor to define what "relative"
means.

## `\set`

Supports these types of `set` statements (must be at the start of a line):

```psql
\set name John
\set count 42
\set url 'https://example.com'
\set var = value
\set greeting 'Hello, \'world!'
\set greeting2 "Hello, \"world!"
```

Similar to `psql`, supports this type of replacement:

| Style     | Replacement |
| --------- | ----------- |
| `:name`   | John        |
| `:'name'` | 'John'      |
| `:"name"` | "John"      |

## Examples

Assume this file:

```sql filename="include_test.fixture-01.psql"
-- fixture-01

\set name 'John Doe'
\set table users
\set unit_test_schema dcp_assurance

SELECT * FROM users WHERE username = :'name';
SELECT * FROM :table WHERE username = :'name';
SELECT * FROM :"table" WHERE username = :'name';
SELECT * FROM :"table" WHERE username::"varchar" = :'name';
SELECT email FROM :unit_test_schema.upsert_test_user((1, 'Updated Name', 'john.doe@example.com'):::"unit_test_schema".test_user);
```

Assume these declarations in a `*.psql` file:

```sql filename="test.sql"
-- *** before first include ***

\\include './include_test.fixture-01.psql'

-- *** after first include ***
```

Running this command:

```shell
deno run ./pre-process/mod.ts psql test.sql --set.name="Shahid Shah"
```

Produces this output:

```sql
-- *** before first include ***

-- fixture-01

-- \\set name 'John Doe' (variable: name, value: John Doe, srcLine: 5)
-- \\set table users (variable: table, value: users, srcLine: 6)
-- \\set unit_test_schema dcp_assurance (variable: unit_test_schema, value: dcp_assurance, srcLine: 7)

SELECT * FROM users WHERE username = 'Shahid Shah';
SELECT * FROM users WHERE username = 'Shahid Shah';
SELECT * FROM "users" WHERE username = 'Shahid Shah';
SELECT * FROM "users" WHERE username::"varchar" = 'Shahid Shah';
SELECT email FROM dcp_assurance.upsert_test_user((1, 'Updated Name', 'john.doe@example.com')::"dcp_assurance".test_user);

-- *** after first include ***
```