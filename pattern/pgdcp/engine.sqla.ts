#!/usr/bin/env -S deno run --allow-all

import { persistContent as pc, pgSQLa, SQLa, zod as z } from "./deps.ts";
import * as pgdcp from "./pgdcp.ts";

export class PgDcpEngine {
  protected constructor() {}

  readonly state = pgdcp.pgDcpState(import.meta, {
    subjectArea: "engine",
    schemas: ["dcp_extensions", "dcp_lifecycle"],
  });

  readonly ctx = SQLa.typicalSqlEmitContext({
    sqlDialect: SQLa.postgreSqlDialect(),
  });

  constructIdempotent() {
    const { lc, ec } = this.state;
    const [lcQR] = ec.schemaQualifier("dcp_lifecycle");

    // deno-fmt-ignore
    return lc.constructIdempotent()`
    CALL ${lcQR(`version_construct`)}('dcp_lifecycle', 'asset_version', 'asset', NULL, '1.0.0'::semver);
    insert into asset_version (nature, asset, version) values ('storage', '${lcQR(`asset_version_store`)}', ${lcQR(`asset_version_initial_revision`)}());
    insert into asset_version (nature, asset, version) values ('storage', '${lcQR(`asset_version_label_store`)}', ${lcQR(`asset_version_initial_revision`)}());
    insert into asset_version (nature, asset, version) values ('storage', '${lcQR(`asset_version_history`)}', ${lcQR(`asset_version_initial_revision`)}());

    CALL ${lcQR(`event_manager_construct`)}('dcp_lifecycle', 'activity', 'event', 'lifecycle');`;
  }

  destroyIdempotent() {
    const { lc } = this.state;

    // deno-fmt-ignore
    return lc.destroyIdempotent()`
    -- TODO: if user = 'dcp_destroyer' ... else raise exception invalid user trying to destroyIdempotent
      DROP SCHEMA IF EXISTS dcp_experimental CASCADE;
      DROP SCHEMA IF EXISTS dcp_assurance_engineering CASCADE;
      DROP SCHEMA IF EXISTS dcp_lib CASCADE;`;
  }

  content() {
    const { ec, schemas } = this.state;
    const { sqlNamespace: extnsSchemaName } = ec.schemaDefns.dcp_extensions;
    const ltree = ec.extnDefns.ltree;
    const semver = ec.extnDefns.semver;
    const pgtap = ec.extnDefns.pgtap;
    const pg_stat_statements = ec.extnDefns.pg_stat_statements;

    const dropAllFunctionsWithName = pgSQLa.storedFunction(
      "drop_all_functions_with_name",
      {
        function_name: z.string(),
      },
      "TEXT",
      (name, args) => pgSQLa.typedPlPgSqlBody(name, args, this.ctx),
      {
        embeddedStsOptions: SQLa.typicalSqlTextSupplierOptions(),
        autoBeginEnd: false,
        isIdempotent: true,
        sqlNS: schemas[1],
        headerBodySeparator: "$drop_all_functions_with_name$",
        privilegesSQL: { SQL: () => `VOLATILE COST 100` },
      },
    )`
    DECLARE
    funcrow RECORD;
    numfunctions smallint := 0;
    numparameters int;
    i int;
    paramtext text;
    BEGIN
        FOR funcrow IN SELECT proargtypes FROM pg_proc WHERE proname = function_name LOOP
            --for some reason array_upper is off by one for the oidvector type, hence the +1
            numparameters = array_upper(funcrow.proargtypes, 1) + 1;
            i = 0;
            paramtext = '';
            LOOP
                IF i < numparameters THEN
                    IF i > 0 THEN
                        paramtext = paramtext || ', ';
                    END IF;
                    paramtext = paramtext || (SELECT typname FROM pg_type WHERE oid = funcrow.proargtypes[i]);
                    i = i + 1;
                ELSE
                    EXIT;
                END IF;
            END LOOP;
            EXECUTE 'DROP FUNCTION ' || function_name || '(' || paramtext || ');';
            numfunctions = numfunctions + 1;
        END LOOP;
    RETURN 'Dropped ' || numfunctions || ' functionNames';
    END;
    `;

    const testEngineVersion = pgSQLa.storedFunction(
      "test_engine_version",
      {},
      "SETOF TEXT",
      (name, args) => pgSQLa.typedPlPgSqlBody(name, args, this.ctx),
      {
        embeddedStsOptions: SQLa.typicalSqlTextSupplierOptions(),
        autoBeginEnd: false,
        isIdempotent: true,
        sqlNS: schemas[1],
        headerBodySeparator: "$test_engine_version$",
        privilegesSQL: { SQL: () => `VOLATILE COST 100` },
      },
    )`
      RETURN NEXT ok(pg_version_num() > 13000,
      format('PostgreSQL engine instance versions should be at least 13000 [%s]', pg_version()));
    `;

    const psqlText = ec.SQL()`
      ${ec.psqlHeader}
      ${schemas}
      ${pg_stat_statements}
      ${pgtap}
      ${ltree}
      ${semver}
      -- make sure everybody can use everything in the extensions schema
      grant usage on schema ${extnsSchemaName} to public;
      grant execute on all functions in schema ${extnsSchemaName} to public;

      -- include future extensions
      alter default privileges in schema ${extnsSchemaName}
        grant execute on functions to public;

      alter default privileges in schema ${extnsSchemaName}
      grant usage on types to public;

      ${this.constructIdempotent()}

      ${this.destroyIdempotent()}

      ${dropAllFunctionsWithName}

      ${testEngineVersion}
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
    return new PgDcpEngine();
  }
}

if (import.meta.main) {
  const engine = PgDcpEngine.init();
  const content = engine.content();
  console.log(content.psqlText.SQL(engine.state.ec.sqlEmitContext()));
}
