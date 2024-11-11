# SQL Aide (SQLa) Typescript template literals optimized for emitting SQL

[![codecov](https://codecov.io/gh/netspective-labs/sql-aide/branch/main/graph/badge.svg?token=DPJICL8F4O)](https://codecov.io/gh/netspective-labs/sql-aide)

![Repository Logo](support/logo.png)

SQL Aide (`SQLa`) is a suite of Deno TypeScript modules which use the power of
JavaScript functions and
[Template literals (Template strings)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)
to prepare SQL components as composable building blocks ("SQL partials"). `SQLa`
is like a static site generator but instead of generating HTML, it generates SQL
files and other database artifacts for SQL-heavy apps and services.

`SQLa` targets services or applications that must assemble and load SQL into in
a deterministically reproducible manner. `SQLa` is an _aide_ which helps
prepare, organize, assemble, load, and revision manage type-safe,
_deterministically reproducible_, SQL code.

Instead of inventing yet another template language, `SQLa` uses a set of naming
conventions plus the full power of JavaScript (and TypeScript) template strings
to prepare the final SQL that will be assembled and loaded into (mostly)
relational databases.

## Init after clone

This repo uses git hooks for maintenance, after cloning the repo in your sandbox
please do the following:

```bash
deno task init
```

## Check for missing deps

```bash
deno task doctor
```

You should see something like this:

```bash
Git dependencies
  🆗 .githooks/pre-commit
  🆗 .githooks/pre-push
  🆗 .githooks/prepare-commit-msg
Runtime dependencies
  🆗 deno 1.34.0 (release, x86_64-unknown-linux-gnu)
Build dependencies
  🆗 dot - graphviz version 2.43.0 (0)
  🆗 java 17 2021-09-14 LTS
  🆗 PlantUML version 1.2022.6 (Tue Jun 21 13:34:49 EDT 2022)
```

Doctor task legend:

- 🚫 is used to indicate a warning or error and should be corrected
- 💡 is used to indicate an (optional) _suggestion_
- 🆗 is used to indicate success

If you get any error messages for `dot`, `Java`, or `PlantUML` then you will not
get auto-generated entity relationship diagrams (ERDs).

### Maintain Deno dependencies

You can check which deps need to be updated:

```bash
find . -name 'deps*.ts' -type f -not -path "./support/*" -exec udd --dry-run {} \;   # check first
find . -name 'deps*.ts' -type f -not -path "./support/*" -exec udd {} \;             # update deps
```

## Documentation

SQLa documentation is available at https://netspective-labs.github.io/sql-aide/.

### Local Documentation Server

If you're modifying the documenation or would like to use it locally without
Internet access, start the server and launch the site:

```bash
cd support/docs-astro
pnpm install    # first time or whenever you do a pull
pnpm run dev    # docs are available at http://localhost:3000
```

We use [Astro Starlight](https://starlight.astro.build/) as document publishing
framework.

## Unit Testing

```bash
deno test --parallel --allow-all --v8-flags="--max-old-space-size=4096"
```

## Directory Structure

### `examples`

The `examples` directory contains code examples that demonstrate how to use SQLa
effectively and it meant to be copy/pasted into your own code. The examples are
useful as inspiration, guides, and for education. These examples provide clear
and practical guidance on leveraging SQLa's features to generate SQL code in
TypeScript. If you're new to SQLa, this is a great place to start.

### `lib`

The `lib` directory serves as a general-purpose monorepo for code that is used
by various parts of SQLa, including the `pattern` and `render` directories.
However, it's important to note that all the code in the `lib` directory is
designed to be highly reusable and is not tightly coupled to SQLa. You can
easily use the code in this directory in other TypeScript runtimes or projects
that require similar functionality.

The `lib` directory contains code that does not necessarily deal with SQL so it
can be used as a dependency even in non-SQL-oriented services and applications.

### `pattern`

The `pattern` directory is similar to the `examples` directory in that it
provides code examples for using SQLa. However, the key distinction is that the
code in the `pattern` directory is designed to showcase various architecture
patterns, design patterns, and other reusable patterns that can serve as
valuable starting points for your own code. These patterns can be extended
through inheritance or function composition to streamline your SQLa-based
projects.

In essence, the `pattern` directory acts as a repository of best practices and
proven approaches to structuring SQLa code. Whether you're building a small
project or a complex application, exploring the patterns in this directory can
help you make informed architectural decisions and improve the maintainability
of your SQLa-based codebase.

Feel free to leverage and adapt these patterns to meet your specific project
requirements, ultimately saving time and effort in your development process.

### `render`

The `render` directory is the core of SQLa's SQL code generator. It utilizes the
code from the `lib` directory for various functions and features. This is where
SQLa transforms TypeScript string template literals into SQL queries. If you're
interested in the inner workings of SQLa's SQL code generation, this directory
is where you'll find the most important code.

### `support`

The `support` directory is reserved for code that supports the development of
SQLa but is not required outside of SQLa itself. This directory may contain
tools, scripts, or other utilities that aid in SQLa's development process.
Additionally, it may include the source code for SQLa's documentation site,
making it a valuable resource for contributors and maintainers.

- `support/bin` contains binaries that SQLa depends upon for examples and
  patterns (SQLa core SQL generator does not depend on any binaries other than
  Deno or JS runtime)
- `support/docs-astro` contains the code and content for `www-sql-aide.com`.

## Tagging and pushing commits

When you're ready to push code:

```bash
deno task git-hook-pre-commit   # run all tests/validation that will be run by Git commit hook so there are no surprises
git commit -m ...               # commit your if the above shows no errors
deno task prepare-publish       # bump the version tag and prepare for push
git push                        # push the code with the bumped version
```

## Visualizing Entity-Relationship Diagrams (ERDs) using PlantUML in VS Code

To preview `*.puml` PlantUML-based Information Engineering (IE) ERDs in VS Code,
you'll need to:

- Install the
  [PlantUML VS Code (jebbs.plantuml)](https://marketplace.visualstudio.com/items?itemName=jebbs.plantuml)
  extension
- Install Graphviz `dot` executable
- Install Java JRE

To setup Graphviz on a Debian-based distro:

```bash
sudo apt-get update && sudo apt-get install graphviz
```

To install Java (you can use any version, below are just examples):

```bash
asdf plugin add java
asdf install java oracle-17
asdf global java oracle-17
whereis java
```

Add the following to your `bash_profile` and restart VS Code so that it will
pick up the location of Java and any other ASDF-based executables:

```bash
export PATH=$PATH:$HOME/.asdf/shims
```
