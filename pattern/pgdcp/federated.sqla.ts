#!/usr/bin/env -S deno run --allow-all

import { persistContent as pc, SQLa } from "./deps.ts";
import * as pgdcp from "./pgdcp.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export class PgDcpFederated {
  readonly state = pgdcp.pgDcpState(import.meta, {
    subjectArea: "federated",
    principal: "dcp_confidential",
    schemas: ["dcp_lifecycle", "dcp_lifecycle_destroy"],
  });

  readonly subjectArea: string;
  readonly cSchema = this.state.ec.schemaDefns.dcp_context;
  readonly confSchema = this.state.ec.schemaDefns.dcp_confidential;
  readonly execCtxTables = this.state.ec.governedModel.textEnumTable(
    "execution_context",
    pgdcp.ExecutionContext,
    {
      sqlNS: this.cSchema,
    },
  );

  protected constructor() {
    this.subjectArea = this.state.ec.subjectArea(this.confSchema);
  }

  constructStorage() {
    const { ec, lc } = this.state;
    const { governedModel: { domains: d } } = ec;
    // const { execCtxTable } = new PgDcpContext();
    const fdwPostgresAuthn = SQLa.tableDefinition(
      "fdw_postgres_authn",
      {
        context: this.execCtxTables.references.code(),
        identity: d.text(),
        host: d.text(),
        port: d.text(),
        dbname: d.text(),
        remote_schema: d.textArray(),
        local_schema: d.textArray(),
        server_name: d.text(),
        fetch_size: d.integer(),
        username: d.text(),
        password_clear: d.text(),
        prepare_function_name: d.textNullable(),
        purpose: d.text(),
        ssl_cert: d.textNullable(),
        ssl_key: d.textNullable(),
        ssl_ca: d.textNullable(),
        ssl_capath: d.textNullable(),
      },
      { sqlNS: this.confSchema },
    );

    // deno-fmt-ignore
    return lc.constructStorage()`
      ${fdwPostgresAuthn}`;
  }
  content() {
    const { ae, ec, lc, schemas } = this.state;
    const [confQR] = ec.schemaQualifier("dcp_confidential");
    const [aQR] = ec.schemaQualifier("dcp_assurance");
    // deno-fmt-ignore
    const psqlText = ec.SQL()`
      ${ec.psqlHeader}

      ${schemas}

      ${this.constructStorage()}

      ${lc.destroyIdempotent()`
        DROP FUNCTION IF EXISTS ${aQR("test_federated")}();
        DROP TABLE IF EXISTS ${confQR("fdw_postgres_authn")};
        `}
      ${ae.unitTest()`
        ${ae.hasTable("dcp_confidential", `fdw_postgres_authn`)}`}

    `;

    const provenance: pgdcp.SqlFilePersistProvenance = {
      confidentiality: "contains-secrets",
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
    return new PgDcpFederated();
  }
}

if (import.meta.main) {
  const context = PgDcpFederated.init();
  const content = context.content();
  console.log(content.psqlText.SQL(context.state.ec.sqlEmitContext()));
}
