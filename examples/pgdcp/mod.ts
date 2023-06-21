#!/usr/bin/env -S deno run --allow-all

export * as pgdcp from "../../pattern/pgdcp/mod.ts";
export * from "./party.sqla.ts";

// this file doubles as a CLI to emit all files or as a module index if using
// it in Deno. everything below this is only used when being called as a main
// module and everything above is a regular Deno mod.ts which export all symbols

import * as pgdcp from "../../pattern/pgdcp/mod.ts";
import * as party from "./party.sqla.ts";

if (import.meta.main) {
  const p = party.Party.init();

  // there are two types of examples "sources":
  // 1. Deno (meaning sourcable from anywhere, including URLs) - e.g. party
  // 2. local files, relative to importMeta

  const persister = pgdcp.pgDcpPersister({
    importMeta: import.meta,
    sources: [{
      source: "../../pattern/pgdcp/context.sqla.ts",
      confidentiality: "non-sensitive",
    }, {
      source: "../../pattern/pgdcp/engine.sqla.ts",
      confidentiality: "non-sensitive",
    }, p.content().persistableSQL],
  });
  await persister.emitAll();
}
