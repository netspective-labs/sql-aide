import { zod as z } from "../deps.ts";
import { testingAsserts as ta } from "../deps-test.ts";
import { unindentWhitespace as uws } from "../../lib/universal/whitespace.ts";
import * as d from "../domain/mod.ts";
import * as mod from "./view.ts";
import * as emit from "../emit/mod.ts";
import * as sch from "./schema.ts";

Deno.test("SQL Aide (SQLa) views", async (tc) => {
  const ctx = emit.typicalSqlEmitContext();

  await tc.step("idempotent view with columns inferred from select", () => {
    const view = mod.viewDefinition("synthetic_view")`
      SELECT this, that, the_other
        FROM table
       WHERE something = 'true'`;
    ta.assertEquals(
      view.SQL(ctx),
      uws(`
         CREATE VIEW IF NOT EXISTS "synthetic_view" AS
             SELECT this, that, the_other
               FROM table
              WHERE something = 'true'`),
    );
  });

  await tc.step(
    "idempotent namespaced view with columns inferred from select",
    () => {
      const view = mod.viewDefinition("synthetic_view", {
        embeddedStsOptions: emit.typicalSqlTextSupplierOptions(),
        sqlNS: sch.sqlSchemaDefn("synthetic_schema"),
      })`
      SELECT this, that, the_other
        FROM table
       WHERE something = 'true'`;
      ta.assertEquals(
        view.SQL(ctx),
        uws(`
         CREATE VIEW IF NOT EXISTS "synthetic_schema"."synthetic_view" AS
             SELECT this, that, the_other
               FROM table
              WHERE something = 'true'`),
      );
    },
  );

  await tc.step(
    "idempotent namespaced view with type-safe columns specified",
    () => {
      const view = mod.safeViewDefinition("synthetic_view", {
        this: z.string(),
        that: z.string(),
        the_other: z.number(),
      }, {
        embeddedStsOptions: emit.typicalSqlTextSupplierOptions(),
        sqlNS: sch.sqlSchemaDefn("synthetic_schema"),
      })`
      SELECT this, that, the_other
        FROM table
       WHERE something = 'true'`;

      ta.assertEquals(
        view.SQL(ctx),
        uws(`
         CREATE VIEW IF NOT EXISTS "synthetic_schema"."synthetic_view"("this", "that", "the_other") AS
             SELECT this, that, the_other
               FROM table
              WHERE something = 'true'`),
      );
    },
  );

  await tc.step("idempotent view with type-safe columns specified", () => {
    const view = mod.safeViewDefinition("synthetic_view", {
      this: z.string(),
      that: z.string(),
      the_other: z.number(),
    })`
      SELECT this, that, the_other
        FROM table
       WHERE something = 'true'`;

    ta.assertEquals(
      view.SQL(ctx),
      uws(`
         CREATE VIEW IF NOT EXISTS "synthetic_view"("this", "that", "the_other") AS
             SELECT this, that, the_other
               FROM table
              WHERE something = 'true'`),
    );
  });

  await tc.step(
    "idempotent view with type-safe columns specified and used in SQL",
    () => {
      const sdf = d.sqlDomainsFactory();
      const { sdSchema: sd, zoSchema: zo } = sdf.sqlDomains({
        this: z.string(),
        that: z.string(),
        the_other: z.number(),
      });
      const view = mod.safeViewDefinition("synthetic_view", zo.shape)`
        SELECT ${sd.this}, ${sd.that}, ${sd.the_other}
          FROM table
         WHERE something = 'true'`;
      ta.assertEquals(
        view.SQL(ctx),
        uws(`
         CREATE VIEW IF NOT EXISTS "synthetic_view"("this", "that", "the_other") AS
             SELECT "this", "that", "the_other"
               FROM table
              WHERE something = 'true'`),
      );
    },
  );

  await tc.step("temp view (non-idempotent)", () => {
    const view = mod.viewDefinition("synthetic_view", {
      embeddedStsOptions: emit.typicalSqlTextSupplierOptions(),
      isIdempotent: false,
      isTemp: true,
    })`
      SELECT this, that, the_other
        FROM table
       WHERE something = 'true'`;
    ta.assertEquals(
      view.SQL(ctx),
      uws(`
         CREATE TEMP VIEW "synthetic_view" AS
             SELECT this, that, the_other
               FROM table
              WHERE something = 'true'`),
    );
  });

  await tc.step("drop first then create then drop", () => {
    const view = mod.viewDefinition("synthetic_view", {
      embeddedStsOptions: emit.typicalSqlTextSupplierOptions(),
      isIdempotent: false,
      before: (viewName) => mod.dropView(viewName),
    })`
      SELECT this, that, the_other
        FROM table
       WHERE something = 'true'`;
    ta.assertEquals(
      view.SQL(ctx),
      uws(`
         DROP VIEW IF EXISTS "synthetic_view";
         CREATE VIEW "synthetic_view" AS
             SELECT this, that, the_other
               FROM table
              WHERE something = 'true'`),
    );

    ta.assertEquals(
      view.drop().SQL(ctx),
      `DROP VIEW IF EXISTS "synthetic_view"`,
    );
    ta.assertEquals(
      view.drop({ ifExists: false }).SQL(ctx),
      `DROP VIEW "synthetic_view"`,
    );
  });
});

