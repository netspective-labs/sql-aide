import * as safety from "../lib/universal/safety.ts";

// TODO:
// * for greenfield and properly designed RDBMS-first schemas, use SQL-native
//   policies to enforce row-level security in the database and column-level
//   security through stored procedures when possible.
// * for brownfield project or when RLS is not supported, check out
//   [Inspektor](https://github.com/poonai/inspektor) protocol-aware
//   proxy that is used to enforce access policies. If SQLa can render the
//   policy configurations then Inspektor can enforce them.
// * allow OPA policy template strings to generate [OPA](https://www.openpolicyagent.org/)
//   configurations

export type SqlPolicy = string;

export interface SqlPolicySupplier {
  readonly sqlPolicy: SqlPolicy;
}

export interface TemplateStringSqlPolicy extends SqlPolicySupplier {
  readonly templateLiterals: TemplateStringsArray;
  readonly templateExprs: unknown[];
}

export function templateStringSqlPolicy(
  sqlPolicy: string,
  templateLiterals: TemplateStringsArray,
  templateExprs: unknown[],
): TemplateStringSqlPolicy {
  return {
    sqlPolicy,
    templateLiterals,
    templateExprs,
  };
}

export const isSqlPolicySupplier = safety.typeGuard<SqlPolicySupplier>(
  "sqlPolicy",
);

export const isTemplateStringSqlPolicy = safety.typeGuard<
  TemplateStringSqlPolicy
>("sqlPolicy", "templateLiterals", "templateExprs");
