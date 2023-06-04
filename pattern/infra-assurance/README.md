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

## Tests

The tests need _fixtures_ to run and you can generate the fixtures all at once:

```bash
$ ./models_test.ts test-fixtures
```

You should only re-generate the fixtures when you are developing models. Once
the models are defined, you should git-track the fixtures so that if the SQLa
libraries are updated you can ensure that future updates do not impact your
models.

You can create the SQL, PlantUML, and other files individually to either STDOUT
or saved to a file.

```bash
$ ./models_test.ts sql                                      # stdout
$ ./models_test.ts sql --dest models_test.fixture.sql       # file
$ ./models_test.ts diagram --dest models_test.fixture.puml  # file
```

You can create the SQLite file by using the `driver` script generator and saving
the script for later execution or executing the output script via STDIN.

```bash
$ ./models_test.ts driver --dest ./models_test.fixture.sh && chmod +x ./models_test.fixture.sh
$ ./models_test.ts driver | bash -s --destroy-first ./models_test.fixture.db
$ ./models_test.ts driver | bash -s --destroy-first ./models_test.fixture.db -json "select count(*) as objects_count from sqlite_master"
```

If you want to create SQLite all in memory and verify some SQL try this:

```bash
$ ./models_test.ts driver | bash -s :memory: "select count(*) as objects_count from sqlite_master"
```

If you want to verify in more detail you can pass it into jq or other tools too:

```bash
$ ./models_test.ts driver | bash -s :memory: -json "$(../../lib/sql/sqlite/mod.sqla.ts inspect)" | jq "group_by(.table_name) | map({ tableName: .[0].table_name, columns: length })"
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
