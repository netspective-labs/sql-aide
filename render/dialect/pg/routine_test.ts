import { zod as z } from "../../deps.ts";
import { testingAsserts as ta } from "../../deps-test.ts";
import { unindentWhitespace as uws } from "../../../lib/universal/whitespace.ts";
import * as tmpl from "../../emit/mod.ts";
import * as mod from "./routine.ts";
import * as ddl from "../../ddl/mod.ts";

Deno.test("SQL Aide (SQLa) anonymous stored routine", async (tc) => {
  const ctx = tmpl.typicalSqlEmitContext({
    sqlDialect: tmpl.postgreSqlDialect(),
  });

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
    "PL/SQL no-args stored procedure (idempotent, auto begin/end)",
    () => {
      const sp = mod.storedProcedure(
        "synthetic_sp0",
        {},
        (name) => mod.untypedPlSqlBody(name, ctx),
      )`
      -- this is the stored procedure body`;
      ta.assertEquals(
        sp.SQL(ctx),
        uws(`
        CREATE OR REPLACE PROCEDURE "synthetic_sp0"() AS $$
          -- this is the stored procedure body
        $$ LANGUAGE SQL;`),
      );
    },
  );

  await tc.step(
    "PL/pgSQL no-args stored procedure (idempotent, auto begin/end)",
    () => {
      const sp = mod.storedProcedure(
        "synthetic_sp0",
        {},
        (name) => mod.untypedPlPgSqlBody(name, ctx),
      )`
      -- this is the stored procedure body`;
      ta.assertEquals(
        sp.SQL(ctx),
        uws(`
        CREATE OR REPLACE PROCEDURE "synthetic_sp0"() AS $$
        BEGIN
          -- this is the stored procedure body
        END;
        $$ LANGUAGE PLPGSQL;`),
      );
    },
  );

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
        CREATE OR REPLACE FUNCTION "Repeat"("fromDate" DATE, "toDate" TIMESTAMPTZ = CURRENT_TIMESTAMP) RETURNS TABLE("label" TEXT, "cnt" BIGINT) AS $$
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

  await tc.step(
    "PL/SQL stored procedure for upsert values into the table (idempotent, auto begin/end)",
    () => {
      const sp = mod.storedProcedure("synthetic_sp_upsert", {
        synthetic_id: z.string(),
        synthetic_text: z.string(),
        synthetic_json_converted: z.string(),
        synthetic_hash: z.string(),
        synthetic_type: z.string(),
        created_time: z.date(),
        updated_time: z.date(),
        provenance: z.string(),
      }, (name, args) => mod.typedPlSqlBody(name, args, ctx))`
      insert into stateful_service.synthetic_table
      (synthetic_id, synthetic_text, synthetic_json_converted, synthetic_hash, synthetic_type, created_time, updated_time, provenance)
      values ($1, $2, $3, $4, $5, $6, $7, $8)
      on conflict do nothing`;
      ta.assertEquals(
        sp.SQL(ctx),
        uws(`
        CREATE OR REPLACE PROCEDURE "synthetic_sp_upsert"("synthetic_id" TEXT, "synthetic_text" TEXT, "synthetic_json_converted" TEXT, "synthetic_hash" TEXT, "synthetic_type" TEXT, "created_time" DATE, "updated_time" DATE, "provenance" TEXT) AS $$
          insert into stateful_service.synthetic_table
          (synthetic_id, synthetic_text, synthetic_json_converted, synthetic_hash, synthetic_type, created_time, updated_time, provenance)
          values ($1, $2, $3, $4, $5, $6, $7, $8)
          on conflict do nothing
        $$ LANGUAGE SQL;`),
      );
    },
  );

  await tc.step(
    "PL/SQL stored procedure for upsert values into the table (idempotent, auto begin/end, type-safe names)",
    () => {
      // this test step is just like the one above but shows how to strongly-type
      // the names of the arguments and properly quote them automatically
      const srb = mod.storedRoutineBuilder("synthetic_sp_upsert", {
        synthetic_id: z.string(),
        synthetic_text: z.string(),
        synthetic_json_converted: z.string(),
        synthetic_hash: z.string(),
        synthetic_type: z.string(),
        created_time: z.date(),
        updated_time: z.date(),
        provenance: z.string(),
      });
      const { argsSD: { sdSchema: spa }, argsIndex: spi } = srb;
      const sp = mod.storedProcedure(
        srb.routineName,
        srb.argsDefn,
        (name, args) => mod.typedPlSqlBody(name, args, ctx),
      )`
      insert into stateful_service.synthetic_table
      (${spa.synthetic_id}, ${spa.synthetic_text}, ${spa.synthetic_json_converted}, ${spa.synthetic_hash}, ${spa.synthetic_type}, ${spa.created_time}, ${spa.updated_time}, ${spa.provenance})
      values (${spi.synthetic_id}, ${spi.synthetic_text}, ${spi.synthetic_json_converted}, ${spi.synthetic_hash}, ${spi.synthetic_type}, ${spi.created_time}, ${spi.updated_time}, ${spi.provenance})
      on conflict do nothing`;
      ta.assertEquals(
        sp.SQL(ctx),
        uws(`
        CREATE OR REPLACE PROCEDURE "synthetic_sp_upsert"("synthetic_id" TEXT, "synthetic_text" TEXT, "synthetic_json_converted" TEXT, "synthetic_hash" TEXT, "synthetic_type" TEXT, "created_time" DATE, "updated_time" DATE, "provenance" TEXT) AS $$
          insert into stateful_service.synthetic_table
          ("synthetic_id", "synthetic_text", "synthetic_json_converted", "synthetic_hash", "synthetic_type", "created_time", "updated_time", "provenance")
          values ($1, $2, $3, $4, $5, $6, $7, $8)
          on conflict do nothing
        $$ LANGUAGE SQL;`),
      );
    },
  );

  await tc.step(
    "PL/pgSQL namespaced stored function for upsert values into the table that returns inserted_row RECORD (non-idempotent, manual begin/end)",
    () => {
      // note mixed use of hard-coded arguments names and properly typed
      // argument names (`spa`) and indexes (`spi`). always use properly
      // typed names and indexes so that when argument names change the
      // SP can be generated properly.
      const srb = mod.storedRoutineBuilder("synthetic_sf_upserted", {
        synthetic_id: z.string(),
        synthetic_text: z.string(),
        synthetic_json_converted: z.string(),
        synthetic_hash: z.string(),
        synthetic_type: z.string(),
        created_time: z.date(),
        updated_time: z.date(),
        provenance: z.string(),
      });
      const { argsSD: { sdSchema: spa }, argsIndex: spi } = srb;
      const returns = "inserted_row";
      const sf = mod.storedFunction(
        "synthetic_sf_upserted",
        srb.argsDefn,
        returns,
        (name, args, _, bo) => mod.typedPlPgSqlBody(name, args, ctx, bo),
        {
          embeddedStsOptions: tmpl.typicalSqlTextSupplierOptions(),
          autoBeginEnd: false,
          isIdempotent: false,
          sqlNS: ddl.sqlSchemaDefn("stateful_service"),
        },
      )`
      DECLARE
         ${returns} stateful_service.synthetic_table;
      BEGIN
          select * into ${returns}
            from stateful_service.synthetic_id synthetic_table
          where synthetic_table.${spa.synthetic_text} = ${spi.synthetic_text} AND synthetic_table.synthetic_json_converted = $3 AND synthetic_table.synthetic_hash = $4 AND synthetic_table.synthetic_type = $5 AND synthetic_table.created_time = $6 AND synthetic_table.updated_time = $7
            and synthetic_table.provenance = $8;
          if ${returns} is null then
            insert into stateful_service.synthetic_table
              (synthetic_id, ${spa.synthetic_text}, synthetic_json_converted, synthetic_hash, synthetic_type, created_time, updated_time, provenance)
              values ($1, ${spi.synthetic_text}, $3, $4, $5, $6, $7, $8)
              returning * into ${returns};
          end if;
          return ${returns};
      END;`;
      ta.assertEquals(
        sf.SQL(ctx),
        uws(`
        CREATE FUNCTION "stateful_service"."synthetic_sf_upserted"("synthetic_id" TEXT, "synthetic_text" TEXT, "synthetic_json_converted" TEXT, "synthetic_hash" TEXT, "synthetic_type" TEXT, "created_time" DATE, "updated_time" DATE, "provenance" TEXT) RETURNS inserted_row AS $$
        DECLARE
           inserted_row stateful_service.synthetic_table;
        BEGIN
            select * into inserted_row
              from stateful_service.synthetic_id synthetic_table
            where synthetic_table."synthetic_text" = $2 AND synthetic_table.synthetic_json_converted = $3 AND synthetic_table.synthetic_hash = $4 AND synthetic_table.synthetic_type = $5 AND synthetic_table.created_time = $6 AND synthetic_table.updated_time = $7
              and synthetic_table.provenance = $8;
            if inserted_row is null then
              insert into stateful_service.synthetic_table
                (synthetic_id, "synthetic_text", synthetic_json_converted, synthetic_hash, synthetic_type, created_time, updated_time, provenance)
                values ($1, $2, $3, $4, $5, $6, $7, $8)
                returning * into inserted_row;
            end if;
            return inserted_row;
        END;
        $$ LANGUAGE PLPGSQL;`),
      );
    },
  );

  await tc.step(
    "PL/Python stored procedure (idempotent, auto begin/end)",
    () => {
      const sp = mod.storedProcedure(
        "synthetic_sp1",
        {
          arg1: z.string(),
        },
        (name, args) =>
          mod.typedPlSqlBody(name, args, ctx, mod.plPythonLanguage()),
      )`
      -- this is the stored procedure body`;
      ta.assertEquals(
        sp.SQL(ctx),
        uws(`
        CREATE OR REPLACE PROCEDURE "synthetic_sp1"("arg1" TEXT) AS $$
          -- this is the stored procedure body
        $$ LANGUAGE PLPYTHON3U;`),
      );
    },
  );

  await tc.step(
    "PL/Java stored procedure (idempotent, auto begin/end)",
    () => {
      const sp = mod.storedProcedure(
        "synthetic_sp1",
        {
          arg1: z.string(),
        },
        (name, args) =>
          mod.typedPlSqlBody(name, args, ctx, mod.plJavaLanguage()),
      )`
      -- this is the stored procedure body`;
      ta.assertEquals(
        sp.SQL(ctx),
        uws(`
        CREATE OR REPLACE PROCEDURE "synthetic_sp1"("arg1" TEXT) AS $$
          -- this is the stored procedure body
        $$ LANGUAGE JAVA;`),
      );
    },
  );
});
