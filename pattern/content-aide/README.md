# TODO

## Setup

- Ensure `sqlite3` is in PATH
- Download [sqlpkg](https://sqlpkg.org/) binaries

Get the SQLite extensions

```bash
$ sqlpkg install asg017/ulid
$ sqlpkg install nalgeon/fileio
$ sqlpkg install nalgeon/crypto
$ sqlpkg install asg017/path
$ sqlpkg install asg017/html     # https://github.com/asg017/sqlite-html/blob/main/docs.md
$ sqlpkg install asg017/http
```

Others to consider:

- `x2bool/xlite` - Query Excel (.xlsx, .xls) and Open Document spreadsheets
  (.ods).
- `nalgeon/define` - User-defined functions and dynamic SQL.
- `daschr/cron` - Compares dates against cron patterns, whether they match or
  not.
- `jhowie/envfuncs` - Returns the value of the environment variable.
- `nalgeon/text` - String and text processing.

## Testing

Initialize the database:

```bash
$ ./pattern/content-aide/cactl.ts
```

Load the content including blobs:

```bash
$ ./pattern/content-aide/cactl.ts sql insertMonitoredContent --blobs | sqlite3 device-content.sqlite.db
```

Show all the HTML anchors in all HTML files:

```bash
$ ./pattern/content-aide/cactl.ts sql allHtmlAnchors | sqlite3 device-content.sqlite.db --json
```
