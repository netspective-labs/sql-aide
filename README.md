# SQL Aide (SQLa) Typescript template literals optimized for emitting SQL

[![codecov](https://codecov.io/gh/netspective-labs/sql-aide/branch/main/graph/badge.svg?token=DPJICL8F4O)](https://codecov.io/gh/netspective-labs/sql-aide)

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
deno test -A --unstable
```

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

## NPM Packaging

We are experimenting with taking the Deno code and producing NPM packages. This
doesnt work for the `pattern` or `examples` directories but the core `SQLa`
render package should work.

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
