# `psql`-style SQL source pre-processor

Preprocess text in a way that `psql` would. Specifically, allow `\set` variables
to be defined in the source and overridden via CLI.

## \include

Supports these types of `include` statements (must be at the start of a line):

```psql
\i filename.sql
\include ../filename.sql
\include '../filename.sql'
\include "../filename.sql"
```

Similar to `psql`, `\i` and `\include` are synonyms; relative files are resolved
from the current working directory but other rules can be provided as well.

## \set

Supports these types of `set` statements (must be at the start of a line):

```psql
\set name John
\set count 42
\set url 'https://example.com'
\set var = value
\set greeting 'Hello, \'world!'
\set greeting2 "Hello, \"world!"
```

Similar to `psql`, supports this type of replacement:

| Style     | Replacement |
| --------- | ----------- |
| `:name`   | John        |
| `:'name'` | 'John'      |
| `:"name"` | "John"      |
