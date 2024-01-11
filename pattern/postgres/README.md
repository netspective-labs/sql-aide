# README: PostgreSQL Migration Feature

This README provides an overview and documentation for a TypeScript file that
generates a .sql file for SQL migration feature. The code allows you to generate
and use SQL migration scripts for PostgreSQL databases. The code is designed to
work with Deno.

## Introduction

This file uses SQLa that offers a framework for generating SQL migrations in a
PostgreSQL database. The key features of this code include:

- Automated generation of SQL migration scripts.
- Support for migration versioning and description.
- Testing of migration scripts.

## Usage

### Defining Migrations

In this code, migrations are defined using the `PgMigrate` class, which provides
a set of methods for creating, executing, and testing migrations. To define a
migration, follow these steps:

1. Import the necessary modules and define a `PgMigrate` object:

   ```typescript
   import $ from "https://deno.land/x/dax@0.30.1/mod.ts";
   import { testingAsserts as ta } from "https://raw.githubusercontent.com/netspective-labs/sql-aide/vx.x.x/deps-test.ts";
   import * as sqliteCLI from "https://raw.githubusercontent.com/netspective-labs/sql-aide/vx.x.x/lib/sqlite/cli.ts";
   import * as ws from "https://raw.githubusercontent.com/netspective-labs/sql-aide/vx.x.x/lib/universal/whitespace.ts";
   import {
     pgSQLa,
     SQLa,
   } from "https://raw.githubusercontent.com/netspective-labs/sql-aide/vx.x.x/pattern/pgdcp/deps.ts";
   import * as tp from "https://raw.githubusercontent.com/netspective-labs/sql-aide/vx.x.x/pattern/typical/mod.ts";
   import * as mod from "https://raw.githubusercontent.com/netspective-labs/sql-aide/vx.x.x/pattern/postgres/migrate.ts";
   import * as udm from "https://raw.githubusercontent.com/netspective-labs/sql-aide/vx.x.x/pattern/udm/mod.ts";

   //This uuid value is used for test purpose. You can generate the proper uuid through other means like importing from deno package (https://deno.land/std@0.211.0/uuid/mod.ts)
   const namespace = "1b671a64-40d5-491e-99b0-da01ff1f3341";

   const migrate = PgMigrate.init(() => ctx, "schema_name");
   const migrationInput = {
     version: "sample",
     versionNumber: 1,
     dateTime: new Date(2023, 10, 16, 10, 16, 45),
   };
   ```

2. Define the migration using the `migrationScaffold` method. Specify the
   migration version, arguments, and migration SQL script:

   ```typescript
   const createMigrationProcedure = migrate.migrationScaffold(
     migrationInput,
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
     (args) =>
       pgSQLa.typedPlPgSqlBody("", args, ctx)`
          -- Add any PostgreSQL you need either manually constructed or SQLa.
          -- Your code will be placed automatically into a ISLM rollback stored procedure.
        `,
     (args) =>
       pgSQLa.typedPlPgSqlBody("", args, ctx)`
          -- Add any PostgreSQL you need either manually constructed or SQLa.
          -- Your code will be placed automatically into a ISLM status stored function.
        `,
   );
   ```

3. Customize the migration as needed, including defining rollback and status
   functions.

4. Create the initial insert statement for loading the migration script

   ```typescript
   const formattedDate = PgMigrateObj.formatDateToCustomString(
     migrationInput.dateTime,
   );
   const migrateVersion = "V" + migrationInput.version + formattedDate;
   const migrateVersionNumber = migrationInput.versionNumber;
   const islmGovernanceInsertion = PgMigrateObj.content()
     .islmGovernance.insertDML([
       {
         islm_governance_id: namespace,
         state_sort_index: migrateVersionNumber,
         sp_migration: PgMigrateObj.prependMigrationSPText + migrateVersion,
         sp_migration_undo: PgMigrateObj.prependMigrationSPText +
           migrateVersion +
           PgMigrateObj.appendMigrationUndoSPText,
         fn_migration_status: PgMigrateObj.prependMigrationSPText +
           migrateVersion +
           PgMigrateObj.appendMigrationStatusFnText,
         from_state: mod.TransitionStatus.NONE,
         to_state: mod.TransitionStatus.SQLLOADED,
         transition_reason: "SQL load for migration",
         transition_result: "{}",
         created_at: PgMigrateObj.sqlEngineNow,
         created_by: "Admin",
       },
     ], {
       onConflict: {
         SQL: () => `ON CONFLICT DO NOTHING`,
       },
     });
   ```

5. Create and export a SQL Data Definition Language (DDL) function to generate
   SQL for the migrations:

   ```typescript
   function sqlDDL() {
     // Define the SQL DDL for the migrations.
     return SQLa.SQL<EmitContext>(gts.ddlOptions)`
    -- synthetic / test data
    ${PgMigrateObj.infoSchemaLifecycle}

    ${searchPath}

    ${PgMigrateObj.content().extn}

    ${PgMigrateObj.content().spIslmGovernance}

    ${PgMigrateObj.content().spIslmMigrateSP}



    ${createMigrationProcedure.migrateSP}

    ${createMigrationProcedure.rollbackSP}

    ${createMigrationProcedure.statusFn}

    CALL ${PgMigrateObj.content().spIslmGovernance.routineName}();
    ${islmGovernanceInsertion}





    `;
   }
   ```

### Generate SQL for Migrations

To generate the SQL for migrations, generate fixture.sql file for which you can
use the command-line interface (CLI) provided in the code. Execute the following
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
