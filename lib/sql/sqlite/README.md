# SQLite SQL statements library

As an embedded database SQLite doesn't really have the concept of procedural
languages so this Deno Typescript module provides a library of reusable SQL code
that can be composed and sent to SQLite.

## CLI Usage

```bash
$ ./mod.sqla.ts help                  # get usage instructions
$ ./mod.sqla.ts notebook              # emit all the SQL
$ ./mod.sqla.ts notebook --list       # list all available SQL statement keys
$ ./mod.sqla.ts notebook inspect X Y  # emit the SQL statement called `inspect`, then `X`, then `Y`
```

## CLI Composition

```bash
$ ./mod.sqla.ts inspect | sqlite3 my.db        # run the inspect SQL in my.db
$ ./mod.sqla.ts notebook X Y | sqlite3 my.db   # run combined X and Y in my.db
```

## Typescript Composition

Since all the SQL statements are available as Typescript objects you can use
SQLa to compose statements using SQLa string template literals, too.
