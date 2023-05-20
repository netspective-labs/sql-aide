# SQL Aide (SQLa) Typescript library optimized for emitting and packaging SQL

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

{% info PgDCP Migration %}

`TODO`: _migrate PgDCP introductory materials_

{% end %}

## Test Coverage

![Test Code Coverage](https://codecov.io/gh/netspective-labs/sql-aide/branch/main/graphs/sunburst.svg?token=DPJICL8F4O)
