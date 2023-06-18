#!/usr/bin/env -S deno run --allow-all
import * as g from "./governance.ts";

// see https://maxgreenwald.me/blog/do-more-with-run
// const run = <T>(fn: () => T): T => fn();

export const engine = () => {
  // "engine" is just a "subject area" not a schema
  const state = g.pgDcpState(import.meta, { subjectArea: "engine" });
  const { ec, lc, ae } = state;
  const { sqlNamespace: extnsSchemaName } = ec.schemaDefns.dcp_extensions;
  const [_lcQR] = ec.schemaQualifier("dcp_lifecycle");

  // deno-fmt-ignore
  const constructIdempotent = lc.constructIdempotent()`
  `;

  // deno-fmt-ignore
  const destroyIdempotent = lc.destroyIdempotent()`
  `;

  // deno-fmt-ignore
  const unitTest = ae.unitTest()``;

  return {
    ...state,
    constructIdempotent,
    // TODO: is search_path required? switch to fully qualified schema object names
    // deno-fmt-ignore
    psqlText: ec.SQL()`
      ${ec.psqlHeader}

      -- make sure everybody can use everything in the extensions schema
      grant usage on schema ${extnsSchemaName} to public;
      grant execute on all functions in schema ${extnsSchemaName} to public;

      -- include future extensions
      alter default privileges in schema ${extnsSchemaName}
        grant execute on functions to public;

      alter default privileges in schema ${extnsSchemaName}
      grant usage on types to public;

      ${constructIdempotent}

      ${constructIdempotent}

      ${destroyIdempotent}

      ${unitTest}`,
  };
};

export default engine;

if (import.meta.main) {
  const tmpl = engine();
  console.log(tmpl.psqlText.SQL(tmpl.ec.sqlEmitContext()));
}
