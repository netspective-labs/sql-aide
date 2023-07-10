# SQLite SQLa Flow and statements library

As an embedded database SQLite doesn't really have the concept of procedural
languages so this Deno Typescript module provides a library of reusable SQL code
that can be composed and sent to SQLite.

- `mod.ts` contains _library_ code that is convenient for importing as a
  TypeScript module
- `mod-flow.ts` contains code that wraps `mod.ts` functionality as a CLI
  (usually as part of a workflow)

## CLI Usage

```bash
$ ./mod-flow.ts help                  # get usage instructions
$ ./mod-flow.ts notebook              # emit all the SQL
$ ./mod-flow.ts notebook --list       # list all available SQL statement keys
$ ./mod-flow.ts notebook inspect X Y  # emit the SQL statement called `inspect`, then `X`, then `Y`
```

## CLI Composition

```bash
$ ./mod-flow.ts inspect | sqlite3 my.db        # run the inspect SQL in my.db
$ ./mod-flow.ts notebook X Y | sqlite3 my.db   # run combined X and Y in my.db
```

## Typescript Composition

Since all the SQL statements are available as Typescript objects you can use
SQLa to compose statements using SQLa string template literals, too.
