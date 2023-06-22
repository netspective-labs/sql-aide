#!/usr/bin/env -S deno run --allow-all

import * as pgdcp from "../../pattern/pgdcp/mod.ts";
import * as udm from "../../pattern/udm/mod.ts";

export class Party {
  protected constructor() {}

  readonly state = pgdcp.pgDcpState(import.meta, {
    subjectArea: "party",
    schemas: ["dcp_lifecycle", "dcp_lifecycle_destroy"],
  });

  constructStorage() {
    return this.state.lc.constructStorage()`
      ${udm.allContentTables}
    `;
  }

  content() {
    const { ec, schemas } = this.state;
    const psqlText = ec.SQL()`
      ${ec.psqlHeader}

      ${schemas}

      ${this.constructStorage()}`;

    const provenance: pgdcp.SqlFilePersistProvenance = {
      confidentiality: "non-sensitive",
      source: import.meta.url,
    };
    const persistableSQL:
      & pgdcp.SqlFilePersistProvenance
      & pgdcp.persistContent.PersistableContent<
        pgdcp.SqlFilePersistProvenance
      > = {
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
    return new Party();
  }
}

if (import.meta.main) {
  const party = Party.init();
  const content = party.content();
  console.log(content.psqlText.SQL(party.state.ec.sqlEmitContext()));
}
