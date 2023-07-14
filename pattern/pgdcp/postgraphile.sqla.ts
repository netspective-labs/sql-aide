#!/usr/bin/env -S deno run --allow-all

import { persistContent as pc, pgSQLa, SQLa, zod as z } from "./deps.ts";
import * as pgdcp from "./pgdcp.ts";

export class PgDcpPostgrpahile {
  protected constructor() {}

  readonly state = pgdcp.pgDcpState(import.meta, {
    subjectArea: "postgraphile",
    schemas: ["dcp_extensions", "dcp_lib"],
  });
  readonly ctx = SQLa.typicalSqlEmitContext({
    sqlDialect: SQLa.postgreSqlDialect(),
  });

  content() {
    const { ec, schemas } = this.state;
    const pgcrypto = ec.extnDefns.pgcrypto;
    const [aQR] = ec.schemaQualifier("dcp_assurance");
    const [lQR] = ec.schemaQualifier("dcp_lib");
    const dcpLibSchema = SQLa.sqlSchemaDefn("dcp_lib", {
      isIdempotent: true,
    });
    const jwtTokenPostgraphile = SQLa.sqlTypeDefinition(
      "jwt_token_postgraphile",
      {
        role: z.string(),
        exp: z.number(),
        user_id: z.number(),
        username: z.string(),
      },
      {
        sqlNS: dcpLibSchema,
        embeddedStsOptions: SQLa.typicalSqlTextSupplierOptions(),
      },
    );
    const jwtTokenPostgraphileBlock = pgSQLa.anonymousPlPgSqlRoutine(this.ctx)`
        ${jwtTokenPostgraphile}
      EXCEPTION
        WHEN DUPLICATE_OBJECT THEN
          RAISE NOTICE 'type "jwt_token_postgraphile" already exists, skipping';`;

    const authenticatePostgraphilePgNative = pgSQLa.storedFunction(
      "authenticate_postgraphile_pg_native",
      {
        username: z.string(),
        password: z.string(),
      },
      "jwt_token_postgraphile",
      (name, args) => pgSQLa.typedPlPgSqlBody(name, args, this.ctx),
      {
        embeddedStsOptions: SQLa.typicalSqlTextSupplierOptions(),
        autoBeginEnd: false,
        isIdempotent: true,
        sqlNS: schemas[0],
        headerBodySeparator: "$authenticate_postgraphile_pg_native$",
        privilegesSQL: { SQL: () => `STRICT SECURITY DEFINER` },
      },
    )`
    DECLARE
    account pg_catalog.pg_authid;
    username_password text;
    user_role text;
    BEGIN
        select a.* into account
          from pg_catalog.pg_authid as a
        where a.rolname = username;
        user_role:= (select rolname from pg_user
        join pg_auth_members on (pg_user.usesysid=pg_auth_members.member)
        join pg_roles on (pg_roles.oid=pg_auth_members.roleid)
        where pg_user.usename=username);
        username_password := (select concat(password,username));

        IF account.rolname IS NOT NULL and account.rolpassword = concat('md5',md5(username_password)) THEN
        RETURN (
          user_role,
          extract(epoch from now() + interval '7 days'),
          account.oid,
          account.rolname
        )::dcp_lib.jwt_token_postgraphile;
        ELSE
        RETURN NULL;
        END IF;
    END;
    `;

    const testPostgraphile = pgSQLa.storedFunction(
      "test_postgraphile",
      {},
      "SETOF TEXT",
      (name, args) => pgSQLa.typedPlPgSqlBody(name, args, this.ctx),
      {
        embeddedStsOptions: SQLa.typicalSqlTextSupplierOptions(),
        autoBeginEnd: false,
        isIdempotent: true,
        sqlNS: schemas[0],
        headerBodySeparator: "$test_postgraphile$",
      },
    )`
    RETURN NEXT ${aQR(`hasFunction`)}("dcp_lib", ${
      lQR(`authenticate_postgraphile_pg_native`)
    });
      RETURN NEXT ${aQR(`hasType`)}("dcp_lib", ${
      lQR(`jwt_token_postgraphile`)
    });
      RETURN NEXT ${aQR(`hasExtension`)}("dcp_lib", ${
      lQR(`authenticate_postgraphile_pg_native`)
    });
    `;

    const psqlText = ec.SQL()`
      ${ec.psqlHeader}

      ${schemas}

      ${pgcrypto}

      ${jwtTokenPostgraphileBlock}

      ${authenticatePostgraphilePgNative}

      ${testPostgraphile}

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
    return new PgDcpPostgrpahile();
  }
}

if (import.meta.main) {
  const postgraphile = PgDcpPostgrpahile.init();
  const content = postgraphile.content();
  console.log(content.psqlText.SQL(postgraphile.state.ec.sqlEmitContext()));
}