Deno.test("SQL Aide (SQLa) views for PostgreSQL", async (tc) => {
  const ctx = emit.typicalSqlEmitContext({
    sqlDialect: emit.postgreSqlDialect(),
  });

  await tc.step("idempotent view with columns inferred from select", () => {
    const view = mod.viewDefinition("synthetic_view")`
      SELECT this, that, the_other
        FROM table
       WHERE something = 'true'`;
    ta.assertEquals(
      view.SQL(ctx),
      uws(`
         CREATE OR REPLACE VIEW "synthetic_view" AS
             SELECT this, that, the_other
               FROM table
              WHERE something = 'true'`),
    );
  });

  await tc.step(
    "idempotent namespaced view with columns inferred from select",
    () => {
      const view = mod.viewDefinition("synthetic_view", {
        embeddedStsOptions: emit.typicalSqlTextSupplierOptions(),
        sqlNS: sch.sqlSchemaDefn("synthetic_schema"),
      })`
      SELECT this, that, the_other
        FROM table
       WHERE something = 'true'`;
      ta.assertEquals(
        view.SQL(ctx),
        uws(`
         CREATE OR REPLACE VIEW "synthetic_schema"."synthetic_view" AS
             SELECT this, that, the_other
               FROM table
              WHERE something = 'true'`),
      );
    },
  );

  await tc.step("idempotent view with type-safe columns specified", () => {
    const view = mod.safeViewDefinition("synthetic_view", {
      this: z.string(),
      that: z.string(),
      the_other: z.number(),
    })`
      SELECT this, that, the_other
        FROM table
       WHERE something = 'true'`;

    ta.assertEquals(
      view.SQL(ctx),
      uws(`
         CREATE OR REPLACE VIEW "synthetic_view"("this", "that", "the_other") AS
             SELECT this, that, the_other
               FROM table
              WHERE something = 'true'`),
    );
  });

  await tc.step(
    "idempotent view with type-safe columns specified and used in SQL",
    () => {
      const sdf = d.sqlDomainsFactory();
      const { sdSchema: sd, zoSchema: zo } = sdf.sqlDomains({
        this: z.string(),
        that: z.string(),
        the_other: z.number(),
      });
      const view = mod.safeViewDefinition("synthetic_view", zo.shape)`
        SELECT ${sd.this}, ${sd.that}, ${sd.the_other}
          FROM table
         WHERE something = 'true'`;
      ta.assertEquals(
        view.SQL(ctx),
        uws(`
         CREATE OR REPLACE VIEW "synthetic_view"("this", "that", "the_other") AS
             SELECT "this", "that", "the_other"
               FROM table
              WHERE something = 'true'`),
      );
    },
  );

  await tc.step("temp view (non-idempotent)", () => {
    const view = mod.viewDefinition("synthetic_view", {
      embeddedStsOptions: emit.typicalSqlTextSupplierOptions(),
      isIdempotent: false,
      isTemp: true,
    })`
      SELECT this, that, the_other
        FROM table
       WHERE something = 'true'`;
    ta.assertEquals(
      view.SQL(ctx),
      uws(`
         CREATE TEMP VIEW "synthetic_view" AS
             SELECT this, that, the_other
               FROM table
              WHERE something = 'true'`),
    );
  });

  await tc.step("drop first then create then drop", () => {
    const view = mod.viewDefinition("synthetic_view", {
      embeddedStsOptions: emit.typicalSqlTextSupplierOptions(),
      isIdempotent: false,
      before: (viewName) => mod.dropView(viewName),
    })`
      SELECT this, that, the_other
        FROM table
       WHERE something = 'true'`;
    ta.assertEquals(
      view.SQL(ctx),
      uws(`
         DROP VIEW IF EXISTS "synthetic_view";
         CREATE VIEW "synthetic_view" AS
             SELECT this, that, the_other
               FROM table
              WHERE something = 'true'`),
    );

    ta.assertEquals(
      view.drop().SQL(ctx),
      `DROP VIEW IF EXISTS "synthetic_view"`,
    );
    ta.assertEquals(
      view.drop({ ifExists: false }).SQL(ctx),
      `DROP VIEW "synthetic_view"`,
    );
  });
});
