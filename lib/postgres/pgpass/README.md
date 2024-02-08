# PostgreSQL `~/.pgpass` Aide

The `pgpass` module provides helpers for managing PostgreSQL connection
credentials.

## SSH tunneling

If PostgreSQL is not on the same network, connect to a remote Postgres server
using SSH tunnel first. Assuming that Postgres listens on 5432 on remote:

```bash
ssh -fNTML 9432:localhost:5432 sshusername@you-server.com
```

Then, just launch psql, connecting to port 9432 at localhost:

```bash
psql -h localhost -p 9432 -U <username> <dbname>
```

## `pgpass` module

This module provides helpers for managing PostgreSQL connection credentials by
using typical `$HOME/.pgpass` file. The module supports adding custom
"descriptors" before the connection information.

See [.pgpass](https://www.postgresql.org/docs/current/libpq-pgpass.html) for
PostgreSQL-specific `.pgpass` documentation.

Before each .pgpass line you should include a strict JSON5L definition that
includes a line like
`{ id: "XYZ", description: "Purpose", boundary: "Network" }` where

- `id`: unique ID where "XYZ" will be used by pgpass.ts to identify connection
  (required)
- `description`: human-friendly elaboration of purpose (optional)
- `boundary`: human-friendly name of network or location of the connection
  (optional)

### `pgpass` binary installation

If you're using
[netspective-labs/home-polyglot](https://github.com/netspective-labs/home-polyglot),
`pgpass` is already installed in `$HOME/bin`.

If you're not using `netspective-labs/home-polyglot` you can
[install Deno](https://deno.land/manual@v1.30.0/getting_started/installation)
and then use `deno` to install the latest version of the binary:

```bash
export SQLa_VERSION=`curl -fsSL https://api.github.com/repos/netspective-labs/sql-aide/tags | jq '.[0].name' -r`
deno install -A -f https://raw.githubusercontent.com/netspective-labs/sql-aide/${SQLa_VERSION}/lib/postgres/pgpass/pgpass.ts
```

### `pgpass` usage

Start with:

```bash
pgpass --help
```

```
Netspective Labs conventional .pgpass inspection.

Usage:
  pgpass ls conn [--src=<file>] [--no-color]
  pgpass env [--src=<file>] [--no-export] [--var-name=<js-expr>] [--conn-id=<matcher>...] [--warn-no-descriptors]
  pgpass prepare <js-eval-expr> --conn-id=<matcher>... [--all] [--src=<file>]
  pgpass (psql-fmt|psql|pgcenter|pgready) --conn-id=<matcher>... [--all] [--src=<file>]
  pgpass url --conn-id=<matcher>... [--all] [--src=<file>]
  pgpass test [--src=<file>]
  pgpass inspect [--src=<file>] [--mask-password] [--json]
  pgpass -h | --help
  pgpass --version

Options:
  -h --help               Show this screen.
  --src=<file>            The source of .pgpass content [default: $HOME/.pgpass]
  --no-export             Don't add 'export' clause to emitted env var lines
  --var-name=<js-expr>    Env var name format [Default: `${conn.connDescr.id}_${varName}`]
  --conn-id=<matcher>     Connection ID matching regular expression(s) using JS `new RegExp(connId)`
  <js-eval-expr>          Javascript eval expression
  --all                   Produce all matching connections, not just the first one
  --warn-no-descriptors   Provide warning for which connections do not provide descriptors
  --json                  Emit in strict JSON format
  --version               Show version.
```

To test if the .pgpass definitions parse properly:

```bash
pgpass test
```

If you get no results, the file is valid otherwise you'll get an issues list

To see a list of all connections defined in .pgpass:

```bash
pgpass ls conn
```

To test PostgreSQL server availability for all connections defined in .pgpass:

```bash
pgpass pgready --conn-id=".*" --all
pgpass pgready --conn-id=".*" --all | bash
```

To generate an arbitrary string for a connection ID:

```bash
pgpass prepare 'conn.database' --conn-id="GITLAB"       # simple
pgpass prepare '`${conn.database}`' --conn-id="GITLAB"  # custom JS eval-expr
```

If you need complex string formatting you can use Javascript evaluation. Be sure
to use '\`...\`' where ... is a JS string literal type that can use:
`${conn.host}` `${String(conn.port)}` `${conn.database}` `${conn.username}`
`${conn.password}`

To generate \`psql\`-friendly parameters for a given connection:

```bash
pgpass psql-fmt --conn-id="GITLAB"
```

You can use is like this:

```bash
fish -c "psql $(pgpass psql-fmt --conn-id='GITLAB')"
fish -c "pgcenter top $(pgpass psql-fmt --conn-id='GITLAB')"
```

To generate psql or pgcenter commands that you can use as-is:

```bash
pgpass psql --conn-id="GITLAB"      # emit the command
pgpass pgcenter --conn-id="GITLAB"  # emit the command

fish -c (pgpass psql --conn-id="GITLAB")     # run the command
fish -c (pgpass pgcenter --conn-id="GITLAB") # run the command
```

To generate env vars for all pgpass connections using default naming convetion:

```bash
pgpass env
```

To generate env vars for all pgpass connections using custom prefix:

```bash
pgpass env --var-name='`MYPREFIX_${varName}`'
```

To generate env vars for specific pgpass connections without prefix:

```bash
pgpass env --var-name='`${varName}`' --conn-id="GITHUB" --conn-id="GITLAB"
```

If you need complex string formatting you can use Javascript evaluation. Be sure
to use '\`...\`' where ... is a JS string literal type that can use:
`${varName}` `${conn.host}` `${String(conn.port)}` `${conn.database}`
`${conn.username}` `${conn.password}`

NOTE: `--conn-id` is passed into \`new RegExp(connId)\` so you can use any
parseable regex.

# TODO

- [ ] Introduce `pgpass` through SQLa primary documentation site
- [ ] Switch from `docopt` to Cliffy for CLI to increase type-safety and allow
      command completions generator
- [ ] Using `./postgres/pgpass/pgpass.ts` and
      [mklabs/tabtab](https://github.com/mklabs/tabtab) create a solution
      similar to
      [martin1keogh/zsh_pgpass_completion](https://github.com/martin1keogh/zsh_pgpass_completion).
      The end solution will show a list of the databases found in the `.pgpass`
      file to fill out `psql` or other CLI.
- [ ] Provide Fish and Bash one-liners to use `pgpass` to generate combined SSH
      tunnel and, for example, `psql` in the same command. This would allow an
      almost-ready SASE or zero-trust security model?
  - [ ] Consider adding a `{ sshTunnel: { port: xyz} }` to the descriptor so
        that we can supply SSH tunnel port differently than local port in case
        there are any port conflicts
- [ ] Use Deno compiler to
      [create single-binaries](https://deno.land/manual@v1.30.0/tools/compiler#compiling-executables)
      instead of requiring Deno installation?
- [ ] `pgpass env --var-name` and `pgpass prepare <js-eval-expr>` use unsafe
      `eval()` to format strings. This is unsafe on anything other trusted
      machines so be careful. Find a string replacement library to upgrade
      later.
