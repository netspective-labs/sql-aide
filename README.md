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

## Documentation Server

We use [Nextra](https://nextra.site/) for documentation, start the server and
launch the site:

```bash
cd support/docs-nextra
pnpm install    # first time or whenever you do a pull
pnpm next       # docs are available at http://localhost:3000
```

## Unit Testing

```bash
deno test
```

## Tagging and pushing commits

When you're ready to push code:

```bash
deno task git-hook-pre-commit   # run all tests/validation that will be run by Git commit hook so there are no surprises
git commit -m ...               # commit your if the above shows no errors
deno task prepare-publish       # bump the version tag and prepare for push
git push                        # push the code with the bumped version
```

## NPM Packaging

Build the NPM package

```bash
deno task prepare-npm
```

Publish the NPM package

```bash
deno task publish-npm
```

To publish this package, you will need the necessary permissions. Please contact
the `netspective-labs` organization to obtain the required permissions if you
don't have them yet.
