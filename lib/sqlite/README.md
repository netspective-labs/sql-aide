# SQLite SQLa Flow and statements library

As an embedded database SQLite doesn't really have the concept of procedural
languages so this Deno Typescript module provides a library of reusable SQL code
that can be composed and sent to SQLite.

- `mod.ts` contains _library_ code that is convenient for importing as a
  TypeScript module
- `cli.ts` contains code that wraps `mod.ts` functionality as a CLI (usually as
  part of a workflow)

## CLI Usage

```bash
$ ./cli.ts help                      # get usage instructions
$ ./cli.ts sql notebook              # emit all the SQL
$ ./cli.ts sql notebook --list       # list all available SQL statement keys
$ ./cli.ts sql notebook inspect X Y  # emit the SQL statement called `inspect`, then `X`, then `Y`
```

## CLI Composition

```bash
$ ./cli.ts sql inspect | sqlite3 my.db        # run the inspect SQL in my.db
$ ./cli.ts sql notebook X Y | sqlite3 my.db   # run combined X and Y in my.db
```

## Typescript Composition

Since all the SQL statements are available as Typescript objects you can use
SQLa to compose statements using SQLa string template literals, too.
