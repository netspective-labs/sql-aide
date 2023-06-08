import { path } from "../../../deps.ts";
import { testingAsserts as ta } from "../../../deps-test.ts";
import { unindentWhitespace as uws } from "../../../lib/universal/whitespace.ts";
import * as mod from "./mod.ts";

/**
 * Given a file name, get its current location relative to this test script;
 * useful because unit tests can be run from any directory so we must find
 * the proper location automatically.
 */
const relativeFilePath = (name: string) => {
  const absPath = path.fromFileUrl(import.meta.resolve(name));
  return path.relative(Deno.cwd(), absPath);
};

Deno.test("Variable substitution, removed \\set from result, no overrides", () => {
  const sql = uws(`
    \\set name 'John Doe'
    \\set table users
    SELECT * FROM users WHERE username = :'name';
    SELECT * FROM :table WHERE username = :'name';
    SELECT * FROM :"table" WHERE username = :'name';`);

  const pp = mod.psqlPreprocess(sql, {
    setMetaCmd: mod.psqlSetMetaCmd({
      handleSetInResult: () => undefined,
    }),
  });
  ta.assertEquals(
    pp.interpolatedText,
    uws(`
        SELECT * FROM users WHERE username = 'John Doe';
        SELECT * FROM users WHERE username = 'John Doe';
        SELECT * FROM "users" WHERE username = 'John Doe';`),
  );
});

Deno.test("Variable substitution, removed \\set from result, with dependent variables", () => {
  const sql = uws(`
    \\set dcp_lib dcp_lib
    \\set dcp_lifecycle dcp_lifecycle
    \\set dcp_confidential dcp_confidential
    \\set dcp_assurance_engineering dcp_assurance_engineering

    CREATE SCHEMA IF NOT EXISTS :"dcp_lib";
    SET search_path TO :"dcp_lib";

    \\set federated_construct_storage 'BEGIN CREATE OR REPLACE PROCEDURE ' :dcp_lifecycle '.federated_construct_storage() AS $$ BEGIN CREATE TABLE IF NOT EXISTS ' :dcp_confidential '.fdw_postgres_authn ( context dcp_context.execution_context NOT NULL, identity text NOT NULL, host text NOT NULL, port integer NOT NULL, dbname text NOT NULL, remote_schema text[] NOT NULL, local_schema text[] NOT NULL, server_name text NOT NULL, fetch_size integer DEFAULT 50, user_name text NOT NULL, password_clear text NOT NULL, prepare_function_name text DEFAULT NULL, purpose text NOT NULL, ssl_cert text NULL, ssl_key text NULL, ssl_ca text NULL, ssl_capath text NULL, CONSTRAINT fdw_postgres_authn_unq_row UNIQUE(context, identity) ); END; $$ LANGUAGE PLPGSQL;END'
    DO :'federated_construct_storage';

    \\set federated_destroy_idempotent 'BEGIN CREATE OR REPLACE PROCEDURE ' :dcp_lifecycle '.federated_destroy_idempotent() AS $$ BEGIN DROP FUNCTION IF EXISTS ' :dcp_assurance_engineering '.test_federated(); DROP TABLE IF EXISTS ' :dcp_confidential '.fdw_postgres_authn; END; $$ LANGUAGE PLPGSQL; END'
    DO :federated_destroy_idempotent;

    CREATE OR REPLACE FUNCTION :dcp_assurance_engineering.test_federated() RETURNS SETOF TEXT AS $$
    BEGIN
      RETURN NEXT has_table(':dcp_confidential', 'fdw_postgres_authn');
    END;
    $$ LANGUAGE plpgsql;`);

  const pp = mod.psqlPreprocess(sql, {
    setMetaCmd: mod.psqlSetMetaCmd({
      handleSetInResult: () => undefined,
      onVarValueNotFound: () => `?????`,
    }),
  });
  ta.assertEquals(
    pp.interpolatedText,
    uws(`

        CREATE SCHEMA IF NOT EXISTS "dcp_lib";
        SET search_path TO "dcp_lib";

        DO 'BEGIN CREATE OR REPLACE PROCEDURE dcp_lifecycle.federated_construct_storage() AS $$ BEGIN CREATE TABLE IF NOT EXISTS dcp_confidential.fdw_postgres_authn ( context dcp_context.execution_context NOT NULL, identity text NOT NULL, host text NOT NULL, port integer NOT NULL, dbname text NOT NULL, remote_schema text[] NOT NULL, local_schema text[] NOT NULL, server_name text NOT NULL, fetch_size integer DEFAULT 50, user_name text NOT NULL, password_clear text NOT NULL, prepare_function_name text DEFAULT NULL, purpose text NOT NULL, ssl_cert text NULL, ssl_key text NULL, ssl_ca text NULL, ssl_capath text NULL, CONSTRAINT fdw_postgres_authn_unq_row UNIQUE(context, identity) ); END; $$ LANGUAGE PLPGSQL;END';

        DO BEGIN CREATE OR REPLACE PROCEDURE dcp_lifecycle.federated_destroy_idempotent() AS $$ BEGIN DROP FUNCTION IF EXISTS dcp_assurance_engineering.test_federated(); DROP TABLE IF EXISTS dcp_confidential.fdw_postgres_authn; END; $$ LANGUAGE PLPGSQL; END;

        CREATE OR REPLACE FUNCTION dcp_assurance_engineering.test_federated() RETURNS SETOF TEXT AS $$
        BEGIN
          RETURN NEXT has_table('dcp_confidential', 'fdw_postgres_authn');
        END;
        $$ LANGUAGE plpgsql;`),
  );
});

