#!/usr/bin/env -S deno run --allow-all

import $ from "https://deno.land/x/dax@0.30.1/mod.ts";
import { testingAsserts as ta } from "../../deps-test.ts";
import * as sqliteCLI from "../../lib/sqlite/cli.ts";
import * as ws from "../../lib/universal/whitespace.ts";
import { pgSQLa, SQLa } from "../../pattern/pgdcp/deps.ts";
import * as tp from "../typical/mod.ts";
import * as mod from "./migrate.ts";
import * as udm from "../udm/mod.ts";

const { gm, gts } = udm;

const relativeFilePath = (name: string) => {
  const absPath = $.path.fromFileUrl(import.meta.resolve(name));
  return $.path.relative(Deno.cwd(), absPath);
};

const relativeFileContent = (name: string) => {
  const absPath = $.path.fromFileUrl(import.meta.resolve(name));
  return Deno.readTextFileSync($.path.relative(Deno.cwd(), absPath));
};

type EmitContext = typeof ctx;
const ctx = SQLa.typicalSqlEmitContext({
  sqlDialect: SQLa.postgreSqlDialect(),
});

const infoSchemaLifecycle = SQLa.sqlSchemaDefn("info_schema_lifecycle", {
  isIdempotent: true,
});
const PgMigrateObj = mod.PgMigrate.init(
  () => ctx,
  infoSchemaLifecycle.sqlNamespace,
);
const searchPath = pgSQLa.pgSearchPath<
  typeof infoSchemaLifecycle.sqlNamespace,
  SQLa.SqlEmitContext
>(
  PgMigrateObj.infoSchemaLifecycle,
);

const migrateCreateSchema = SQLa.sqlSchemaDefn("sample_schema", {
  isIdempotent: true,
});
const migSearchPath = pgSQLa.pgSearchPath<
  typeof migrateCreateSchema.sqlNamespace,
  SQLa.SqlEmitContext
>(
  migrateCreateSchema,
);
const migrateCreateTable = gm.autoIncPkTable(
  "sample_table1",
  {
    sample_table1_id: udm.autoIncPK(),
    name: udm.textNullable(),
    age: udm.integer(),
    email: udm.text(),
    ...gm.housekeeping.columns,
  },
);

const createMigrationProcedure = PgMigrateObj
  .migrationScaffold(
    {
      version: "sample",
      dateTime: new Date(2023, 10, 16, 10, 16, 45),
    },
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

            ${migrateCreateSchema.SQL(ctx)}
            ${migSearchPath}
            ${migrateCreateTable.SQL(ctx)}

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
          -- All your checks must be idempotent and not have any side effects.
          -- Use information_schema and other introspection capabilities of PostgreSQL
          -- instead of manually checking. For example:

          -- IF EXISTS (
          --  SELECT FROM information_schema.columns
          --  WHERE table_name = '${migrateCreateTable.tableName}'
          -- ) THEN
          --  status := 1; -- Set status to 1 (already executed)
          -- END IF;
          RETURN status; -- Return the status
        `,
  );

function sqlDDL() {
  return SQLa.SQL<EmitContext>(gts.ddlOptions)`
    -- synthetic / test data
    ${PgMigrateObj.infoSchemaLifecycle}

    ${
    PgMigrateObj.content({
      version: "sample",
      dateTime: new Date(2023, 10, 16, 10, 16, 45),
    }).spIslmGovernance
  }

    ${
    PgMigrateObj.content({
      version: "sample",
      dateTime: new Date(2023, 10, 16, 10, 16, 45),
    }).spIslmMigrateSP
  }

    ${searchPath}

    ${
    PgMigrateObj.content({
      version: "sample",
      dateTime: new Date(2023, 10, 16, 10, 16, 45),
    }).islmGovernanceInsertion
  }

    ${createMigrationProcedure.migrateSP}

    ${createMigrationProcedure.rollbackSP}

    ${createMigrationProcedure.statusFn}


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
