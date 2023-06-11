import * as g from "./governance.ts";

export const context = <Context extends g.PgDcpEmitContext>(
  args?: { tmplEngine: ReturnType<typeof g.PgDcpEmitter.init> },
) => {
  const te = args?.tmplEngine ?? g.PgDcpEmitter.init(import.meta);
  const { pgDomains: pgd } = te;
  const extns = te.extensions("ltree");
  const schemas = te.schemas(...extns.extnSchemaNames, "lifecycle", "context");
  const lc = te.lifecycle();
  const constructStorage = lc.constructStorage("context")`
    ${pgd.execution_host_identity}
  `;
  return te.SQL()`
    -- ${te.provenance.identity} version ${te.provenance.version}

    ${schemas}

    ${extns.uniqueExtns}

    ${pgd.execution_context}

    ${constructStorage}
  `;
};
