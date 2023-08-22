#!/usr/bin/env -S deno run --allow-all

export * from "../../deps.ts";
export * as safety from "../../lib/universal/safety.ts";
export * as SQLa from "../../render/mod.ts";
export * as pgSQLa from "../../render/dialect/pg/mod.ts";
export * as persistContent from "../../lib/universal/persist-content.ts";

export * as govnPattern from "../governed/mod.ts";
export * as pgGovnPattern from "./pg-governed.ts";

export * from "./pgdcp.ts";
export * from "./infrastructure.sqla.ts";
export * from "./context.sqla.ts";
export * from "./engine.sqla.ts";
export * from "./federated.sqla.ts";
export * from "./shield.sqla.ts";
export * from "./event.sqla.ts";
export * from "./postgraphile.sqla.ts";
export * from "./graphql.sqla.ts";
export * from "./version.sqla.ts";

// this file doubles as a CLI to emit all files or as a module index if using
// it in Deno. everything below this is only used when being called as a main
// module

import * as g from "./pgdcp.ts";
import * as i from "./infrastructure.sqla.ts";
import * as c from "./context.sqla.ts";
import * as e from "./engine.sqla.ts";
import * as fed from "./federated.sqla.ts";
import * as s from "./shield.sqla.ts";
import * as ev from "./event.sqla.ts";
import * as pg from "./postgraphile.sqla.ts";
import * as gr from "./graphql.sqla.ts";
import * as ver from "./version.sqla.ts";

export const persistables = (): Parameters<typeof g.pgDcpPersister>[0] => {
  const infrastructure = i.PgDcpInfrastructure.init();
  const context = c.PgDcpContext.init();
  const engine = e.PgDcpEngine.init();
  const federated = fed.PgDcpFederated.init();
  const shield = s.PgDcpShield.init();
  const event = ev.PgDcpEvent.init();
  const postgraphile = pg.PgDcpPostgraphile.init();
  const graphql = gr.PgDcpGraphql.init();
  const version = ver.PgDcpVersion.init();
  return {
    importMeta: import.meta,
    sources: [
      infrastructure.content().persistableSQL,
      context.content().persistableSQL,
      engine.content().persistableSQL,
      federated.content().persistableSQL,
      shield.content().persistableSQL,
      event.content().persistableSQL,
      postgraphile.content().persistableSQL,
      graphql.content().persistableSQL,
      version.content().persistableSQL,
    ],
  };
};

if (import.meta.main) {
  const persister = g.pgDcpPersisterVerbose(persistables());
  await persister.emitAll();
}
