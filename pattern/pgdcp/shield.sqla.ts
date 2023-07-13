#!/usr/bin/env -S deno run --allow-all

import { persistContent as pc, pgSQLa, SQLa, zod as z } from "./deps.ts";
import * as pgdcp from "./pgdcp.ts";

export class PgDcpShield {
  protected constructor() {}

  readonly state = pgdcp.pgDcpState(import.meta, {
    subjectArea: "shield",
    schemas: ["dcp_lib", "dcp_extensions", "dcp_assurance"],
  });

  // readonly lSchema = this.state.ec.schemaDefns.dcp_lib;

  readonly ctx = SQLa.typicalSqlEmitContext({
    sqlDialect: SQLa.postgreSqlDialect(),
  });

  content() {
    const { ec, schemas } = this.state;
    // const { sqlNamespace: extnsSchemaName } = ec.schemaDefns.dcp_lib;
    const [lQR] = ec.schemaQualifier("dcp_lib");
    const [aQR] = ec.schemaQualifier("dcp_assurance");
    const extnPgjwt = ec.extnDefns.pgjwt;
    const extnPgcrypto = ec.extnDefns.pgcrypto;
    const dcpLibSchema = SQLa.sqlSchemaDefn("dcp_lib", {
      isIdempotent: true,
    });
    const jwtTokenSigned = SQLa.sqlTypeDefinition("jwt_token_signed", {
      token: z.string(),
    }, {
      sqlNS: dcpLibSchema,
      embeddedStsOptions: SQLa.typicalSqlTextSupplierOptions(),
    });
    const jwtTokenSignedBlock = pgSQLa.anonymousPlPgSqlRoutine(this.ctx)`
        ${jwtTokenSigned}
      EXCEPTION
        WHEN DUPLICATE_OBJECT THEN
          RAISE NOTICE 'type "jwt_token_signed" already exists, skipping';`;
    const createRoleIfNotExists = pgSQLa.storedProcedure(
      "create_role_if_not_exists",
      {
        role_name: z.string(),
      },
      (name, args, _) => pgSQLa.typedPlPgSqlBody(name, args, this.ctx),
      {
        embeddedStsOptions: SQLa.typicalSqlTextSupplierOptions(),
        autoBeginEnd: false,
        isIdempotent: false,
        sqlNS: dcpLibSchema,
      },
    )`EXECUTE FORMAT('CREATE ROLE %I WITH NOLOGIN', role_name);
    EXCEPTION
      WHEN DUPLICATE_OBJECT THEN RAISE NOTICE 'role "%" already exists, skipping', role_name;
    `;

    const createAllPrivilegesDcpSchemaRole = pgSQLa.storedProcedure(
      "create_all_privileges_dcp_schema_role",
      {
        dcp_schema_name: z.string(),
        role_name: z.string(),
      },
      (name, args, _) => pgSQLa.typedPlPgSqlBody(name, args, this.ctx),
      {
        embeddedStsOptions: SQLa.typicalSqlTextSupplierOptions(),
        autoBeginEnd: false,
        isIdempotent: false,
        sqlNS: dcpLibSchema,
      },
    )`call ${lQR(`create_role_if_not_exists`)}(role_name);
      EXECUTE FORMAT('GRANT USAGE ON SCHEMA %I TO %I', dcp_schema_name, role_name);
      EXECUTE FORMAT('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA %I TO %I', dcp_schema_name, role_name);
      EXECUTE FORMAT('GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA %I TO %I', dcp_schema_name, role_name);
      -- Grants the same privileges as exists in the current schema for all future table or views that are created after calling this function.
      EXECUTE FORMAT('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT ALL PRIVILEGES ON TABLES TO %I', dcp_schema_name, role_name);
    `;

    const createReadOnlyPrivilegesDcpSchemaRole = pgSQLa.storedProcedure(
      "create_read_only_privileges_dcp_schema_role",
      {
        dcp_schema_name: z.string(),
        role_name: z.string(),
      },
      (name, args, _) => pgSQLa.typedPlPgSqlBody(name, args, this.ctx),
      {
        embeddedStsOptions: SQLa.typicalSqlTextSupplierOptions(),
        autoBeginEnd: false,
        isIdempotent: false,
        sqlNS: dcpLibSchema,
      },
    )`call ${lQR(`create_role_if_not_exists`)}(role_name);
      EXECUTE FORMAT('GRANT USAGE ON SCHEMA %I TO %I', dcp_schema_name, role_name);
      EXECUTE FORMAT('GRANT SELECT ON ALL TABLES IN SCHEMA %I TO %I', dcp_schema_name, role_name);
      EXECUTE FORMAT('GRANT SELECT ON ALL SEQUENCES IN SCHEMA %I TO %I', dcp_schema_name, role_name);
      -- Grants the same privileges as exists in the current schema for all future table or views that are created after calling this function.
      EXECUTE FORMAT('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT SELECT ON TABLES TO %I', dcp_schema_name, role_name);
    `;

    const grantExecuteOnProcedure = pgSQLa.storedProcedure(
      "grant_execute_on_procedure",
      {
        function_name: z.string(),
        role_name: z.string(),
      },
      (name, args, _) => pgSQLa.typedPlPgSqlBody(name, args, this.ctx),
      {
        embeddedStsOptions: SQLa.typicalSqlTextSupplierOptions(),
        autoBeginEnd: false,
        isIdempotent: false,
        sqlNS: dcpLibSchema,
      },
    )`CALL ${lQR(`create_role_if_not_exists`)}(role_name);
      EXECUTE FORMAT('GRANT EXECUTE ON PROCEDURE %s TO %I', function_name, role_name);
    `;

    const grantExecuteOnFunction = pgSQLa.storedProcedure(
      "grant_execute_on_function",
      {
        function_name: z.string(),
        role_name: z.string(),
      },
      (name, args, _) => pgSQLa.typedPlPgSqlBody(name, args, this.ctx),
      {
        embeddedStsOptions: SQLa.typicalSqlTextSupplierOptions(),
        autoBeginEnd: false,
        isIdempotent: false,
        sqlNS: dcpLibSchema,
      },
    )`CALL ${lQR(`create_role_if_not_exists`)}(role_name);
      EXECUTE FORMAT('GRANT EXECUTE ON FUNCTION %s TO %I', function_name, role_name);
    `;

    const revokeAllPrivilegesViewsRole = pgSQLa.storedProcedure(
      "revoke_all_privileges_views_role",
      {
        schema_name: z.string(),
        view_name: z.string(),
        role_name: z.string(),
      },
      (name, args, _) => pgSQLa.typedPlPgSqlBody(name, args, this.ctx),
      {
        embeddedStsOptions: SQLa.typicalSqlTextSupplierOptions(),
        autoBeginEnd: false,
        isIdempotent: false,
        sqlNS: dcpLibSchema,
      },
    )`EXECUTE FORMAT('REVOKE ALL ON %I.%I FROM %I',schema_name,view_name, role_name);
    `;

    const revokeAllPrivilegesDcpSchemaRole = pgSQLa.storedProcedure(
      "revoke_all_privileges_dcp_schema_role",
      {
        dcp_schema_name: z.string(),
        role_name: z.string(),
      },
      (name, args, _) => pgSQLa.typedPlPgSqlBody(name, args, this.ctx),
      {
        embeddedStsOptions: SQLa.typicalSqlTextSupplierOptions(),
        autoBeginEnd: false,
        isIdempotent: false,
        sqlNS: dcpLibSchema,
      },
    )`EXECUTE FORMAT('REVOKE ALL PRIVILEGES ON SCHEMA %I FROM %I', dcp_schema_name, role_name);
    EXECUTE FORMAT('REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA %I FROM %I', dcp_schema_name, role_name);
    EXECUTE FORMAT('REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA %I FROM %I', dcp_schema_name, role_name);
    `;

    const dropRoleAndUserIfExists = pgSQLa.storedProcedure(
      "drop_role_and_user_if_exists",
      {
        role_name: z.string(),
        user_name: z.string(),
      },
      (name, args, _) => pgSQLa.typedPlPgSqlBody(name, args, this.ctx),
      {
        embeddedStsOptions: SQLa.typicalSqlTextSupplierOptions(),
        autoBeginEnd: false,
        isIdempotent: false,
        sqlNS: dcpLibSchema,
      },
    )`EXECUTE FORMAT('REASSIGN OWNED BY %I', role_name);
    EXECUTE FORMAT('DROP OWNED BY %I', role_name);
    EXECUTE FORMAT('DROP ROLE IF EXISTS %I', role_name);
    EXECUTE FORMAT('DROP USER IF EXISTS %I', user_name);
    `;

    const createDatabaseUserWithRole = pgSQLa.storedFunction(
      "create_database_user_with_role",
      {
        user_name: z.string(),
        user_passwd: z.string(),
        role_name: z.string(),
      },
      "SMALLINT",
      (name, args) => pgSQLa.typedPlPgSqlBody(name, args, this.ctx),
      {
        embeddedStsOptions: SQLa.typicalSqlTextSupplierOptions(),
        autoBeginEnd: false,
        isIdempotent: true,
        sqlNS: schemas[0],
        headerBodySeparator: "$create_database_user_with_role$",
        privilegesSQL: { SQL: () => `STRICT VOLATILE SECURITY DEFINER` },
      },
    )`-- escape properly to prevent SQL injection
    IF NOT EXISTS ( SELECT FROM pg_roles WHERE  rolname = user_name) THEN
      EXECUTE FORMAT('CREATE USER %I WITH LOGIN PASSWORD %L', user_name, user_passwd);
      EXECUTE FORMAT('GRANT %I TO %I', role_name, user_name);
    END IF;
    RETURN 1;`;

    const authenticateApiPgNative = pgSQLa.storedFunction(
      "authenticate_api_pg_native",
      {
        username: z.string(),
        password: z.string(),
      },
      "TEXT",
      (name, args) => pgSQLa.typedPlPgSqlBody(name, args, this.ctx),
      {
        embeddedStsOptions: SQLa.typicalSqlTextSupplierOptions(),
        autoBeginEnd: false,
        isIdempotent: true,
        sqlNS: schemas[0],
        headerBodySeparator: "$authenticate_api_pg_native$",
        privilegesSQL: { SQL: () => `STRICT VOLATILE SECURITY DEFINER` },
      },
    )`
      DECLARE
      jwt_token TEXT;
      account pg_catalog.pg_authid;
      username_password text;
      user_role text;
      BEGIN
        select a.* into account from pg_catalog.pg_authid as a where a.rolname = username;
        username_password := (select concat(password,username));
        user_role:= (select rolname from pg_user
          join pg_auth_members on (pg_user.usesysid=pg_auth_members.member)
          join pg_roles on (pg_roles.oid=pg_auth_members.roleid)
          where pg_user.usename=username);
        IF account.rolname IS NOT NULL and account.rolpassword = concat('md5',md5(username_password)) THEN
          jwt_token:= dcp_extensions.sign(
            row_to_json(r), 'pgdcpsecurewebtokenpgdcpsecurewebtoken'
          ) AS token
          FROM (SELECT
            user_role as role,
            extract(epoch from now())::integer + 1200 AS exp,
            account.oid as user_id,
            account.rolname as username,
            extract(epoch from now())::integer AS iat,
            'postgraphile' as aud,
            'postgraphile' as iss
          ) r;
          return jwt_token;
        ELSE
          RETURN NULL;
        END IF;
      END;
    `;

    const testShield = pgSQLa.storedFunction(
      "test_shield",
      {},
      "SETOF TEXT",
      (name, args) => pgSQLa.typedPlPgSqlBody(name, args, this.ctx),
      {
        embeddedStsOptions: SQLa.typicalSqlTextSupplierOptions(),
        autoBeginEnd: false,
        isIdempotent: true,
        sqlNS: schemas[0],
        headerBodySeparator: "$test_shield$",
      },
    )`
    RETURN NEXT ${aQR(`hasFunction`)}("dcp_lib", ${
      lQR(`create_role_if_not_exists`)
    });
      RETURN NEXT ${aQR(`hasFunction`)}("dcp_lib", ${
      lQR(`create_all_privileges_dcp_schema_role`)
    });
      RETURN NEXT ${aQR(`hasFunction`)}("dcp_lib", ${
      lQR(`create_database_user_with_role`)
    });
      RETURN NEXT ${aQR(`hasFunction`)}("dcp_lib", ${
      lQR(`create_read_only_privileges_dcp_schema_role`)
    });
      RETURN NEXT ${aQR(`hasFunction`)}("dcp_lib", ${
      lQR(`revoke_all_privileges_dcp_schema_role`)
    });
      RETURN NEXT ${aQR(`hasFunction`)}("dcp_lib", ${
      lQR(`drop_role_and_user_if_exists`)
    });

      --call twice without errors
      CREATE SCHEMA IF NOT EXISTS assuranceTmp1;
      CREATE OR REPLACE VIEW assuranceTmp1.assuranceView AS SELECT '1' as result;

      CALL ${lQR(`create_role_if_not_exists`)}('assurance_role1');
      RETURN NEXT ${aQR(`hasRole`)}("assuranceTmp1", "assurance_role1");
      RETURN NEXT ok((${
      lQR(`create_database_user_with_role`)
    }('assurance_user1', 'password', 'assurance_role1') = 1),
      'user assurance_user1 should be created with role assurance_role1');
      RETURN NEXT ${aQR(`hasUser`)}("assuranceTmp1", "assurance_user1");

      --Check ALL Privileges--
      CALL ${
      lQR(`create_all_privileges_dcp_schema_role`)
    }('assurancetmp1','assurance_role1');
      RETURN NEXT schema_privs_are(
      'assurancetmp1', 'assurance_user1', ARRAY['USAGE'],
      'assurance_user1 should be granted USAGE on schema "assurancetmp1"');

      CALL ${
      lQR(`revoke_all_privileges_dcp_schema_role`)
    } ('assurancetmp1','assurance_role1');

      CALL ${
      lQR(`drop_role_and_user_if_exists`)
    }('assurance_role1','assurance_user1');
      RETURN NEXT ${aQR(`hasntRole`)}("assuranceTmp1", "assurance_role1");
      RETURN NEXT ${aQR(`hasntUser`)}("assuranceTmp1", "assurance_user1");
      DROP SCHEMA assuranceTmp1 cascade;
    `;

    const psqlText = ec.SQL()`
      ${ec.psqlHeader}

      ${schemas}

      ${extnPgjwt}

      ${extnPgcrypto}

      ${jwtTokenSignedBlock}

      ${createRoleIfNotExists}

      ${createAllPrivilegesDcpSchemaRole}

      ${createReadOnlyPrivilegesDcpSchemaRole}

      ${grantExecuteOnProcedure}

      ${grantExecuteOnFunction}

      ${createDatabaseUserWithRole}

      ${revokeAllPrivilegesViewsRole}

      ${revokeAllPrivilegesDcpSchemaRole}

      ${dropRoleAndUserIfExists}

      ${authenticateApiPgNative}

      ${testShield}



      `;

    const provenance: pgdcp.SqlFilePersistProvenance = {
      confidentiality: "non-sensitive",
      source: import.meta.url,
    };
    const persistableSQL:
      & pgdcp.SqlFilePersistProvenance
      & pc.PersistableContent<pgdcp.SqlFilePersistProvenance> = {
        ...provenance,
        basename: () => ec.psqlBasename(),
        // deno-lint-ignore require-await
        content: async () => {
          return {
            provenance,
            text: psqlText.SQL(ec.sqlEmitContext()),
          };
        },
      };

    return {
      psqlText,
      provenance,
      persistableSQL,
    };
  }

  static init() {
    return new PgDcpShield();
  }
}

if (import.meta.main) {
  const shield = PgDcpShield.init();
  const content = shield.content();
  console.log(content.psqlText.SQL(shield.state.ec.sqlEmitContext()));
}
