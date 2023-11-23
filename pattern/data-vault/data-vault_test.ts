import { zod as z } from "../../deps.ts";
import { testingAsserts as ta } from "../../deps-test.ts";
import { unindentWhitespace as uws } from "../../lib/universal/whitespace.ts";
import * as SQLa from "../../render/mod.ts";
import * as mod from "./data-vault.ts";

// for convenience so that deno-lint is not required for use of `any`
// deno-lint-ignore no-explicit-any
type Any = any;

type SyntheticContext = SQLa.SqlEmitContext;

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
  const ctx: SyntheticContext = { ...SQLa.typicalSqlEmitContext() };
  const stso = SQLa.typicalSqlTextSupplierOptions<SyntheticContext>();
  const dvg = mod.dataVaultGovn<SyntheticContext>(stso);

  const { text, textNullable, integer, integerNullable, date } = dvg.domains;
  const { ulidPrimaryKey: primaryKey } = dvg.keys;

  const syntheticHub0 = dvg.hubTable("synthethic0", {
    hub_synthethic0_id: primaryKey(),
    business_key_text: text(),
    business_key_int: integer(),
    business_key_text_nullable: textNullable(),
    business_key_int_nullable: integerNullable(),
    ...dvg.housekeeping.columns,
  });

  const syntheticHub0Sat1 = syntheticHub0.satelliteTable("attrs1", {
    sat_synthethic0_attrs1_id: primaryKey(),
    hub_synthethic0_id: syntheticHub0.references.hub_synthethic0_id(),
    attr_text: text(),
    attr_int: integer(),
  });

  const syntheticHub0Sat2 = syntheticHub0.satelliteTable("attrs2", {
    sat_synthethic0_attrs2_id: primaryKey(),
    hub_synthethic0_id: syntheticHub0.references.hub_synthethic0_id(),
    attr_text: textNullable(),
    attr_int: integerNullable(),
  });

  const syntheticHub1 = dvg.hubTable("synthethic1", {
    hub_synthethic1_id: primaryKey(),
    h1_bkey_int: integer(),
    h1_bkey_text: text(),
    h1_bkey_date: date(),
    h1_bkey_int_nullable: integerNullable(),
    h1_bkey_text_nullable: textNullable(),
    ...dvg.housekeeping.columns,
  });

  const synHub0Hub1Link = dvg.linkTable("hub0_hub1", {
    link_hub0_hub1_id: primaryKey(),
    hub_synthethic0_id: syntheticHub0.references.hub_synthethic0_id(),
    hub_synthethic1_id: syntheticHub1.references.hub_synthethic1_id(),
    ...dvg.housekeeping.columns,
  });

  const synHub0Hub1LinkSat1 = synHub0Hub1Link.satelliteTable("link_attrs3", {
    sat_hub0_hub1_link_attrs3_id: primaryKey(),
    link_hub0_hub1_id: synHub0Hub1Link.references.link_hub0_hub1_id(),
    attr_text: text(),
    attr_int: integer(),
    ...dvg.housekeeping.columns,
  });

  const exceptionHubTable = dvg.exceptionHubTable;
  const hubExceptionDiagnosticSatTable = dvg.hubExceptionDiagnosticSatTable;
  const hubExceptionHttpClientSatTable = dvg.hubExceptionHttpClientSatTable;

  return {
    ctx,
    stso,
    ...dvg,
    exceptionHubTable,
    hubExceptionDiagnosticSatTable,
    hubExceptionHttpClientSatTable,
    syntheticHub0,
    syntheticHub0Sat1,
    syntheticHub0Sat2,
    syntheticHub1,
    synHub0Hub1Link,
    synHub0Hub1LinkSat1,
  };
};

