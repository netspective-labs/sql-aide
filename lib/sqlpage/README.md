# SQLPageAide

## Introduction to SQLPage

SQLPage is an open-source web server written in Rust, designed to build web
applications entirely using SQL. It allows users to write SQL queries that are
executed on a database, and the results are rendered as web pages. This utility
is particularly useful for those who are proficient in SQL but may not have
extensive experience with traditional web programming languages like HTML, CSS,
or JavaScript.

SQLPage operates by mapping the results of SQL queries to pre-defined web
components, such as tables, charts, forms, and more. These components can be
customized using HTML templates, providing flexibility in how the data is
presented. The tool supports multiple databases, including SQLite, PostgreSQL,
MySQL, and Microsoft SQL Server.

The primary appeal of SQLPage is its simplicity and ease of use. Developers can
get started quickly by downloading a single executable file, writing SQL
queries, and immediately seeing the results as a functional website. It's
particularly well-suited for data analysts, business intelligence teams, and
others who need to build data-centric applications without getting into the
complexities of full-stack web development.

SQLPage also supports advanced features like user authentication, file uploads,
and HTTPS. It can be deployed on various platforms, including local servers and
cloud environments, and supports integration with Docker for easy deployment.

For more detailed information and examples, you can explore the documentation
and discussions available on
[SQLPage's GitHub](https://github.com/lovasoa/SQLpage) and related resources.

## Structure of `sqlpage_files` Table

The `sqlpage_files` table in SQLPage serves as a storage mechanism within the
database to host files used by the application. The structure of this table
includes the following columns:

- **path**: A text or string field that stores the file path or identifier. This
  path is used to reference the file within the SQLPage application, allowing it
  to be served or accessed as needed.

- **contents**: A BLOB (Binary Large Object) field that contains the actual file
  data. This could be anything from images, JSON files, configuration files, or
  other binary content. Storing the file data in BLOB format ensures that binary
  data can be stored and retrieved accurately.

- **last_modified**: A timestamp field that records the last time the file was
  modified. This is useful for caching, version control, and ensuring that the
  most up-to-date version of the file is served.

This structure allows SQLPage to serve files dynamically from the database,
enabling features like localization, theming, and dynamic content management
directly within SQLPage applications.

## SQLPageAide class

`SQLPageAide` is a utility class designed to facilitate the creation of upsert
statements for inserting records into `sqlpage_files` table. `SQLPageAide` does
not operate on a database, it just generates SQL.

## Key Features

- **No Dependencies**: Does not depend on SQLa or any other library but can use
  all of SQLa if desired.
- **Structured Definitions**: Define SQL page paths and contents using classes
  or objects.
- **Convenience Functions**:
  - `sources()`: Specify the classes or objects containing SQL definitions.
  - `include()`: Include specific patterns to match method names.
  - `exclude()`: Exclude specific patterns from matching method names.
  - `withContentsArgs()`: Inject additional context or arguments into SQL
    methods for dynamic content.
  - `pathContents()`: Customize the method selection process for upserting into
    `sqlpage_files`.
- **Automatic Upsert Generation**:
  - `upsertValues()`: Collects and prepares SQL statements for insertion or
    update.
  - `SQL()`: Generates SQL statements to manage entries in the `sqlpage_files`
    table.

## Usage Examples

### Basic Example

Define a class with SQL methods and use SQLPageAide to generate SQL upsert
statements.

```typescript
// Define a class with SQL methods
class MySqlPages {
  "index.sql"() {
    return "SELECT * FROM users;";
  }

  "page1.sql"() {
    return "INSERT INTO users (name, email) VALUES ('John Doe', 'john@example.com');";
  }
}

// Generate SQL statements
const sqlAide = new SQLPageAide(MySqlPages);
const sqlStatements = sqlAide.SQL();
console.log(sqlStatements);
// Output:
// INSERT INTO sqlpage_files (path, contents, last_modified) VALUES ('index.sql', 'SELECT * FROM users;', CURRENT_TIMESTAMP) ON CONFLICT(path) DO UPDATE SET contents=excluded.contents, last_modified=CURRENT_TIMESTAMP);
// INSERT INTO sqlpage_files (path, contents, last_modified) VALUES ('page1.sql', 'INSERT INTO users (name, email) VALUES (''John Doe'', ''john@example.com'');', CURRENT_TIMESTAMP) ON CONFLICT(path) DO UPDATE SET contents=excluded.contents, last_modified=CURRENT_TIMESTAMP);
```

### Using Contents Args Supplier

Inject additional arguments into SQL methods for dynamic content generation.

```typescript
class MySqlPages {
  "index.sql"(user: string) {
    return `SELECT * FROM users WHERE name = '${user}';`;
  }
}

const sqlPageAide = new SQLPageAide(MySqlPages)
  .withContentsArgs((_source, _path, user: string) => [user]);

const sqlStatements = sqlPageAide.SQL("John Doe");
console.log(sqlStatements);
// Output:
// INSERT INTO sqlpage_files (path, contents, last_modified) VALUES ('index.sql', 'SELECT * FROM users WHERE name = ''John Doe'';', CURRENT_TIMESTAMP) ON CONFLICT(path) DO UPDATE SET contents=excluded.contents, last_modified=CURRENT_TIMESTAMP);
```

### Including and Excluding Methods

Include or exclude specific methods based on patterns.

```typescript
class MySqlPages {
  "index.sql"() {
    return "SELECT * FROM users;";
  }

  "page1.sql"() {
    return "INSERT INTO users (name, email) VALUES ('John Doe', 'john@example.com');";
  }

  "admin.sql"() {
    return "SELECT * FROM admins;";
  }
}

const sqlAide = new SQLPageAide(MySqlPages)
  .include(/index\.sql/, /page1\.sql/)
  .exclude(/admin\.sql/);

const sqlStatements = sqlAide.SQL();
console.log(sqlStatements);
// Output includes only statements for index.sql and page1.sql, excluding admin.sql.
```

### Custom Path Contents Supplier

Customize the method selection process.

```typescript
class MySqlPages {
  "index.sql"() {
    return "SELECT * FROM users;";
  }

  "page1.sql"() {
    return "INSERT INTO users (name, email) VALUES ('John Doe', 'john@example.com');";
  }

  "admin.sql"() {
    return "SELECT * FROM admins;";
  }
}

const customPathContentsSupplier = (
  sp: SourcePaths<MySqlPages>,
  includePatterns: PathPattern[],
  excludePatterns: PathPattern[],
) => {
  return sp.paths.filter((path) =>
    path.startsWith("index") || path.startsWith("page")
  );
};

const sqlAide = new SQLPageAide(MySqlPages)
  .pathContents(customPathContentsSupplier);

const sqlStatements = sqlAide.SQL();
console.log(sqlStatements);
// Output includes statements for index.sql and page1.sql, based on custom supplier logic.
```
