# Infrastructure Assurance Pattern

This _infrastructure assurance_ information model helps define expectations for
assets and boundaries and then use tools like osQuery to ensure expectations are
met.

- _Expectations_ need to be established independent of tools like osQuery since
  most tools help determine the _actuals_ rather than _expectations_.
- Certain _actuals_ need to be managed by Opsfolio because most tools don't
  manage non-technical _actuals_ (such as a risk register or RACI chart).

This _information pattern_ is general purpose but was designed to be used by the
Opsfolio suite of tools. Opsfolio uses the `infra-assurance` pattern to generate
SQLite tables that are accessed via osQuery ATCs.

## CLI Tests

You can create the SQL, PlantUML, and other files to either STDOUT or saved to a
file.

```bash
$ ./models_test.ts sql
$ ./models_test.ts sql --dest models_test.fixture.sql
$ ./models_test.ts diagram --dest models_test.fixture.puml
```

You can create the SQLite file by using the `driver` script generator and saving
the script for later execution or executing the output script via STDIN.

```bash
$ ./models_test.ts driver --dest ./models_test.fixture.sh && chmod +x ./models_test.fixture.sh
$ ./models_test.ts driver | bash -s ./models_test.fixture.db --destroy-first
```

## Unit Tests

Until better documentation is available, the best way to learn about Opsfolio is
to review and run the unit tests (`mod_test.ts`). You can run the following in
the base directory:

```bash
deno test -A --unstable
```

The unit tests auto-generate all files, deploy a SQLite database, and then
execute `osqueryi` to validate ATCs. By default, OPSFOLIO_UT_CLEAN_ARTIFACTS is
set to true but you can turn it off if you want to retain the generated
artifacts after testing completed:

```bash
OPSFOLIO_UT_CLEAN_ARTIFACTS=false deno test -A --unstable
```

If you use `OPSFOLIO_UT_CLEAN_ARTIFACTS=false` you'll see the following files
after `deno test`:

- `opsfolio.auto.sqlite.db` is the SQLite database that will be automatically
  integrated into `osqueryi` through ATCs; it's referred to in the
  `opsfolio.auto.osquery-atc.json` config files and indirectly used by osQuery.
- `opsfolio.auto.osquery-atc.json` is the osQuery ATC config that will allow
  integration of `opsfolio_*` tables into osQuery; this file is directly used by
  osQuery.
- `opsfolio.auto.puml` is a PlantUML Information Engineering ("IE") that can be
  used to generate an entity-relationship diagram (ERD); this file is not used
  by osQuery, it's just to enhance understanding and describe the schema.
- `opsfolio.auto.sql` is the SQL file that was used to create
  `opsfolio.auto.sqlite.db` (check the `INSERT INTO` statements to see what data
  is available); this file is not used by osQuery, it's only used to create the
  SQLite database file (`opsfolio.auto.sqlite.db`)

## osQuery ATC Database Deployment

Opsfolio uses osQuery's
[Automatic Table Construction (ATC)](https://osquery.readthedocs.io/en/stable/deployment/configuration/#automatic-table-construction)
feature to register new `opsfolio_*` tables. Once `deno test` is used, a SQLite
database is created along with `opsfolio.auto.osquery-atc.json` which registers
the Opsfolio tables so that they can be used via `osqueryi` or other osQuery
interfaces.

```bash
# generate the artifacts and test automatically, but don't delete the artifacts
OPSFOLIO_UT_CLEAN_ARTIFACTS=false deno test -A --unstable

# test the artifacts manually
osqueryi --config_path ./opsfolio.auto.osquery-atc.json "select code, value from opsfolio_execution_context"
```

Once you run `osqueryi` you should see the following output if the osQuery ATC
configuration and database were properly deployed:

```
+------+-------------+
| code | value       |
+------+-------------+
| 0    | DEVELOPMENT |
| 1    | TEST        |
| 2    | PRODUCTION  |
+------+-------------+
```

If you get `Error: no such table: opsfolio_execution_context` when you run
`osqueryi` try running with `--verbose` flag:

```bash
osqueryi --verbose --config_path ./opsfolio.auto.osquery-atc.json "select code, value from opsfolio_execution_context"
```

Look for lines like this:

```
...auto_constructed_tables... Removing stale ATC entries
                          ... ATC table: opsfolio_execution_context Registered
                          ... ATC table: opsfolio_asset_risk_type Registered
```

## Information Models

- **Graph**. This is the top-level "assets graph" which is considered the _root
  node_
  - **Boundary**. Each Graph contains one or more asset boundaries (e.g. a VLAN,
    a Container, etc.). Boundaries can contain one or more boundaries within it
    and also at multiple nested levels.
    - **Sub Boundary**. (Optional) Boundaries can contains one or more children
      (Sub Boundary) hierarchically.
    - **Category**. A similar group of assets can be classified into a Category
      and assigned to one or more boundaries. That is, categories can be defined
      independent of boundaries (e.g. a "Category Catalog") and then assigned to
      one more boundaries. Boundaries can contain one or more categories of
      assets.
      - **Sub Category** (optional). Categories can have sub-categories of
        assets hierarchically.
        - **Asset**. This is the main node and is where most of the activities
          occur.
- **Label**. A label can be applied across graph structures to allow
  non-hiearachical grouping. While categories imply ownership (e.g. "belongs to"
  relationships), labels imply more generalized associations.
- **Execution Context**. An _execution context_ is similar to a label but it is
  specialized to allow depiction of environments such as
  dev/test/stage/prod/etc.

- [ ] Implement translator for all SCF Excel workbooks and sheets into Opsfolio
      models and content that can be reused
  - [ ] Since SCF uses native Excel workbooks, see if
        [xlite](https://github.com/x2bool/xlite), a SQLite extension to query
        Excel (.xlsx, .xls, .ods) files as virtual tables, will fit the bill.
        Since Opsfolio relies on Deno SQLite WASM module, it's possible that we
        need to embed the Excel virtual tables capabilities into WASM.
- [ ] Implement
      [Roadmap to Zero Trust Architecture](https://zerotrustroadmap.org/) using
      Opsfolio Data Models

## Visualizing Entity-Relationship Diagrams (ERDs) using PlantUML in VS Code

To preview `*.puml` PlantUML-based Information Engineering (IE) ERDs in VS Code,
you'll need to:

- Install the
  [PlantUML VS Code (jebbs.plantuml)](https://marketplace.visualstudio.com/items?itemName=jebbs.plantuml)
  extension
- Install Graphviz `dot` executable
- Install Java JRE

To setup Graphviz:

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
