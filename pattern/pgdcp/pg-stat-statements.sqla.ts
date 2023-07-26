#!/usr/bin/env -S deno run --allow-all

import { govnPattern, persistContent as pc, SQLa } from "./deps.ts";
import * as pgdcp from "./pgdcp.ts";

export class PgDcpPgStatStatements {
  protected constructor() {}

  readonly state = pgdcp.pgDcpState(import.meta, {
    subjectArea: "PgStatStatements",
    schemas: ["dcp_lib", "dcp_extensions", "dcp_assurance"],
  });

  readonly ctx = SQLa.typicalSqlEmitContext({
    sqlDialect: SQLa.postgreSqlDialect(),
  });
  readonly governedDomains = new govnPattern.GovernedDomains<
    SQLa.SqlDomainQS,
    SQLa.SqlDomainsQS<SQLa.SqlDomainQS>,
    SQLa.SqlEmitContext
  >();

  content() {
    const { ec, schemas } = this.state;
    const extnPgStatStatements = ec.extnDefns.pg_stat_statements;

    const psqlText = ec.SQL()`
      ${ec.psqlHeader}

      ${schemas}

      ${extnPgStatStatements}

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
    return new PgDcpPgStatStatements();
  }
}

if (import.meta.main) {
  const shield = PgDcpPgStatStatements.init();
  const content = shield.content();
  console.log(content.psqlText.SQL(shield.state.ec.sqlEmitContext()));
}
