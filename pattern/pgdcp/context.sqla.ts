#!/usr/bin/env -S deno run --allow-all
import * as g from "./governance.ts";

// see https://maxgreenwald.me/blog/do-more-with-run
// const run = <T>(fn: () => T): T => fn();

export const executionContexts = [
  "production",
  "test",
  "devl",
  "sandbox",
  "experimental",
] as const;
export type ExecutionContext = typeof executionContexts[number];

export const context = () => {
  const ec = g.PgDcpEmitCoordinator.init(import.meta);
  const lc = g.PgDcpLifecycle.init(ec, ec.schemaDefns.dcp_context);
  const ae = g.PgDcpAssurance.init(ec, ec.schemaDefns.dcp_context);
  const [[sQN, sQR], [_, exQR]] = ec.schemaQNI("dcp_context", "dcp_extensions");
  const { pgDomains: pgd } = ec;
  const extns = ec.extensions("ltree");
  const schemas = ec.schemas(
    ...extns.extnSchemaNames,
    "dcp_lifecycle",
    "dcp_lifecycle_destroy",
    "dcp_context",
  );
  const [execCtx, execHostID] = ec.qualifiedTokens(
    "dcp_context",
    (value, son) => ({ sqlInjection: son.injectable(value) }),
    pgd.execution_context,
    pgd.execution_host_identity,
  );

  // deno-fmt-ignore
  const constructStorage = lc.constructStorage()`
    ${pgd.execution_host_identity}

    -- a single-row table which contains the global context (prod/test/devl/sandbox/etc.)
    -- TODO: convert this to a SQLa tableDefinition instance (kept same as PgDCP during migration)
    CREATE TABLE IF NOT EXISTS ${sQN.tableName('context')} (
      singleton_id bool PRIMARY KEY DEFAULT TRUE,
      active ${execCtx} NOT NULL,
      host ${execHostID} NOT NULL,
      CONSTRAINT context_unq CHECK (singleton_id)
    );

    -- TODO: add trigger to ensure that no improper values can be added into context`;

  // deno-fmt-ignore
  const ecConstantFn = (ec: ExecutionContext) => ({ SQL: () => `CREATE OR REPLACE FUNCTION ${sQR(`exec_context_${ec}`)}() RETURNS ${sQR("execution_context")} LANGUAGE sql IMMUTABLE PARALLEL SAFE AS 'SELECT ''${ec}''::${sQR("execution_context")}'` });

  // deno-fmt-ignore
  const isCompareExecCtxFn = (ec: ExecutionContext) => ({ SQL: () => `CREATE OR REPLACE FUNCTION ${sQR(`is_exec_context_${ec}`)}(ec ${sQR("execution_context")}) RETURNS boolean LANGUAGE sql IMMUTABLE PARALLEL SAFE AS 'SELECT CASE WHEN $1 OPERATOR(${exQR("=")}) ${sQR(`exec_context_${ec}`)}() THEN true else false end'` });

  // deno-fmt-ignore
  const isActiveExecCtxFn = (ec: ExecutionContext) => ({ SQL: () => `CREATE OR REPLACE FUNCTION ${sQR(`is_active_context_${ec}`)}() RETURNS boolean LANGUAGE sql IMMUTABLE PARALLEL SAFE AS 'SELECT CASE WHEN active OPERATOR(${exQR("=")}) ${sQR(`exec_context_${ec}`)}() THEN true else false end from ${sQR("context")} where singleton_id = true'` });

  const dropExecCtxFns = (
    ec: ExecutionContext,
  ) => [{
    SQL: () => `DROP FUNCTION IF EXISTS ${sQR(`exec_context_${ec}`)}()`,
  }, {
    SQL: () => `DROP FUNCTION IF EXISTS ${sQR(`is_exec_context_${ec}`)}()`,
  }, {
    SQL: () => `DROP FUNCTION IF EXISTS ${sQR(`is_active_context_${ec}`)}()`,
  }];

  // deno-fmt-ignore
  const constructIdempotent = lc.constructIdempotent()`
    ${executionContexts.map(ec => ecConstantFn(ec))}

    ${executionContexts.map(ec => isCompareExecCtxFn(ec))}

    ${executionContexts.map(ec => isActiveExecCtxFn(ec))}`;

  // deno-fmt-ignore
  const destroyIdempotent = lc.destroyIdempotent()`
    -- TODO: DROP FUNCTION IF EXISTS {lcf.unitTest(state).qName}();
    ${executionContexts.map(ec => dropExecCtxFns(ec)).flat()}`;

  // TODO: convert unitTest() to a stored function not a stored procedure, returns what PgTAP expects.
  // TODO: refer to has_function directly in PgTAP and don't require search_path
  // deno-fmt-ignore
  const unitTest = ae.unitTest()`
    ${executionContexts.map(ec => [
      ae.hasFunction("dcp_context", `exec_context_${ec}`),
      ae.hasFunction("dcp_context", `is_exec_context_${ec}`),
      ae.hasFunction("dcp_context", `is_active_context_${ec}`)]).flat()}`;

  return {
    ec,
    extns,
    schemas,
    lc,
    constructStorage,
    // TODO: is search_path required? switch to fully qualified schema object names
    // deno-fmt-ignore
    psqlText: ec.SQL()`
      ${ec.psqlHeader}

      ${schemas}

      ${extns.uniqueExtns}

      ${pgd.execution_context}

      ${constructStorage}

      ${constructIdempotent}

      ${destroyIdempotent}

      ${unitTest}`,
  };
};

export default context;

if (import.meta.main) {
  const tmpl = context();
  console.log(tmpl.psqlText.SQL(tmpl.ec.sqlEmitContext()));
}
