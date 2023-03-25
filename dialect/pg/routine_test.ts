import { zod as z } from "../../deps.ts";
import { testingAsserts as ta } from "../../deps-test.ts";
import { unindentWhitespace as uws } from "../../lib/universal/whitespace.ts";
import * as tmpl from "../../emit/mod.ts";
import * as mod from "./routine.ts";
import * as ddl from "../../ddl/mod.ts";

Deno.test("SQL Aide (SQLa) anonymous stored routine", async (tc) => {
  const ctx = tmpl.typicalSqlEmitContext();

  await tc.step("PL/pgSQL anonymous block (auto begin/end)", () => {
    const autoBeginEndAnonBlock = mod.anonymousPlPgSqlRoutine(ctx)`
        CREATE DOMAIN custom_type_1 AS TEXT;
      EXCEPTION
        WHEN DUPLICATE_OBJECT THEN
          RAISE NOTICE 'domain "custom_type_1" already exists, skipping';`;
    ta.assertEquals(
      autoBeginEndAnonBlock.SQL(ctx),
      uws(`
        DO $$
          BEGIN
              CREATE DOMAIN custom_type_1 AS TEXT;
            EXCEPTION
              WHEN DUPLICATE_OBJECT THEN
                RAISE NOTICE 'domain "custom_type_1" already exists, skipping';
          END;
        $$`),
    );
  });

  await tc.step(
    "PL/pgSQL DO block with safe duplicate exception dismissal",
    () => {
      const doSafeDupe = mod.doIgnoreDuplicate(ctx)`
        CREATE DOMAIN custom_type_1 AS TEXT;`;
      ta.assertEquals(
        doSafeDupe.SQL(ctx),
        uws(`
          DO $$ BEGIN
            CREATE DOMAIN custom_type_1 AS TEXT;
          EXCEPTION
            WHEN duplicate_object THEN NULL
          END; $$`),
      );
    },
  );

  await tc.step(
    "PL/pgSQL DO block with safe duplicate exception dismissal via SqlTextSupplier",
    () => {
      const synTypeDefn = ddl.sqlTypeDefinition("synthetic_type", {
        text: z.string(),
        int: z.number(),
      });
      const doSafeDupe = mod.doIgnoreDuplicate(ctx)`${synTypeDefn}`;
      ta.assertEquals(
        doSafeDupe.SQL(ctx),
        uws(`
          DO $$ BEGIN
            CREATE TYPE "synthetic_type" AS (
                "text" TEXT,
                "int" INTEGER
            );
          EXCEPTION
            WHEN duplicate_object THEN NULL
          END; $$`),
      );
    },
  );

  await tc.step("PL/pgSQL anonymous block (manual begin/end)", () => {
    const anonBlock = mod.anonymousPlPgSqlRoutine(ctx, { autoBeginEnd: false })`
      BEGIN
        CREATE DOMAIN custom_type_1 AS TEXT;
      EXCEPTION
        WHEN DUPLICATE_OBJECT THEN
          RAISE NOTICE 'domain "custom_type_1" already exists, skipping';
      END;`;
    ta.assertEquals(
      anonBlock.SQL(ctx),
      uws(`
        DO $$
          BEGIN
            CREATE DOMAIN custom_type_1 AS TEXT;
          EXCEPTION
            WHEN DUPLICATE_OBJECT THEN
              RAISE NOTICE 'domain "custom_type_1" already exists, skipping';
          END;
        $$`),
    );
  });

  await tc.step(
    "PL/SQL stored procedure (idempotent, auto begin/end)",
    () => {
      const sp = mod.storedProcedure("synthetic_sp1", {
        arg1: z.string(),
      }, (name, args) => mod.typedPlSqlBody(name, args, ctx))`
      -- this is the stored procedure body`;
      ta.assertEquals(
        sp.SQL(ctx),
        uws(`
        CREATE OR REPLACE PROCEDURE "synthetic_sp1"("arg1" TEXT) AS $$
          -- this is the stored procedure body
        $$ LANGUAGE SQL;`),
      );
    },
  );

  await tc.step(
    "PL/SQL namespaced stored procedure (idempotent, auto begin/end)",
    () => {
      const sp = mod.storedProcedure(
        "synthetic_sp1",
        {
          arg1: z.string(),
        },
        (name, args) => mod.typedPlSqlBody(name, args, ctx),
        {
          embeddedStsOptions: tmpl.typicalSqlTextSupplierOptions(),
          sqlNS: ddl.sqlSchemaDefn("synthetic_schema"),
        },
      )`
      -- this is the stored procedure body`;
      ta.assertEquals(
        sp.SQL(ctx),
        uws(`
        CREATE OR REPLACE PROCEDURE "synthetic_schema"."synthetic_sp1"("arg1" TEXT) AS $$
          -- this is the stored procedure body
        $$ LANGUAGE SQL;`),
      );
    },
  );

  await tc.step(
    "PL/pgSQL stored procedure (idempotent, auto begin/end, with IN/OUT modifiers and drop before)",
    () => {
      const pgRAF = mod.pgRoutineArgFactory();
      const sp = mod.storedProcedure(
        "synthetic_sp1",
        {
          arg1: z.string(),
          arg2: pgRAF.IN(z.number()),
          arg3: pgRAF.OUT(z.bigint()),
          arg4: pgRAF.IN_OUT(z.date()),
        },
        (name, args, bo) => mod.typedPlPgSqlBody(name, args, ctx, bo),
        {
          embeddedStsOptions: tmpl.typicalSqlTextSupplierOptions(),
          before: (name) => mod.dropStoredProcedure(name),
        },
      )`
      -- this is the stored procedure body`;
      ta.assertEquals(
        sp.SQL(ctx),
        uws(`
        DROP PROCEDURE IF EXISTS "synthetic_sp1";
        CREATE OR REPLACE PROCEDURE "synthetic_sp1"("arg1" TEXT, IN "arg2" INTEGER, OUT "arg3" BIGINT, IN OUT "arg4" DATE) AS $$
        BEGIN
          -- this is the stored procedure body
        END;
        $$ LANGUAGE PLPGSQL;`),
      );
    },
  );

  await tc.step(
    "PL/SQL stored function returns TABLE (idempotent, auto begin/end, manual drop)",
    () => {
      const pgRAF = mod.pgRoutineArgFactory();
      const sf = mod.storedFunction(
        "Repeat",
        {
          fromDate: z.date(),
          toDate: pgRAF.zodTypeBaggageProxy(
            z.date().default(new Date()).optional(),
            pgRAF.dateSDF.createdAt(),
          ),
        },
        { label: z.string(), cnt: z.bigint() },
        (name, args) => mod.typedPlSqlBody(name, args, ctx),
      )`
        SELECT label, count(*) AS Cnt
          FROM test
         WHERE date between fromDate and toDate
         GROUP BY label;`;
      ta.assertEquals(
        sf.SQL(ctx),
        uws(`
        CREATE OR REPLACE FUNCTION "Repeat"("fromDate" DATE, "toDate" DATETIME = CURRENT_TIMESTAMP) RETURNS TABLE("label" TEXT, "cnt" BIGINT) AS $$
          SELECT label, count(*) AS Cnt
            FROM test
           WHERE date between fromDate and toDate
           GROUP BY label;
        $$ LANGUAGE SQL;`),
      );
      ta.assertEquals(
        sf.drop().SQL(ctx),
        uws(`DROP FUNCTION IF EXISTS "Repeat"`),
      );
    },
  );

  await tc.step(
    "PL/pgSQL stored function returns TABLE (idempotent, auto begin/end)",
    () => {
      const sf = mod.storedFunction(
        "Repeat",
        {
          fromDate: z.date(),
          toDate: z.date(),
        },
        { label: z.string(), cnt: z.bigint() },
        (name, args, _, bo) => mod.typedPlPgSqlBody(name, args, ctx, bo),
      )`
        RETURN query
          SELECT label, count(*) AS Cnt
            FROM test
           WHERE date between fromDate and toDate
           GROUP BY label;`;
      ta.assertEquals(
        sf.SQL(ctx),
        uws(`
        CREATE OR REPLACE FUNCTION "Repeat"("fromDate" DATE, "toDate" DATE) RETURNS TABLE("label" TEXT, "cnt" BIGINT) AS $$
        BEGIN
          RETURN query
            SELECT label, count(*) AS Cnt
              FROM test
             WHERE date between fromDate and toDate
             GROUP BY label;
        END;
        $$ LANGUAGE PLPGSQL;`),
      );
    },
  );

  await tc.step(
    "PL/pgSQL namespaced stored function returns RECORD (non-idempotent, manual begin/end)",
    () => {
      const sf = mod.storedFunction(
        "Return_Record",
        {
          a: z.string(),
          b: z.string(),
        },
        "RECORD",
        (name, args, _, bo) => mod.typedPlPgSqlBody(name, args, ctx, bo),
        {
          embeddedStsOptions: tmpl.typicalSqlTextSupplierOptions(),
          autoBeginEnd: false,
          isIdempotent: false,
          sqlNS: ddl.sqlSchemaDefn("synthetic_schema"),
        },
      )`
        DECLARE
          ret RECORD;
        BEGIN
          -- Arbitrary expression to change the first parameter
          IF LENGTH(a) < LENGTH(b) THEN
              SELECT TRUE, a || b, 'a shorter than b' INTO ret;
          ELSE
              SELECT FALSE, b || a INTO ret;
          END IF;
          RETURN ret;
        END;`;
      ta.assertEquals(
        sf.SQL(ctx),
        uws(`
          CREATE FUNCTION "synthetic_schema"."Return_Record"("a" TEXT, "b" TEXT) RETURNS RECORD AS $$
          DECLARE
            ret RECORD;
          BEGIN
            -- Arbitrary expression to change the first parameter
            IF LENGTH(a) < LENGTH(b) THEN
                SELECT TRUE, a || b, 'a shorter than b' INTO ret;
            ELSE
                SELECT FALSE, b || a INTO ret;
            END IF;
            RETURN ret;
          END;
          $$ LANGUAGE PLPGSQL;`),
      );
    },
  );
});
