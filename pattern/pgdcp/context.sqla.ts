#!/usr/bin/env -S deno run --allow-all
import * as g from "./governance.ts";

// see https://maxgreenwald.me/blog/do-more-with-run
// const run = <T>(fn: () => T): T => fn();

export const context = () => {
  const state = g.pgDcpState(import.meta, {
    principal: "dcp_context",
    schemas: ["dcp_lifecycle", "dcp_lifecycle_destroy"],
  });
  const { ec, lc, ae, c, schemas, ec: { pgDomains: pgd } } = state;
  const [sQR] = ec.schemaQualifier("dcp_context");

  const cStorage = c.storage();
  // deno-fmt-ignore
  const constructStorage = lc.constructStorage()`
    ${pgd.execution_host_identity}

    ${cStorage.execCtx}

    -- TODO: the host column in context table should be \`execution_host_identity\` not TEXT
    -- TODO: see ticket #87 - REFERENCES "execution_context"("code") should be schema-qualified
    ${cStorage.context}

    -- TODO: add trigger to ensure that no improper values can be added into context`;

  // deno-fmt-ignore
  const ecConstantFn = (ec: g.ExecutionContext) => ({
    SQL: () => `CREATE OR REPLACE FUNCTION ${sQR(`exec_context_${ec}`)}() RETURNS ${sQR("execution_context")} LANGUAGE sql IMMUTABLE PARALLEL SAFE AS 'SELECT ''${ec}''::${sQR("execution_context")}'`
  });

  // deno-fmt-ignore
  const isCompareExecCtxFn = (ec: g.ExecutionContext) => ({
    SQL: () => `CREATE OR REPLACE FUNCTION ${sQR(`is_exec_context_${ec}`)}(ec ${sQR("execution_context")}) RETURNS boolean LANGUAGE sql IMMUTABLE PARALLEL SAFE AS 'SELECT CASE WHEN $1 = ${sQR(`exec_context_${ec}`)}() THEN true else false end'`
  });

  // deno-fmt-ignore
  const isActiveExecCtxFn = (ec: g.ExecutionContext) => ({
    SQL: () => `CREATE OR REPLACE FUNCTION ${sQR(`is_active_context_${ec}`)}() RETURNS boolean LANGUAGE sql IMMUTABLE PARALLEL SAFE AS 'SELECT CASE WHEN active = ${sQR(`exec_context_${ec}`)}() THEN true else false end from ${sQR("context")} where singleton_id = true'`
  });

  const dropExecCtxFns = (
    ec: g.ExecutionContext,
  ) => [{
    SQL: () => `DROP FUNCTION IF EXISTS ${sQR(`exec_context_${ec}`)}()`,
  }, {
    SQL: () => `DROP FUNCTION IF EXISTS ${sQR(`is_exec_context_${ec}`)}()`,
  }, {
    SQL: () => `DROP FUNCTION IF EXISTS ${sQR(`is_active_context_${ec}`)}()`,
  }];

  // deno-fmt-ignore
  const constructIdempotent = lc.constructIdempotent()`
    ${g.executionContexts.map(ec => ecConstantFn(ec))}

    ${g.executionContexts.map(ec => isCompareExecCtxFn(ec))}

    ${g.executionContexts.map(ec => isActiveExecCtxFn(ec))}`;

  // deno-fmt-ignore
  const destroyIdempotent = lc.destroyIdempotent()`
    -- TODO: DROP FUNCTION IF EXISTS {lcf.unitTest(state).qName}();
    ${g.executionContexts.map(ec => dropExecCtxFns(ec)).flat()}`;

  const populateSeedData = lc.populateSeedData()`
    ${cStorage.execCtx.seedDML}`;

  // deno-fmt-ignore
  const unitTest = ae.unitTest()`
    ${g.executionContexts.map(ec => [
      ae.hasFunction("dcp_context", `exec_context_${ec}`),
      ae.hasFunction("dcp_context", `is_exec_context_${ec}`),
      ae.hasFunction("dcp_context", `is_active_context_${ec}`)]).flat()}`;

  return {
    ...state,
    constructStorage,
    // TODO: is search_path required? switch to fully qualified schema object names
    // deno-fmt-ignore
    psqlText: ec.SQL()`
      ${ec.psqlHeader}

      ${schemas}

      ${constructStorage}

      ${constructIdempotent}

      ${destroyIdempotent}

      ${populateSeedData}

      ${unitTest}`,
  };
};

export default context;

if (import.meta.main) {
  const tmpl = context();
  console.log(tmpl.psqlText.SQL(tmpl.ec.sqlEmitContext()));
}
