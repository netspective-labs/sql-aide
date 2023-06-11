import { pgSQLa, zod as z } from "./deps.ts";
import * as govn from "./governance.ts";

export const context = () => {
  const pgdf = pgSQLa.pgDomainsFactory();
  const emitter = govn.emitter(import.meta);
  const [ep, s, e] = [emitter.provenance(), govn.schemas(), govn.extensions()];
  const extns = e.pick(e.ltree);
  const schemas = s.pick(...extns.extnSchemas, s.lifecycle, s.context);
  const execCtxDomain = pgdf.pgDomainDefn(
    govn.sqlDomainReference(s.extensions, e.ltree.extension),
    "execution_context",
    {
      isIdempotent: true,
      nsOptions: { quoteIdentifiers: true, qnss: s.context },
    },
  );
  const execHostIdDomain = pgdf.pgDomainDefn(
    pgdf.stringSDF.string(z.string()),
    "execution_host_identity",
    {
      isIdempotent: true,
      nsOptions: { quoteIdentifiers: true, qnss: s.context },
    },
  );
  const lc = govn.lifecycle();
  const constructStorage = lc.constructStorage("context")`
    ${execHostIdDomain}
  `;
  return emitter.SQL`
    -- ${ep.identity} version ${ep.version}

    ${schemas}

    ${extns.uniqueExtns}

    ${execCtxDomain}

    ${constructStorage}
  `;
};
