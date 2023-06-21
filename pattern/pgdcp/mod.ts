#!/usr/bin/env -S deno run --allow-all

export * from "../../deps.ts";
export * as safety from "../../lib/universal/safety.ts";
export * as SQLa from "../../render/mod.ts";
export * as pgSQLa from "../../render/dialect/pg/mod.ts";
export * as persistContent from "../../lib/universal/persist-content.ts";

export * as govnPattern from "../governed/mod.ts";
export * as pgGovnPattern from "./pg-governed.ts";

export * from "./pgdcp.ts";
export * from "./context.sqla.ts";

// this file doubles as a CLI to emit all files or as a module index if using
// it in Deno. everything below this is only used when being called as a main
// module

import * as g from "./pgdcp.ts";
import * as c from "./context.sqla.ts";

if (import.meta.main) {
  const context = c.PgDcpContext.init();

  const persister = g.pgDcpPersister({
    importMeta: import.meta,
    sources: [context.content().persistableSQL, {
      source: "./engine.sqla.ts",
      confidentiality: "non-sensitive",
    }],
  });
  await persister.emitAll();
}
