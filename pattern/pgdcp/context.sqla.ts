#!/usr/bin/env -S deno run --allow-all
import * as g from "./governance.ts";

// see https://maxgreenwald.me/blog/do-more-with-run
// const run = <T>(fn: () => T): T => fn();

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
  const constructIdempotent = lc.constructIdempotent()`
    CREATE OR REPLACE FUNCTION ${sQR("exec_context_production")}() RETURNS ${sQR("execution_context")} LANGUAGE sql IMMUTABLE PARALLEL SAFE AS 'SELECT ''production''::${sQR("execution_context")}';
    CREATE OR REPLACE FUNCTION ${sQR("exec_context_test")}() RETURNS ${sQR("execution_context")} LANGUAGE sql IMMUTABLE PARALLEL SAFE AS 'SELECT ''test''::${sQR("execution_context")}';
    CREATE OR REPLACE FUNCTION ${sQR("exec_context_devl")}() RETURNS ${sQR("execution_context")} LANGUAGE sql IMMUTABLE PARALLEL SAFE AS 'SELECT ''devl''::${sQR("execution_context")}';
    CREATE OR REPLACE FUNCTION ${sQR("exec_context_sandbox")}() RETURNS ${sQR("execution_context")} LANGUAGE sql IMMUTABLE PARALLEL SAFE AS 'SELECT ''sandbox''::${sQR("execution_context")}';
    CREATE OR REPLACE FUNCTION ${sQR("exec_context_experimental")}() RETURNS ${sQR("execution_context")} LANGUAGE sql IMMUTABLE PARALLEL SAFE AS 'SELECT ''experimental''::${sQR("execution_context")}';

    CREATE OR REPLACE FUNCTION ${sQR("is_exec_context_production")}(ec ${sQR("execution_context")}) RETURNS boolean LANGUAGE sql IMMUTABLE PARALLEL SAFE AS 'SELECT CASE WHEN $1 OPERATOR(${exQR("=")}) ${sQR("exec_context_production")}() THEN true else false end';
    CREATE OR REPLACE FUNCTION ${sQR("is_exec_context_test")}(ec ${sQR("execution_context")}) RETURNS boolean LANGUAGE sql IMMUTABLE PARALLEL SAFE AS 'SELECT CASE WHEN $1 OPERATOR(${exQR("=")}) ${sQR("exec_context_test")}() THEN true else false end';
    CREATE OR REPLACE FUNCTION ${sQR("is_exec_context_devl")}(ec ${sQR("execution_context")}) RETURNS boolean LANGUAGE sql IMMUTABLE PARALLEL SAFE AS 'SELECT CASE WHEN $1 OPERATOR(${exQR("=")}) ${sQR("exec_context_devl")}() THEN true else false end';
    CREATE OR REPLACE FUNCTION ${sQR("is_exec_context_sandbox")}(ec ${sQR("execution_context")}) RETURNS boolean LANGUAGE sql IMMUTABLE PARALLEL SAFE AS 'SELECT CASE WHEN $1 OPERATOR(${exQR("=")}) ${sQR("exec_context_sandbox")}() THEN true else false end';
    CREATE OR REPLACE FUNCTION ${sQR("is_exec_context_experimental")}(ec ${sQR("execution_context")}) RETURNS boolean LANGUAGE sql IMMUTABLE PARALLEL SAFE AS 'SELECT CASE WHEN $1 OPERATOR(${exQR("=")}) ${sQR("exec_context_experimental")}() THEN true else false end';

    CREATE OR REPLACE FUNCTION ${sQR("is_active_context_production")}() RETURNS boolean LANGUAGE sql IMMUTABLE PARALLEL SAFE AS 'SELECT CASE WHEN active OPERATOR(${exQR("=")}) ${sQR("exec_context_production")}() THEN true else false end from ${sQR("context")} where singleton_id = true';
    CREATE OR REPLACE FUNCTION ${sQR("is_active_context_test")}() RETURNS boolean LANGUAGE sql IMMUTABLE PARALLEL SAFE AS 'SELECT CASE WHEN active OPERATOR(${exQR("=")}) ${sQR("exec_context_test")}() THEN true else false end from ${sQR("context")} where singleton_id = true';
    CREATE OR REPLACE FUNCTION ${sQR("is_active_context_devl")}() RETURNS boolean LANGUAGE sql IMMUTABLE PARALLEL SAFE AS 'SELECT CASE WHEN active OPERATOR(${exQR("=")}) ${sQR("exec_context_devl")}() THEN true else false end from ${sQR("context")} where singleton_id = true';
    CREATE OR REPLACE FUNCTION ${sQR("is_active_context_sandbox")}() RETURNS boolean LANGUAGE sql IMMUTABLE PARALLEL SAFE AS 'SELECT CASE WHEN active OPERATOR(${exQR("=")}) ${sQR("exec_context_sandbox")}() THEN true else false end from ${sQR("context")} where singleton_id = true';
    CREATE OR REPLACE FUNCTION ${sQR("is_active_context_experimental")}() RETURNS boolean LANGUAGE sql IMMUTABLE PARALLEL SAFE AS 'SELECT CASE WHEN active OPERATOR(${exQR("=")}) ${sQR("exec_context_experimental")}() THEN true else false end from ${sQR("context")} where singleton_id = true';`;

  // deno-fmt-ignore
  const destroyIdempotent = lc.destroyIdempotent()`
    -- TODO: DROP FUNCTION IF EXISTS {lcf.unitTest(state).qName}();
    DROP FUNCTION IF EXISTS ${sQR("exec_context_production")}();
    DROP FUNCTION IF EXISTS ${sQR("exec_context_test")}();
    DROP FUNCTION IF EXISTS ${sQR("exec_context_devl")}();
    DROP FUNCTION IF EXISTS ${sQR("exec_context_sandbox")}();
    DROP FUNCTION IF EXISTS ${sQR("exec_context_experimental")}();
    DROP FUNCTION IF EXISTS ${sQR("is_exec_context_production")}();
    DROP FUNCTION IF EXISTS ${sQR("is_exec_context_test")}();
    DROP FUNCTION IF EXISTS ${sQR("is_exec_context_devl")}();
    DROP FUNCTION IF EXISTS ${sQR("is_exec_context_sandbox")}();
    DROP FUNCTION IF EXISTS ${sQR("is_exec_context_experimental")}();
    DROP FUNCTION IF EXISTS ${sQR("is_active_context_production")}();
    DROP FUNCTION IF EXISTS ${sQR("is_active_context_test")}();
    DROP FUNCTION IF EXISTS ${sQR("is_active_context_devl")}();
    DROP FUNCTION IF EXISTS ${sQR("is_active_context_sandbox")}();
    DROP FUNCTION IF EXISTS ${sQR("is_active_context_experimental")}();`;

  // TODO: convert unitTest() to a stored function not a stored procedure, returns what PgTAP expects.
  // TODO: refer to has_function directly in PgTAP and don't require search_path
  // deno-fmt-ignore
  const unitTest = ae.unitTest()`
    ${ae.hasFunction("dcp_context", 'exec_context_production')}
    ${ae.hasFunction("dcp_context", 'exec_context_test')}
    ${ae.hasFunction("dcp_context", 'exec_context_devl')}
    ${ae.hasFunction("dcp_context", 'exec_context_sandbox')}
    ${ae.hasFunction("dcp_context", 'exec_context_experimental')}
    ${ae.hasFunction("dcp_context", 'is_exec_context_production')}
    ${ae.hasFunction("dcp_context", 'is_exec_context_test')}
    ${ae.hasFunction("dcp_context", 'is_exec_context_devl')}
    ${ae.hasFunction("dcp_context", 'is_exec_context_sandbox')}
    ${ae.hasFunction("dcp_context", 'is_exec_context_experimental')}
    ${ae.hasFunction("dcp_context", 'is_active_context_production')}
    ${ae.hasFunction("dcp_context", 'is_active_context_test')}
    ${ae.hasFunction("dcp_context", 'is_active_context_devl')}
    ${ae.hasFunction("dcp_context", 'is_active_context_sandbox')}
    ${ae.hasFunction("dcp_context", 'is_active_context_experimental')}`;

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
