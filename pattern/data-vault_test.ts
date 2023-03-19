import { testingAsserts as ta } from "../deps-test.ts";
import * as SQLa from "../mod.ts";
import * as mod from "./data-vault.ts";
import { unindentWhitespace as _uws } from "../lib/universal/whitespace.ts";

// for convenience so that deno-lint is not required for use of `any`
// deno-lint-ignore no-explicit-any
type Any = any;

const _expectType = <T>(_value: T) => {
  // Do nothing, the TypeScript compiler handles this for us
};

Deno.test("Data Vault governance", () => {
  const stso = SQLa.typicalSqlTextSupplierOptions();
  const dvg = mod.dataVaultGovn(stso);
  ta.assert(dvg);
  ta.assert(dvg.domains);
  //   ta.assert(dvg.digestPrimaryKey);
  //   ta.assert(dvg.digestPkLintRule);
  //   ta.assert(dvg.autoIncPrimaryKey);
  ta.assert(dvg.housekeeping);
  //   ta.assert(dvg.tableName);
  //   ta.assert(dvg.table);
  //   ta.assert(dvg.hubTableName);
  //   ta.assert(dvg.hubTable);
  //   ta.assert(dvg.hubSatelliteTableName);
  //   ta.assert(dvg.hubSatelliteTable);
  //   ta.assert(dvg.linkTableName);
  //   ta.assert(dvg.linkTable);
  //   ta.assert(dvg.linkSatelliteTableName);
  //   ta.assert(dvg.linkSatelliteTable);
  ta.assert(dvg.tableLintRules);
});
