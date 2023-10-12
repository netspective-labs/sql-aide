# TODO

## Setup

- Ensure `sqlite3` is in PATH
- Download [sqlpkg](https://sqlpkg.org/) binaries

Get the SQLite extensions

```bash
$ eget nalgeon/sqlpkg-cli --file="sqlpkg"
$ sqlpkg install asg017/ulid
$ sqlpkg install nalgeon/fileio
$ sqlpkg install nalgeon/crypto
$ sqlpkg install asg017/path
$ sqlpkg install asg017/html     # https://github.com/asg017/sqlite-html/blob/main/docs.md
$ sqlpkg install asg017/http     # https://github.com/asg017/sqlite-http/blob/main/docs.md
$ sqlpkg install asg017/regex    # https://github.com/asg017/sqlite-regex/blob/main/docs.md
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

Until is tests are fully automated, use
[RunMe](https://marketplace.visualstudio.com/items?itemName=stateful.runme) via
Visual Studio Code to execute the commands.

Initialize the database:

```bash
$ ./cactl.ts
$ ./cactl.ts sql mimeTypesSeedDML | sqlite3 device-content.sqlite.db
```

Load the content including blobs:

```bash
$ ./cactl.ts sql device | sqlite3 device-content.sqlite.db
$ ./cactl.ts sql insertMonitoredContent --blobs | sqlite3 device-content.sqlite.db
```

Show all the HTML anchors in all HTML files:

```bash
$ ./cactl.ts sql allHtmlAnchors | sqlite3 device-content.sqlite.db --json
```

Show the stats:

```bash
$ ./cactl.ts sql contentStats | sqlite3 device-content.sqlite.db --table
```

## Tasks

- [ ] Figure out what to do about symlinks
- [ ] Figure out what to do when fileio_read cannot read larger than 1,000,000
      bytes for hash, etc.

## ULID Primary Keys across multiple devices

The ULID (Universally Unique Lexicographically Sortable Identifier) is designed
to generate unique identifiers across distributed systems without coordination.
Let's break down its structure to understand the likelihood of conflicts.

A ULID consists of:

1. A 48-bit timestamp, which gives millisecond precision for about 138 years.
2. A 80-bit random component, which is generated randomly for each ID.

Given the design, there are two primary scenarios where a conflict might arise:

1. **Timestamp Collision**: If two or more ULIDs are generated at the exact same
   millisecond on different machines, then the uniqueness of the ULID is purely
   dependent on the randomness of the second component.
2. **Randomness Collision**: Even if the timestamp differs, if the random
   component generated is the same for two ULIDs (which is astronomically
   unlikely), there will be a conflict.

Now, let's consider the probability of each scenario:

1. **Timestamp Collision**: If you're generating millions of ULIDs in a short
   span of time, it's quite likely that you'll have multiple ULIDs with the same
   timestamp. This isn't a problem by itself, but it means the uniqueness then
   rests on the random component.
2. **Randomness Collision**: The random component of a ULID is 80 bits. This
   means there are \(2^{80}\) or approximately \(1.2 x 10^{24}\) possible
   values. If you generate millions (let's say one million for simplicity), the
   chance of any two having the same random value is tiny. Using the birthday
   paradox as a rough estimation, even after generating billions of ULIDs, the
   probability of a conflict in the random component remains astronomically low.

If you generate millions of ULIDs across multiple machines, the chances of a
collision are extremely low due to the large randomness space of the 80-bit
random component. The design of the ULID ensures that even in high-throughput
distributed systems, conflicts should be virtually non-existent. As always with
such systems, monitoring and conflict resolution strategies are still good
practices, but the inherent risks are minimal.