Deno.test("Variable substitution, keep \\set in result, with overrides", () => {
  const sql = uws(`
      \\set name 'John Doe'
      \\set table users
      \\set unit_test_schema dcp_assurance

      SELECT * FROM users WHERE username = :'name';
      SELECT * FROM :table WHERE username = :'name';
      SELECT * FROM :"table" WHERE username = :'name';
      SELECT * FROM :"table" WHERE username::"varchar" = :'name';
      SELECT email FROM :unit_test_schema.upsert_test_user((1, 'Updated Name', 'john.doe@example.com'):::"unit_test_schema".test_user)`);

  const pp = mod.psqlPreprocess(sql, {
    setMetaCmd: mod.psqlSetMetaCmd({
      onVarValueNotFound: () => `?????`,
      overrides: { name: "Shahid Shah" },
    }),
  });
  ta.assertEquals(
    pp.interpolatedText,
    uws(`
          -- \\set name 'John Doe' (variable: name, value: John Doe, srcLine: 1)
          -- \\set table users (variable: table, value: users, srcLine: 2)
          -- \\set unit_test_schema dcp_assurance (variable: unit_test_schema, value: dcp_assurance, srcLine: 3)

          SELECT * FROM users WHERE username = 'Shahid Shah';
          SELECT * FROM users WHERE username = 'Shahid Shah';
          SELECT * FROM "users" WHERE username = 'Shahid Shah';
          SELECT * FROM "users" WHERE username::"varchar" = 'Shahid Shah';
          SELECT email FROM dcp_assurance.upsert_test_user((1, 'Updated Name', 'john.doe@example.com')::"dcp_assurance".test_user)`),
  );
});

Deno.test("Include file and perform variable substitution, keep \\set in result, with overrides", () => {
  const sql = uws(`
      -- *** before first include ***

      \\include './include_test.fixture-01.psql'

      -- *** after first include ***`);

  const pp = mod.psqlPreprocess(sql, {
    setMetaCmd: mod.psqlSetMetaCmd({
      onVarValueNotFound: () => `?????`,
      overrides: { name: "Shahid Shah" },
    }),
    includeMetaCmd: mod.includeMetaCmd({
      resolve: (decl) => ({
        ...decl,
        resolved: relativeFilePath(decl.supplied),
      }),
    }),
  });
  ta.assertEquals(
    pp.interpolatedText,
    uws(`
          -- *** before first include ***

          -- fixture-01

          -- \\set name 'John Doe' (variable: name, value: John Doe, srcLine: 5)
          -- \\set table users (variable: table, value: users, srcLine: 6)
          -- \\set unit_test_schema dcp_assurance (variable: unit_test_schema, value: dcp_assurance, srcLine: 7)

          SELECT * FROM users WHERE username = 'Shahid Shah';
          SELECT * FROM users WHERE username = 'Shahid Shah';
          SELECT * FROM "users" WHERE username = 'Shahid Shah';
          SELECT * FROM "users" WHERE username::"varchar" = 'Shahid Shah';
          SELECT email FROM dcp_assurance.upsert_test_user((1, 'Updated Name', 'john.doe@example.com')::"dcp_assurance".test_user);

          -- *** after first include ***`),
  );
});
