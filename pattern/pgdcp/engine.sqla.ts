#!/usr/bin/env -S deno run --allow-all

import { persistContent as pc } from "./deps.ts";
import * as pgdcp from "./pgdcp.ts";

export class PgDcpEngine {
  protected constructor() {}

  readonly state = pgdcp.pgDcpState(import.meta, {
    subjectArea: "engine",
    schemas: ["dcp_extensions"],
  });

  content() {
    const { ec, schemas } = this.state;
    const { sqlNamespace: extnsSchemaName } = ec.schemaDefns.dcp_extensions;

    const psqlText = ec.SQL()`
      ${ec.psqlHeader}
      ${schemas}
      -- make sure everybody can use everything in the extensions schema
      grant usage on schema ${extnsSchemaName} to public;
      grant execute on all functions in schema ${extnsSchemaName} to public;

      -- include future extensions
      alter default privileges in schema ${extnsSchemaName}
        grant execute on functions to public;

      alter default privileges in schema ${extnsSchemaName}
      grant usage on types to public;`;

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
