#!/usr/bin/env -S deno run --allow-all

import { persistContent as pc, pgSQLa, SQLa, zod as z } from "./deps.ts";
import * as pgdcp from "./pgdcp.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export class PgDcpInfrastructure {
  readonly state = pgdcp.pgDcpState(import.meta, {
    principal: "dcp_lifecycle",
    schemas: ["dcp_lifecycle", "dcp_lifecycle_destroy", "dcp_assurance"],
  });

  readonly subjectArea: string;
  readonly cSchema = this.state.ec.schemaDefns.dcp_context;
  readonly ctx = SQLa.typicalSqlEmitContext({
    sqlDialect: SQLa.postgreSqlDialect(),
  });

  protected constructor() {
    this.subjectArea = this.state.ec.subjectArea(this.cSchema);
  }

  constructStorage() {
    const { lc, ec: { pgDomains: pgd } } = this.state;

    // deno-fmt-ignore
    return lc.constructStorage()`
      ${pgd.execution_host_identity}

`;
  }

  content() {
    const { ae, ec, schemas } = this.state;
    const dcpLcSchema = SQLa.sqlSchemaDefn("dcp_lifecycle", {
      isIdempotent: true,
    });
    const dcpLcdSchema = SQLa.sqlSchemaDefn("dcp_lifecycle_destroy", {
      isIdempotent: true,
    });
    const dcpExtSchema = SQLa.sqlSchemaDefn("dcp_extensions", {
      isIdempotent: true,
    });
    const dcpAssuranceSchema = SQLa.sqlSchemaDefn("dcp_assurance", {
      isIdempotent: true,
    });
    const dcpConfSchema = SQLa.sqlSchemaDefn("dcp_confidential", {
      isIdempotent: true,
    });
    const dcpLibSchema = SQLa.sqlSchemaDefn("dcp_lib", {
      isIdempotent: true,
    });
    const dcpContextSchema = SQLa.sqlSchemaDefn("dcp_context", {
      isIdempotent: true,
    });
    const extnPgTap = ec.extnDefns.pgtap.SQL(ec.sqlEmitContext());
    const ltree = ec.extnDefns.ltree.SQL(ec.sqlEmitContext());
    const pgStatStatements = ec.extnDefns.pg_stat_statements.SQL(
      ec.sqlEmitContext(),
    );
    const { sqlNamespace: extnsSchemaName } = ec.schemaDefns.dcp_extensions;
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
    const infrastructureInit = pgSQLa.storedProcedure(
      "infrastructure_init",
      {},
      (name, args, _) => pgSQLa.typedPlPgSqlBody(name, args, this.ctx),
      {
        embeddedStsOptions: SQLa.typicalSqlTextSupplierOptions(),
        autoBeginEnd: false,
        isIdempotent: true,
        sqlNS: dcpLcSchema,
        headerBodySeparator: "$infrastructureInit$",
      },
    )`
      ${dcpExtSchema}
      ${dcpLcdSchema}
      ${dcpAssuranceSchema}
      ${dcpConfSchema}
      ${dcpLibSchema}
      ${dcpContextSchema}
      ${extnPgTap};
      ${ltree};
      ${pgStatStatements};
      -- make sure everybody can use everything in the extensions schema
      grant usage on schema ${extnsSchemaName} to public;
      grant execute on all functions in schema ${extnsSchemaName} to public;

      -- include future extensions
      alter default privileges in schema ${extnsSchemaName}
        grant execute on functions to public;

      alter default privileges in schema ${extnsSchemaName}
      grant usage on types to public;

      ${jwtTokenSignedBlock}
      ${jwtTokenPostgraphileBlock}
    `;

    // deno-fmt-ignore
    const psqlText = ec.SQL()`
      ${ec.psqlHeader}

      ${schemas}

      ${infrastructureInit}


      ${ae.unitTest()``}`;

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
    return new PgDcpInfrastructure();
  }
}

if (import.meta.main) {
  const context = PgDcpInfrastructure.init();
  const content = context.content();
  console.log(content.psqlText.SQL(context.state.ec.sqlEmitContext()));
}
