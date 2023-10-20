# SQL Aide Supporting Binaries

## `doctor.ts`

Used by deno.jsonc to see which dependencies might be missing.

## SQLite Extensions Package

We use [sqlpkg-cli](https://github.com/nalgeon/sqlpkg-cli) to download and
manage all the SQLite extensions we need for our examples and patterns that
depend SQLite. SQLa core SQL generator does not require SQLite or any database
but some patterns and examples (like `pattern/fs-content`) do require SQLite and
some third-party extensions.

## Sourcing the files

First get the `sqlpkg-cli` binary:

```bash
$ eget nalgeon/sqlpkg-cli --file="sqlpkg"
```

Now get all the extensions

```bash
$ sqlpkg install asg017/ulid
$ sqlpkg install nalgeon/fileio
$ sqlpkg install nalgeon/crypto
$ sqlpkg install asg017/path
$ sqlpkg install asg017/html     # https://github.com/asg017/sqlite-html/blob/main/docs.md
$ sqlpkg install asg017/http     # https://github.com/asg017/sqlite-http/blob/main/docs.md
$ sqlpkg install asg017/regex    # https://github.com/asg017/sqlite-regex/blob/main/docs.md
```

`cd`` to SQL Aide home and then run the following to match the extensions with
what's needed in SQL Aide:

```bash
$ sudo apt-get install rsync                            # if you don't already have it installed
$ rsync -av --delete ~/.sqlpkg/ ./support/bin/sqlpkg/
```
