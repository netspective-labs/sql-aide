import { zod as z } from "../deps.ts";
import { testingAsserts as ta } from "../deps-test.ts";
import * as SQLa from "../mod.ts";
import * as mod from "./data-vault.ts";
import { unindentWhitespace as uws } from "../lib/universal/whitespace.ts";

// for convenience so that deno-lint is not required for use of `any`
// deno-lint-ignore no-explicit-any
type Any = any;

const expectType = <T>(_value: T) => {
  // Do nothing, the TypeScript compiler handles this for us
};

Deno.test("Data Vault governance", () => {
  const stso = SQLa.typicalSqlTextSupplierOptions();
  const dvg = mod.dataVaultGovn(stso);
  ta.assert(dvg);
  ta.assert(dvg.domains);
  ta.assert(dvg.names);
  ta.assert(dvg.keys);
  ta.assert(dvg.keys.ulidPrimaryKey);
  ta.assert(dvg.keys.autoIncPrimaryKey);
  ta.assert(dvg.housekeeping);
  ta.assert(dvg.table);
  ta.assert(dvg.hubTable);
  //   ta.assert(dvg.hubSatelliteTableName);
  //   ta.assert(dvg.hubSatelliteTable);
  //   ta.assert(dvg.linkTableName);
  //   ta.assert(dvg.linkTable);
  //   ta.assert(dvg.linkSatelliteTableName);
  //   ta.assert(dvg.linkSatelliteTable);
  ta.assert(dvg.tableLintRules);
});

const syntheticSchema = () => {
  const ctx = SQLa.typicalSqlEmitContext();
  const stso = SQLa.typicalSqlTextSupplierOptions<typeof ctx>();
  const dvg = mod.dataVaultGovn<typeof ctx>(stso);

  const { text, textNullable, integer, integerNullable } = dvg.domains;
  const { ulidPrimaryKey: primaryKey } = dvg.keys;

  const syntheticHub0 = dvg.hubTable("synthethic0", {
    hub_synthethic0_id: primaryKey(),
    business_key_text: text(),
    business_key_int: integer(),
    business_key_text_nullable: textNullable(),
    business_key_int_nullable: integerNullable(),
    ...dvg.housekeeping.columns,
  });

  return {
    ctx,
    stso,
    ...dvg,
    syntheticHub0,
  };
};

Deno.test("Data Vault tables", async (tc) => {
  const schema = syntheticSchema();

  await tc.step("Synthetic Hub 0", () => {
    const { syntheticHub0: table, ctx } = schema;
    ta.assertEquals(table.lintIssues, []);
    ta.assertEquals(
      table.SQL(ctx),
      uws(`
        CREATE TABLE IF NOT EXISTS "hub_synthethic0" (
            "hub_synthethic0_id" TEXT PRIMARY KEY,
            "business_key_text" TEXT NOT NULL,
            "business_key_int" INTEGER NOT NULL,
            "business_key_text_nullable" TEXT,
            "business_key_int_nullable" INTEGER,
            "created_at" DATE
        )`),
    );
    type SyntheticHub0 = z.infer<typeof table.zoSchema>;
    expectType<{
      hub_synthethic0_id: string;
      business_key_text: string;
      business_key_int: number;
      created_at?: Date | undefined;
      business_key_text_nullable?: string | undefined;
      business_key_int_nullable?: number | undefined;
    }>({} as SyntheticHub0);
  });
});
