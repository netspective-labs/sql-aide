#!/usr/bin/env -S deno run --allow-all

/**
 * This TypeScript test file implements a SQL migration feature for PostgreSQL databases using Deno.
 * It provides methods for defining and executing migrations, as well as testing migration scripts.
 *
 * @module SQL_Migration_Feature
 */

import $ from "https://deno.land/x/dax@0.30.1/mod.ts";
import { testingAsserts as ta } from "../../deps-test.ts";
import * as sqliteCLI from "../../lib/sqlite/cli.ts";
import * as ws from "../../lib/universal/whitespace.ts";
import { pgSQLa, SQLa } from "../../pattern/pgdcp/deps.ts";
import * as tp from "../typical/mod.ts";
import * as mod from "./migrate.ts";
import * as udm from "../udm/mod.ts";

// Define a namespace UUID (you can choose any UUID)
const namespace = "1b671a64-40d5-491e-99b0-da01ff1f3341";

const {
  gm,
  gts,
} = udm;

const migrationInput = {
  version: "sample",
  versionNumber: 1,
  dateTime: new Date(2023, 10, 16, 10, 16, 45),
};

/**
 * A function that returns the relative file path of a given file name.
 *
 * @param {string} name - The name of the file.
 * @returns {string} The relative file path.
 */

const relativeFilePath = (name: string) => {
  const absPath = $.path.fromFileUrl(import.meta.resolve(name));
  return $.path.relative(Deno.cwd(), absPath);
};

/**
 * A function that returns the content of a file given its name.
 *
 * @param {string} name - The name of the file.
 * @returns {string} The content of the file.
 */

const relativeFileContent = (name: string) => {
  const absPath = $.path.fromFileUrl(import.meta.resolve(name));
  return Deno.readTextFileSync($.path.relative(Deno.cwd(), absPath));
};

/**
 * Represents the context for emitting SQL statements.
 *
 * @typedef {Object} EmitContext
 * @property {Object} ctx - The SQL emit context.
 */

type EmitContext = typeof ctx;
const ctx = SQLa.typicalSqlEmitContext({
  sqlDialect: SQLa.postgreSqlDialect(),
});

/**
 * Defines the SQL schema for an "info_schema_lifecycle" table.
 *
 * @type {Object}
 */

const infoSchemaLifecycle = SQLa.sqlSchemaDefn("info_schema_lifecycle", {
  isIdempotent: true,
});

/**
 * Initializes the PostgreSQL migration object.
 *
 * @type {Object}
 */
const PgMigrateObj = mod.PgMigrate.init(
  () => ctx,
  infoSchemaLifecycle.sqlNamespace,
);

/*
 * Defines the SQL schema for a sample schema "sample_schema".
 * This is a sample code generated through SQLa for migration.
 * This below code snippet can be deleted and we can generate
 * our own migration code.
 */
const migrateCreateSchema = SQLa.sqlSchemaDefn("sample_schema", {
  isIdempotent: true,
});

/**
 * Defines the SQL schema for a sample table "sample_table1".
 * This is a sample code generated through SQLa for migration.
 * This below code snippet can be deleted and we can generate
 * our own migration code.
 * @type {Object}
 */
const migrateCreateTable = gm.autoIncPkTable(
  "sample_table1",
  {
    sample_table1_id: udm.autoIncPK(),
    name: udm.textNullable(),
    age: udm.integer(),
    email: udm.text(),
    ...gm.housekeeping.columns,
  },
  {
    isIdempotent: true,
    sqlNS: migrateCreateSchema,
  },
);

/**
 * Creates a migration procedure for PostgreSQL.
 *
 * @type {Object}
 */

const createMigrationProcedure = PgMigrateObj
  .migrationScaffold(
    migrationInput,
    {},
    (args) =>
      pgSQLa.typedPlPgSqlBody(
        "",
        args,
        ctx,
        { autoBeginEnd: false },
      )`
          -- Add any PostgreSQL you need either manually constructed or SQLa.
          -- Your code will be placed automatically into a ISLM migration stored procedure.
          -- Use SQLa or Atlas for any code that you need. For example:

            /*
             ${migrateCreateSchema.SQL(ctx)};
             ${migrateCreateTable.SQL(ctx)};
            */


        `,
    (args) =>
      pgSQLa.typedPlPgSqlBody("", args, ctx)`
          -- Add any PostgreSQL you need either manually constructed or SQLa.
          -- Your code will be placed automatically into a ISLM rollback stored procedure.
          -- DROP table if exists "sample_schema".sample_table1;
        `,
    (args) =>
      pgSQLa.typedPlPgSqlBody("", args, ctx)`
          -- Add any PostgreSQL you need either manually constructed or SQLa.
          -- Your code will be placed automatically into a ISLM status stored function.
          -- All your checks must be idempotent and not have any side effects.
          -- Use information_schema and other introspection capabilities of PostgreSQL
          -- instead of manually checking. For example:

          -- IF EXISTS (
          --  SELECT FROM information_schema.columns
          --  WHERE table_name = 'sample_table1'
          -- ) THEN
          --  status := 1; -- Set status to 1 (already executed)
          -- END IF;
          RETURN status; -- Return the status
        `,
  );

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
      sp_migration_undo: PgMigrateObj.prependMigrationSPText + migrateVersion +
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

/**
 * Generates SQL Data Definition Language (DDL) for the migrations.
 *
 * @returns {string} The SQL DDL for migrations.
 */

function sqlDDL() {
  return SQLa.SQL<EmitContext>(gts.ddlOptions)`
    -- synthetic / test data
    ${PgMigrateObj.infoSchemaLifecycle}

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

if (import.meta.main) {
  const CLI = sqliteCLI.typicalCLI({
    resolveURI: (specifier) =>
      specifier ? import.meta.resolve(specifier) : import.meta.url,
    defaultSql: () => ws.unindentWhitespace(sqlDDL().SQL(ctx)),
  });

  await CLI.commands
    .command("driver", tp.sqliteDriverCommand(sqlDDL, ctx)).command(
      "test-fixtures",
      new tp.cli.Command()
        .description("Emit all test fixtures")
        .action(async () => {
          const CLI = relativeFilePath("./migrate_test.ts");
          const [sql] = [".sql"].map((extn) =>
            relativeFilePath(`./migrate_test.fixture${extn}`)
          );
          Deno.writeTextFileSync(sql, await $`./${CLI} sql`.text());
          [sql].forEach((f) => console.log(f));
        }),
    ).parse(Deno.args);
}

Deno.test("Postgres Migration Pattern", async (tc) => {
  const CLI = relativeFilePath("./migrate_test.ts");

  await tc.step("CLI SQL content", async () => {
    const output = await $`./${CLI} sql`.text();
    ta.assertEquals(
      output,
      relativeFileContent("./migrate_test.fixture.sql"),
    );
  });

  // deno-lint-ignore require-await
  await tc.step("Typescript SQL", async () => {
    const output = sqlDDL().SQL(ctx);
    ta.assertEquals(
      output,
      relativeFileContent("./migrate_test.fixture.sql"),
    );
  });
});

Deno.test("Postgres Migration Pattern Module", async (tc) => {
  await tc.step("CLI SQL content", () => {
    const output = sqlDDL().SQL(ctx);
    ta.assertEquals(
      output,
      relativeFileContent("./migrate_test.fixture.sql"),
    );
  });
});
