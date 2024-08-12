# Information Schema Lifecycle Manager (ISLM)

The Information Schema Lifecycle Manager (ISLM) is a PostgreSQL-native schema
migration system designed to manage and automate database schema evolution. By
encapsulating schema evolution (migration) logic within PostgreSQL stored
routines, ISLM provides a robust and manageable approach to database schema
evolution. It operates within a dedicated schema named `info_schema_lifecycle`
and uses stateless helper functions (`islm_*`) to help DBAs orchestrate
migrations based on naming conventions.

The ISLM infrastructure is designed not to actually execute SQL but to provide
state management and helper functions that generate SQL which can then be
executed. DBAs review the generated code and execute the scripts. This design
ensures that ISLM is as safe as possible, providing helpers to prepare SQL but
not execute it directly.

ISLM helps with state management by maintaining the lifecycle and status of
migration routines, ensuring that all schema changes are tracked and managed
effectively.

Benefits:

- Simplicity: ISLM is simple and straightforward to use, operating entirely
  within PostgreSQL without the need for external tools.
- PostgreSQL-Native: ISLM leverages PostgreSQL's native functionality, ensuring
  compatibility and ease of use within PostgreSQL environments.
- Revisionable: Since each migration is just a stored procedure, schema
  evoluation can be revisioned via Git.
- Focus on Documentation: ISLM's design allows teams to focus on clear and
  thorough documentation of database schema evolution.
- Code Quality with plpgsql_check: ISLM integrates with the plpgsql_check
  extension to ensure that all PL/pgSQL functions are linted, catching common
  issues and promoting best practices in your migration routines.

There is an ISLM "Control Plane" Deno TypeScript CLI utility called
`islmctl.ts`, which is essentially a convenience wrapper around `psql` and all
the ISLM stored procedures.

## Significant Components

- **Schema and Bootstrap Procedure**:
  - The `info_schema_lifecycle` schema contains all ISLM-related objects.
  - The `islm_bootstrap_idempotent` procedure creates essential tables:
    `islm_infrastructure_artifact` and `islm_governance`.
  - `islm_infrastructure_artifact` stores governance and infrastructure-related
    artifacts.
  - `islm_governance` manages schema migrations and their lifecycle, including
    details such as migration routine names, versions, reasons, idempotency, and
    SCXML states.

- **Helper Functions**:
  - `migration_routine_candidate`: Finds migration routines based on naming
    conventions and returns relevant details, including possible undo and status
    routines.
  - `migration_routine_state`: Provides the migration status for each candidate
    routine by joining the results of `migration_routine_candidate` with the
    `islm_governance` table.

- **Instruction and Script Generation**:
  - `islm_migration_instruction`: Discovers migration routines and generates
    instructions for their execution, based on the current state and
    idempotency.
  - **`islm_migration_script`**: Generates a SQL script for executing migration
    routines, based on the instructions from `islm_migration_instruction`.
    `islm_migration_script` will be the script you use most often.

- **Linting and Quality Assurance**:
  - **`plpgsql_check` Integration**: ISLM integrates with the plpgsql_check
    extension to lint PL/pgSQL functions. This ensures that all migration
    routines are of high quality and free of common issues. Functions like
    migration_lint_lifecycle and migration_lint provide comprehensive linting
    checks, returning results in a structured JSONB format.

## Usage

To start using ISLM, follow these steps:

### 1. Load the islm-driver.psql File

Use the `psql` command-line tool to load the islm-driver.psql file into your
PostgreSQL database:

```sh
psql -f islm-driver.psql
```

You can use `islmctl.ts evolve up` (see below) or `psql` directly.

There's a special stored procedure called `islm_bootstrap_idempotent`, which
runs automatically when `islm-driver.psql` is loaded, to create the necessary
tables and objects. Search for `islm_bootstrap_idempotent` in `islm-driver.psql`
to learn more.

### 2. Define Migration Routines

Follow the naming conventions to define your migration routines. The expected
naming conventions are:

- `migrate_vYYYY_MM_DD_HH_MM_stateful_XYZ`
- `migrate_vYYYY_MM_DD_HH_MM_idempotent_XYZ`

### 3. Use Helper Functions to Manage Migrations

By default, all helper functions use the `info_schema_lifecycle` schema and
other default arguments. You can pass in other arguments as appropriate.

#### Discover Migration Routines

To find migration routines based on the naming conventions:

```sql
SELECT * FROM "info_schema_lifecycle"."migration_routine_candidate"();
```

#### Check Migration Status

To get the migration status for each candidate routine:

```sql
SELECT * FROM "info_schema_lifecycle"."migration_routine_state"();
```

#### Generate Migration Script

To generate a SQL script for executing migration routines:

```sql
SELECT "info_schema_lifecycle"."islm_migration_script"();
```

For detailed usage and examples, refer to the source code and comments within
the islm-infrastructure.psql file.

### Using `islmctl.ts`

The `islmctl.ts` utility can be used to manage schema migrations more
conveniently than using `psql` alone. The following `islmctl.ts evolve`
subcommands are available:

- `up`: Use `psql` to load migration stored procedures into the database.
- `candidates`: Use `psql` to check for migration candidates (stored
  procedures).
- `state`: Use `psql` to get the migration state for each candidate routine.
- `script`: Use `psql` to generate migration scripts based on the current state.
- `test`: Use `psql` to execute test scripts for ISLM infrastructure.
- `omnibus-fresh`: Freshen the given connection ID by dropping and recreating
  the schema. This is a dangerous subcommand and should only be used in a
  sandbox environemtn.

To see the commands available in `islmctl.ts evolve`, use the following command:

```sh
islmctl.ts evolve --help
```

## Analysis of Alternatives

### Flyway

- **Versioned Migrations**: Each migration has a version, a description, and a
  checksum. Migrations can be written in SQL or Java.
- **Checksum Validation**: Flyway validates on startup that the migrations
  applied to the database match the ones available locally.
- **Repair Functionality**: Provides a repair command to correct the schema
  history table if needed.
- **Callbacks**: Custom operations can be performed before/after each migration,
  or before/after all migrations.
- **Configuration Options**: Extensive configuration options available through
  files, environment variables, and command-line arguments.
- **Cross-Team Development**: Supports working in a team environment with
  branching and merging.

### Liquibase

- **XML, YAML, JSON, and SQL Formats**: Changelog files can be written in
  various formats.
- **Database-Agnostic Syntax**: Offers a database-agnostic syntax for
  changesets, which are translated into database-specific SQL.
- **Changeset Execution**: Changesets can include preconditions, rollback code,
  and can be executed in transactions.
- **Database Refactoring**: Manages a sequence of changes to the database
  schema, including complex refactoring.
- **Command Line and Maven/Gradle Integration**: Offers command-line tools and
  integrates with Maven and Gradle.

### ISLM

- **Simplicity**: ISLM is simple and straightforward to use. Instead of creating
  an external strategy for PostgreSQL, ISLM does everything inside Postgres.

### Summary

- **Flyway**: Best for projects needing versioned migrations, checksum
  validation, and extensive configuration options, particularly in Java-based
  environments.
- **Liquibase**: Ideal for projects requiring a database-agnostic approach,
  multiple changelog formats, and integration with build tools like Maven and
  Gradle.
- **ISLM**: Best for teams looking for a straightforward solution that operates
  entirely within PostgreSQL without the need for external tools.

## License

This project is licensed under the MIT License - see the LICENSE file for
details.
