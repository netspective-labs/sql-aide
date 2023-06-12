#!/usr/bin/env -S deno run --allow-all

export * from "../../deps.ts";
export * as safety from "../../lib/universal/safety.ts";
export * as SQLa from "../../render/mod.ts";
export * as pgSQLa from "../../render/dialect/pg/mod.ts";

export * from "./governance.ts";
export * from "./context.sqla.ts";

// this file doubles as a CLI to emit all files or as a module index if using
// it in Deno. everything below this is only used when being called as a main
// module

import { path } from "../../deps.ts";
import { pgDcpPersist, pgDcpPersistCmdOutput } from "./governance.ts";

if (import.meta.main) {
  const persist = pgDcpPersist({
    destPath: (file) =>
      path.relative(
        Deno.cwd(),
        path.join(path.dirname(path.fromFileUrl(import.meta.url)), file),
      ),
    content: async function* () {
      yield pgDcpPersistCmdOutput({
        provenance: () => ({
          identity: "context",
          source: path.fromFileUrl(import.meta.resolve("./context.sqla.ts")),
          version: "v0.0.0",
        }),
        // deno-lint-ignore require-await
        psqlBasename: async () => "context.auto.sql",
      });
    },
  });
  await persist.emitAll();
}
