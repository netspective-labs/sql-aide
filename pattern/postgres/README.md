# README: PostgreSQL Migration Feature

This README provides an overview and documentation for a TypeScript file that
implements a SQL migration feature in Deno. The code allows you to generate and
use SQL migration scripts for PostgreSQL databases. The code is designed to work
with Deno, a secure runtime for JavaScript and TypeScript.

## Introduction

This TypeScript test file is part of SQLa that offers a framework for managing
SQL migrations in a PostgreSQL database. The key features of this code include:

- Automated generation of SQL migration scripts.
- Support for migration versioning and description.
- Seamless execution of migrations.
- Rollback capabilities.
- Testing of migration scripts.

## Usage

### Defining Migrations

In this code, migrations are defined using the `PgMigrate` class, which provides
a set of methods for creating, executing, and testing migrations. To define a
migration, follow these steps:

1. Import the necessary modules and define a `PgMigrate` object:

   ```typescript
   import {
     pgSQLa,
     SQLa,
   } from "https://raw.githubusercontent.com/netspective-labs/sql-aide/vx.x.x/pattern/pgdcp/deps.ts";
   import * as tp from "https://raw.githubusercontent.com/netspective-labs/sql-aide/vx.x.x/pattern/typical/mod.ts";
   import * as mod from "https://raw.githubusercontent.com/netspective-labs/sql-aide/vx.x.x/pattern/postgres/migrate.ts";
   import * as udm from "https://raw.githubusercontent.com/netspective-labs/sql-aide/vx.x.x/pattern/udm/mod.ts";

   const migrate = PgMigrate.init(() => ctx, "schema_name");
   ```

2. Define the migration using the `migrationScaffold` method. Specify the
   migration version, arguments, and migration SQL script:

   ```typescript
   const createMigrationProcedure = migrate.migrationScaffold(
     {
       version: "sample",
       dateTime: new Date(2023, 10, 16, 10, 16, 45),
     },
     {},
     (args) =>
       SQLa.typedPlPgSqlBody(
         "",
         args,
         ctx,
         { autoBeginEnd: false },
       )`
       -- Add your migration SQL code here.
     `,
   );
   ```

3. Customize the migration as needed, including defining rollback and status
   functions.

4. Create and export a SQL Data Definition Language (DDL) function to generate
   SQL for the migrations:

   ```typescript
   function sqlDDL() {
     // Define the SQL DDL for the migrations.
     return SQLa.SQL<EmitContext>(gts.ddlOptions)`
       -- Define synthetic/test data
       ${migrate.infoSchemaLifecycle}
       ${createMigrationProcedure.migrateSP}
       ${createMigrationProcedure.rollbackSP}
       ${createMigrationProcedure.statusFn}
     `;
   }
   ```

### Running Migrations

To run migrations, generate fixture.sql file for which you can use the
command-line interface (CLI) provided in the code. Execute the following
command:

```bash
./your_migration_test.ts test-fixtures
```

Replace `your_migration_test.ts` with the actual name of your test file.

### Testing Migrations

The code includes testing functionality to ensure your migrations work
correctly. To run the tests, execute the following command:

```bash
deno-test your_migration_test.ts
```

Replace `your_migration_test.ts` with the actual name of your test file.

## Customization

You can customize the SQL migration feature to suit your project's specific
requirements by modifying the migration scripts and their associated logic.
Additionally, you can extend the code to handle more complex scenarios or
integrate it with other tools and frameworks.
