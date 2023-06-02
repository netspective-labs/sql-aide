# SQL Preprocessor (SQLpp)

The SQLpp utility is a CLI and set of Deno Typescript modules which allows
pre-processing of SQL files using multiple strategies.

Use the `help` command for usage instructions:

```bash
deno run -A ./lib/pre-process/mod.ts help   # explicity run in Deno
./lib/pre-process/mod.ts help               # use the built-in shebang
./lib/pre-process/mod.ts help psql          # get help on a specific command
```

## `psql`-style SQL source pre-processor

PostgreSQL's `psql` utility allows _meta-commands_ such as `\set` and
`\include`. The SQLpp `psql` subcommand allows SQL files to be pre-processed and
emitted using similar functionality. This allows the same `*.sql` files you use
to load via `psql` to be consumed by SQLa or other utilities.

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

For more information see [SQLpp psql documentation](psql/README.md).
