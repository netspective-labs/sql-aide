#!/usr/bin/env -S deno run --allow-all
import * as g from "./governance.ts";

export const context = () => {
  const tmplEngine = g.PgDcpEmitter.init(import.meta);
  const { pgDomains: pgd } = tmplEngine;
  const extns = tmplEngine.extensions("ltree");
  const schemas = tmplEngine.schemas(
    ...extns.extnSchemaNames,
    "dcp_lifecycle",
    "dcp_context",
  );
  const lc = tmplEngine.lifecycle();
  const constructStorage = lc.constructStorage("context")`
    ${pgd.execution_host_identity}
  `;

  return {
    tmplEngine,
    extns,
    schemas,
    lc,
    constructStorage,
    content: tmplEngine.SQL()`
      ${tmplEngine.psqlHeader}

      ${schemas}

      ${extns.uniqueExtns}

      ${pgd.execution_context}

      ${constructStorage}`,
  };
};

export default context;

if (import.meta.main) {
  const tmpl = context();
  console.log(tmpl.content.SQL(tmpl.tmplEngine.sqlEmitContext()));
}
