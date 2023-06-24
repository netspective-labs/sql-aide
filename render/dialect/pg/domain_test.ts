import { zod as z } from "../../deps.ts";
import { testingAsserts as ta } from "../../deps-test.ts";
import { unindentWhitespace as uws } from "../../../lib/universal/whitespace.ts";
import * as d from "../../domain/mod.ts";
import * as s from "../../ddl/schema.ts";
import * as tmpl from "../../emit/mod.ts";
import * as mod from "./domain.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

Deno.test("PostgreSQL custom synthetic data type (domain)", async (tc) => {
  const ctx = tmpl.typicalSqlEmitContext({
    sqlDialect: tmpl.postgreSqlDialect(),
  });
  const pgdf = mod.pgDomainsFactory();

  await tc.step("domain reference", () => {
    const dr = pgdf.pgDomainRef(
      s.sqlSchemaDefn("my_schema"),
      "custom_type_1",
    );
    ta.assertEquals(
      dr.sqlDataType("create table column").SQL(ctx),
      `"my_schema"."custom_type_1"`,
    );
  });

  await tc.step("idempotent domain declaration", () => {
    const domain = pgdf.pgDomainDefn(
      pgdf.stringSDF.string(z.string()),
      "custom_type_1",
      {
        isIdempotent: true,
      },
    );
    ta.assertEquals(
      domain.SQL(ctx),
      `BEGIN CREATE DOMAIN custom_type_1 AS TEXT; EXCEPTION WHEN DUPLICATE_OBJECT THEN /* ignore error without warning */ END`,
    );
  });

  await tc.step("idempotent domain declaration with warning", () => {
    const domain = pgdf.pgDomainDefn(
      pgdf.stringSDF.string(z.string()),
      "custom_type_1",
      {
        isIdempotent: true,
        warnOnDuplicate: (identifier) =>
          `domain "${identifier}" already exists, skipping`,
      },
    );
    ta.assertEquals(
      domain.SQL(ctx),
      `BEGIN CREATE DOMAIN custom_type_1 AS TEXT; EXCEPTION WHEN DUPLICATE_OBJECT THEN RAISE NOTICE 'domain "custom_type_1" already exists, skipping'; END`,
    );
  });

  await tc.step(
    "idempotent domain declaration with warning, human friendly format",
    () => {
      const domain = pgdf.pgDomainDefn(
        pgdf.stringSDF.string(z.string()),
        "custom_type_1",
        {
          isIdempotent: true,
          warnOnDuplicate: (identifier) =>
            `domain "${identifier}" already exists, skipping`,
          humanFriendlyFmtIndent: "  ",
        },
      );
      ta.assertEquals(
        domain.SQL(ctx),
        uws(`
          BEGIN
            CREATE DOMAIN custom_type_1 AS TEXT;
          EXCEPTION
            WHEN DUPLICATE_OBJECT THEN
              RAISE NOTICE 'domain "custom_type_1" already exists, skipping';
          END`),
      );
    },
  );

  await tc.step("schema declaration (non-idempotent)", () => {
    const view = pgdf.pgDomainDefn(
      pgdf.numberSDF.integer(z.number()),
      "custom_type_2",
    );
    ta.assertEquals(
      view.SQL(ctx),
      `CREATE DOMAIN custom_type_2 AS INTEGER`,
    );
  });
});

Deno.test("PostgreSQL type-safe custom domains in custom table with qualified names", () => {
  const stso = tmpl.typicalSqlTextSupplierOptions();
  const ctx = tmpl.typicalSqlEmitContext({
    sqlDialect: tmpl.postgreSqlDialect(),
  });
  const pgdf = mod.pgDomainsFactory();

  type DomainDefns = {
    readonly execution_context: d.SqlDomain<
      Any,
      typeof ctx,
      "execution_context",
      Any
    >;
    readonly execution_host_identity: d.SqlDomain<
      Any,
      typeof ctx,
      "execution_host_identity",
      Any
    >;
  };

  const qnss = s.sqlSchemaDefn("synthetic_schema1", {
    isIdempotent: true,
  });

  const dd: DomainDefns = {
    execution_context: pgdf.pgDomainDefn(
      // we type-cast because it's a reference ... "execution_context" as "ltree" in SQL
      pgdf.pgDomainRef(qnss, "ltree") as unknown as d.SqlDomain<
        Any,
        typeof ctx,
        "execution_context",
        Any
      >,
      "execution_context",
      {
        isIdempotent: true,
        nsOptions: {
          quoteIdentifiers: true,
          qnss,
        },
      },
    ),
    execution_host_identity: pgdf.pgDomainDefn(
      pgdf.stringSDF.string<z.ZodString, "execution_host_identity">(
        z.string(),
      ),
      "execution_host_identity",
      {
        isIdempotent: true,
        nsOptions: {
          quoteIdentifiers: true,
          qnss,
        },
      },
    ),
  };

  const [execCtx, execHostID] = tmpl.qualifiedTokens(
    {
      sqlNSS: ctx,
      tokens: (value, son) => ({ sqlInjection: son.injectable(value) }),
      nsOptions: { quoteIdentifiers: true, qnss },
    },
    dd.execution_context,
    dd.execution_host_identity,
  );

  const sQN = qnss.qualifiedNames(ctx);
  const SQL = tmpl.SQL(stso)`
    -- a single-row table which contains the global context (prod/test/devl/sandbox/etc.)
    CREATE TABLE IF NOT EXISTS ${sQN.tableName("context")} (
      singleton_id bool PRIMARY KEY DEFAULT TRUE,
      active ${execCtx} NOT NULL,
      host ${execHostID} NOT NULL,
      CONSTRAINT context_unq CHECK (singleton_id)
    );`;

  ta.assertEquals(
    SQL.SQL(ctx),
    uws(`
      -- a single-row table which contains the global context (prod/test/devl/sandbox/etc.)
      CREATE TABLE IF NOT EXISTS synthetic_schema1.context (
        singleton_id bool PRIMARY KEY DEFAULT TRUE,
        active "synthetic_schema1"."execution_context" NOT NULL,
        host "synthetic_schema1"."execution_host_identity" NOT NULL,
        CONSTRAINT context_unq CHECK (singleton_id)
      );`),
  );
});
