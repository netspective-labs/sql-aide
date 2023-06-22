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
export * from "./engine.sqla.ts";

// this file doubles as a CLI to emit all files or as a module index if using
// it in Deno. everything below this is only used when being called as a main
// module

import * as g from "./pgdcp.ts";
import * as c from "./context.sqla.ts";
import * as e from "./engine.sqla.ts";

export const persistables = (): Parameters<typeof g.pgDcpPersister>[0] => {
  const context = c.PgDcpContext.init();
  const engine = e.PgDcpEngine.init();
  return {
    importMeta: import.meta,
    sources: [
      context.content().persistableSQL,
      engine.content().persistableSQL,
    ],
  };
};

if (import.meta.main) {
  const persister = g.pgDcpPersisterVerbose(persistables());
  await persister.emitAll();
}