Deno.test("Data Vault tables", async (tc) => {
  const schema = syntheticSchema();

  await tc.step("Synthetic Hub 0", async (innterTC) => {
    const { syntheticHub0: table, ctx } = schema;
    ta.assertEquals(table.lintIssues, []);
    ta.assertEquals(
      table.SQL(ctx),
      uws(`
        CREATE TABLE IF NOT EXISTS "hub_synthethic0" (
            "hub_synthethic0_id" TEXT PRIMARY KEY NOT NULL,
            "business_key_text" TEXT NOT NULL,
            "business_key_int" INTEGER NOT NULL,
            "business_key_text_nullable" TEXT,
            "business_key_int_nullable" INTEGER,
            "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "created_by" TEXT NOT NULL,
            "provenance" TEXT NOT NULL
        )`),
    );
    type HubRecord = z.infer<typeof table.zoSchema>;
    expectType<{
      hub_synthethic0_id: string;
      business_key_text: string;
      business_key_int: number;
      created_at?: Date | undefined;
      business_key_text_nullable?: string | undefined;
      business_key_int_nullable?: number | undefined;
    }>({} as HubRecord);

    await innterTC.step("Satellite 1", () => {
      const { syntheticHub0Sat1: satTable, ctx } = schema;
      ta.assertEquals(satTable.lintIssues, []);
      ta.assertEquals(
        satTable.SQL(ctx),
        uws(`
          CREATE TABLE IF NOT EXISTS "sat_synthethic0_attrs1" (
              "sat_synthethic0_attrs1_id" TEXT PRIMARY KEY NOT NULL,
              "hub_synthethic0_id" TEXT NOT NULL,
              "attr_text" TEXT NOT NULL,
              "attr_int" INTEGER NOT NULL,
              "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              "created_by" TEXT NOT NULL,
              "provenance" TEXT NOT NULL,
              FOREIGN KEY("hub_synthethic0_id") REFERENCES "hub_synthethic0"("hub_synthethic0_id")
          )`),
      );
      type SatRecord = z.infer<typeof satTable.zoSchema>;
      expectType<{
        hub_synthethic0_id: string;
        sat_synthethic0_attrs1_id: string;
        attr_text: string;
        attr_int: number;
        created_at?: Date | undefined;
      }>({} as SatRecord);
    });

    await innterTC.step("Satellite 2", () => {
      const { syntheticHub0Sat2: satTable, ctx } = schema;
      ta.assertEquals(satTable.lintIssues, []);
      ta.assertEquals(
        satTable.SQL(ctx),
        uws(`
          CREATE TABLE IF NOT EXISTS "sat_synthethic0_attrs2" (
              "sat_synthethic0_attrs2_id" TEXT PRIMARY KEY NOT NULL,
              "hub_synthethic0_id" TEXT NOT NULL,
              "attr_text" TEXT,
              "attr_int" INTEGER,
              "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              "created_by" TEXT NOT NULL,
              "provenance" TEXT NOT NULL,
              FOREIGN KEY("hub_synthethic0_id") REFERENCES "hub_synthethic0"("hub_synthethic0_id")
          )`),
      );
      type SatRecord = z.infer<typeof satTable.zoSchema>;
      expectType<{
        hub_synthethic0_id: string;
        sat_synthethic0_attrs2_id: string;
        attr_text?: string | undefined;
        attr_int?: number | undefined;
        created_at?: Date | undefined;
      }>({} as SatRecord);
    });
  });

  await tc.step("Synthetic Hub 1", () => {
    const { syntheticHub1: table, ctx } = schema;
    ta.assertEquals(table.lintIssues, []);
    ta.assertEquals(
      table.SQL(ctx),
      uws(`
        CREATE TABLE IF NOT EXISTS "hub_synthethic1" (
            "hub_synthethic1_id" TEXT PRIMARY KEY NOT NULL,
            "h1_bkey_int" INTEGER NOT NULL,
            "h1_bkey_text" TEXT NOT NULL,
            "h1_bkey_date" DATE NOT NULL,
            "h1_bkey_int_nullable" INTEGER,
            "h1_bkey_text_nullable" TEXT,
            "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "created_by" TEXT NOT NULL,
            "provenance" TEXT NOT NULL
        )`),
    );
    type HubRecord = z.infer<typeof table.zoSchema>;
    expectType<{
      hub_synthethic1_id: string;
      h1_bkey_int: number;
      h1_bkey_text: string;
      h1_bkey_date: Date;
      created_at?: Date | undefined;
      h1_bkey_int_nullable?: number | undefined;
      h1_bkey_text_nullable?: string | undefined;
    }>({} as HubRecord);
  });

  await tc.step("Synthetic Link 1", async (innterTC) => {
    const { synHub0Hub1Link: table, ctx } = schema;
    ta.assertEquals(table.lintIssues, []);
    ta.assertEquals(
      table.SQL(ctx),
      uws(`
        CREATE TABLE IF NOT EXISTS "link_hub0_hub1" (
            "link_hub0_hub1_id" TEXT PRIMARY KEY NOT NULL,
            "hub_synthethic0_id" TEXT NOT NULL,
            "hub_synthethic1_id" TEXT NOT NULL,
            "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "created_by" TEXT NOT NULL,
            "provenance" TEXT NOT NULL,
            FOREIGN KEY("hub_synthethic0_id") REFERENCES "hub_synthethic0"("hub_synthethic0_id"),
            FOREIGN KEY("hub_synthethic1_id") REFERENCES "hub_synthethic1"("hub_synthethic1_id")
        )`),
    );
    type LinkRecord = z.infer<typeof table.zoSchema>;
    expectType<{
      link_hub0_hub1_id: string;
      hub_synthethic0_id: string;
      hub_synthethic1_id: string;
      created_at?: Date | undefined;
    }>({} as LinkRecord);

    await innterTC.step("Satellite 1", () => {
      const { synHub0Hub1LinkSat1: satTable, ctx } = schema;
      ta.assertEquals(satTable.lintIssues, []);
      ta.assertEquals(
        satTable.SQL(ctx),
        uws(`
          CREATE TABLE IF NOT EXISTS "sat_hub0_hub1_link_attrs3" (
              "sat_hub0_hub1_link_attrs3_id" TEXT PRIMARY KEY NOT NULL,
              "link_hub0_hub1_id" TEXT NOT NULL,
              "attr_text" TEXT NOT NULL,
              "attr_int" INTEGER NOT NULL,
              "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              "created_by" TEXT NOT NULL,
              "provenance" TEXT NOT NULL,
              FOREIGN KEY("link_hub0_hub1_id") REFERENCES "link_hub0_hub1"("link_hub0_hub1_id")
          )`),
      );
      type SatRecord = z.infer<typeof satTable.zoSchema>;
      expectType<{
        sat_hub0_hub1_link_attrs3_id: string;
        attr_text: string;
        attr_int: number;
        link_hub0_hub1_id: string;
        created_at?: Date | undefined;
      }>({} as SatRecord);
    });

    await innterTC.step("Exception Hub", () => {
      const { exceptionHubTable: exceptionTable, ctx } = schema;
      ta.assertEquals(exceptionTable.lintIssues, []);
      ta.assertEquals(
        exceptionTable.SQL(ctx),
        uws(`
      CREATE TABLE IF NOT EXISTS "hub_exception" (
          "hub_exception_id" TEXT PRIMARY KEY NOT NULL,
          "exception_hub_key" TEXT NOT NULL,
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "created_by" TEXT NOT NULL,
          "provenance" TEXT NOT NULL
      )`),
      );
      type HubRecord = z.infer<typeof exceptionTable.zoSchema>;
      expectType<{
        hub_exception_id: string;
        exception_hub_key: string;
        created_at?: Date | undefined;
        created_by?: string | undefined;
        provenance?: string | undefined;
      }>({} as HubRecord);
    });

    await innterTC.step("Exception diagnostics Satellite", () => {
      const { hubExceptionDiagnosticSatTable: exceptionDiagnosticTable, ctx } =
        schema;
      ta.assertEquals(exceptionDiagnosticTable.lintIssues, []);
      ta.assertEquals(
        exceptionDiagnosticTable.SQL(ctx),
        uws(`
      CREATE TABLE IF NOT EXISTS "sat_exception_diagnostic" (
          "sat_exception_diagnostic_id" TEXT PRIMARY KEY NOT NULL,
          "hub_exception_id" TEXT NOT NULL,
          "hub_exception_id_ref" TEXT NOT NULL,
          "message" TEXT NOT NULL,
          "err_returned_sqlstate" TEXT NOT NULL,
          "err_pg_exception_detail" TEXT NOT NULL,
          "err_pg_exception_hint" TEXT NOT NULL,
          "err_pg_exception_context" TEXT NOT NULL,
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "created_by" TEXT NOT NULL,
          "provenance" TEXT NOT NULL,
          FOREIGN KEY("hub_exception_id") REFERENCES "hub_exception"("hub_exception_id")
      )`),
      );
      type SatRecord = z.infer<typeof exceptionDiagnosticTable.zoSchema>;
      expectType<{
        sat_exception_diagnostic_id: string;
        hub_exception_id: string;
        hub_exception_id_ref: string;
        message: string;
        err_returned_sqlstate: string;
        err_pg_exception_detail: string;
        err_pg_exception_hint: string;
        err_pg_exception_context: string;
        created_at?: Date | undefined;
        created_by?: string | undefined;
        provenance?: string | undefined;
      }>({} as SatRecord);
    });
    await innterTC.step("Exception Http Client Satellite", () => {
      const {
        hubExceptionHttpClientSatTable: hubExceptionHttpClientTable,
        ctx,
      } = schema;
      ta.assertEquals(hubExceptionHttpClientTable.lintIssues, []);
      ta.assertEquals(
        hubExceptionHttpClientTable.SQL(ctx),
        uws(`
      CREATE TABLE IF NOT EXISTS "sat_exception_http_client" (
          "sat_exception_http_client_id" TEXT PRIMARY KEY NOT NULL,
          "hub_exception_id" TEXT NOT NULL,
          "http_req" TEXT,
          "http_resp" TEXT,
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "created_by" TEXT NOT NULL,
          "provenance" TEXT NOT NULL,
          FOREIGN KEY("hub_exception_id") REFERENCES "hub_exception"("hub_exception_id")
      )`),
      );
      type SatRecord = z.infer<typeof hubExceptionHttpClientTable.zoSchema>;
      expectType<{
        sat_exception_http_client_id: string;
        hub_exception_id: string;
        http_req?: string | undefined;
        http_resp?: string | undefined;
        created_at?: Date | undefined;
        created_by?: string | undefined;
        provenance?: string | undefined;
      }>({} as SatRecord);
    });
  });
});
