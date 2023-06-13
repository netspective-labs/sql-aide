#!/usr/bin/env -S deno run --allow-all
import * as g from "./governance.ts";

export const context = () => {
  const ec = g.PgDcpEmitCoordinator.init(import.meta);
  const lc = g.PgDcpLifecycle.init(ec, ec.schemaDefns.dcp_context);
  const dcpcQN = ec.schemaQN("dcp_context");
  const { pgDomains: pgd } = ec;
  const extns = ec.extensions("ltree");
  const schemas = ec.schemas(
    ...extns.extnSchemaNames,
    "dcp_lifecycle",
    "dcp_lifecycle_destroy",
    "dcp_context",
  );
  const [execCtx, execHostID] = ec.symbols(
    pgd.execution_context,
    pgd.execution_host_identity,
  );

  // deno-fmt-ignore
  const constructStorage = lc.constructStorage()`
    ${pgd.execution_host_identity}

    -- a single-row table which contains the global context (prod/test/devl/sandbox/etc.)
    CREATE TABLE IF NOT EXISTS ${dcpcQN.tableName('context')} (
      singleton_id bool PRIMARY KEY DEFAULT TRUE,
      active ${execCtx} NOT NULL,
      host ${execHostID} NOT NULL,
      CONSTRAINT context_unq CHECK (singleton_id)
    );`;

  return {
    ec,
    extns,
    schemas,
    lc,
    constructStorage,
    psqlText: ec.SQL()`
      ${ec.psqlHeader}

      ${schemas}

      ${extns.uniqueExtns}

      ${pgd.execution_context}

      ${constructStorage}`,
  };
};

export default context;

if (import.meta.main) {
  const tmpl = context();
  console.log(tmpl.psqlText.SQL(tmpl.ec.sqlEmitContext()));
}
