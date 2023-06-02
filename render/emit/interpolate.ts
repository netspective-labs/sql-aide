import { path } from "../deps.ts";
import * as tmpl from "./sql.ts";
import * as ppSql from "../../lib/pre-process/psql/mod.ts";

export function preprocessText<
  Context extends tmpl.SqlEmitContext,
>(
  source: string | string[],
  options?: {
    readonly setDirective?: ppSql.SetVarValueDirective;
    readonly includeDirective?: ppSql.IncludeDirective;
    readonly inspect?: boolean;
  },
): tmpl.SqlTextSupplier<Context> {
  return {
    SQL: () => {
      const pp = ppSql.psqlPreprocess(source, options);
      if (options?.inspect) return Deno.inspect(pp.inspect);
      return pp.interpolatedText;
    },
  };
}

export function preprocess<
  Context extends tmpl.SqlEmitContext,
>(
  source: string | URL,
  options?: {
    readonly setDirective?: ppSql.SetVarValueDirective;
    readonly includeDirective?: ppSql.IncludeDirective;
    readonly inspect?: boolean;
  },
): tmpl.SqlTextSupplier<Context> {
  if (typeof source === "string" && source.startsWith("file:")) {
    source = path.fromFileUrl(source);
  }
  return preprocessText(Deno.readTextFileSync(source), options);
}
