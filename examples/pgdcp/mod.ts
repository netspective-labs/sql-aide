#!/usr/bin/env -S deno run --allow-all

export * as pgdcp from "../../pattern/pgdcp/mod.ts";
export * from "./party.sqla.ts";

// this file doubles as a CLI to emit all files or as a module index if using
// it in Deno. everything below this is only used when being called as a main
// module and everything above is a regular Deno mod.ts which export all symbols

import * as pgdcp from "../../pattern/pgdcp/mod.ts";
import * as party from "./party.sqla.ts";

export const persistables = (): Parameters<typeof pgdcp.pgDcpPersister>[0] => {
  // there are three types of examples "sources":
  // 1. Deno (meaning sourcable from anywhere, including URLs) - e.g. party, context, etc.
  // 2. local executables, relative to importMeta (e.g. executable.sh)
  // 2. local text files, relative to importMeta (e.g. inspect.psql)

  const p = party.Party.init();
  const c = pgdcp.PgDcpContext.init();
  const e = pgdcp.PgDcpEngine.init();
  return {
    importMeta: import.meta,
    sources: [
      c.content().persistableSQL,
      e.content().persistableSQL,
      {
        source: "../../lib/sql/pg/inspect.psql",
        confidentiality: "non-sensitive",
      },
      p.content().persistableSQL,
      {
        source: "./executable.sh",
        confidentiality: "non-sensitive",
      },
    ],
  };
};

if (import.meta.main) {
  const persister = pgdcp.pgDcpPersisterVerbose(persistables());
  await persister.emitAll();
}
