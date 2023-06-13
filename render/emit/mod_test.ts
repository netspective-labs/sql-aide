import { path } from "../deps.ts";
import { testingAsserts as ta } from "../deps-test.ts";
import * as ws from "../../lib/universal/whitespace.ts";
import * as safety from "../../lib/universal/safety.ts";
import * as mod from "./mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any; // make it easy on linter

const isTableDefinition = safety.typeGuard<{ isTableDefinition: true }>(
  "isTableDefinition",
);
const isViewDefinition = safety.typeGuard<{ isViewDefinition: true }>(
  "isViewDefinition",
);

interface SyntheticTmplContext extends mod.SqlEmitContext {
  readonly syntheticBehavior1: mod.SqlTextBehaviorSupplier<
    SyntheticTmplContext
  >;
  readonly syntheticBehavior2: mod.SqlTextBehaviorSupplier<
    SyntheticTmplContext
  >;
}

const stContext = () => {
  const behaviorState = {
    state1Value: 0,
    state2Value: 0,
  };
  const ctx: SyntheticTmplContext = {
    ...mod.typicalSqlEmitContext(),
    // for this behavior we want to execute and then emit some output
    syntheticBehavior1: {
      executeSqlBehavior: () => {
        behaviorState.state1Value++;
        return {
          SQL: () => {
            return `behavior 1 state value: ${behaviorState.state1Value}`;
          },
        };
      },
    },
    // for this behavior we want to execute and then "eat" the emitted output
    syntheticBehavior2: {
      executeSqlBehavior: () => {
        behaviorState.state2Value++;
        return mod.removeLineFromEmitStream;
      },
    },
  };
  return {
    ...ctx,
    behaviorState,
  };
};

const syntheticNS: mod.SqlNamespaceSupplier = {
  sqlNamespace: "synthetic",
  qualifiedNames: (ctx, baseNS) => {
    const ns = baseNS ?? ctx.sqlNamingStrategy(ctx);
    const nsQualifier = mod.qualifyName(ns.schemaName("synthetic"));
    return mod.qualifiedNamingStrategy(ns, nsQualifier);
  },
};

Deno.test("qualified identifiers", async (tc) => {
  await tc.step("qualifier function without schema", () => {
    const [qualify] = mod.tokenQualifier({
      sqlNSS: { sqlNamingStrategy: mod.typicalSqlNamingStrategy() },
      tokens: (text, ns) => ({ sqlInjection: ns.typeName(text) }),
    });
    ta.assert(typeof qualify === "function");
    ta.assertEquals(qualify("no_schema_identifier"), {
      sqlInjection: "no_schema_identifier",
    });
  });

  await tc.step("qualifier function with namespace", () => {
    const [qualify] = mod.tokenQualifier({
      sqlNSS: { sqlNamingStrategy: mod.typicalSqlNamingStrategy() },
      tokens: (text, ns) => ({ sqlInjection: ns.typeName(text) }),
      nsOptions: { quoteIdentifiers: true, qnss: syntheticNS },
    });
    ta.assert(typeof qualify === "function");
    ta.assertEquals(qualify("identifier"), {
      sqlInjection: `"synthetic"."identifier"`,
    });
  });

  await tc.step(
    "generated identifiers in namespace with qualifier function at end",
    () => {
      const [identifier1, identifier2, identifier3] = mod
        .qualifiedTokens(
          {
            sqlNSS: { sqlNamingStrategy: mod.typicalSqlNamingStrategy() },
            tokens: (text, ns) => ({ sqlInjection: ns.typeName(text) }),
            nsOptions: { quoteIdentifiers: true, qnss: syntheticNS },
          },
          "identifier1",
          "identifier2",
          "identifier3",
        );
      ta.assertEquals(identifier1, {
        sqlInjection: `"synthetic"."identifier1"`,
      });
      ta.assertEquals(identifier2, {
        sqlInjection: `"synthetic"."identifier2"`,
      });
      ta.assertEquals(identifier3, {
        sqlInjection: `"synthetic"."identifier3"`,
      });
    },
  );
});

Deno.test("SQL Aide (SQLa) template", () => {
  const syntheticTable1Defn: mod.SqlTextSupplier<SyntheticTmplContext> & {
    isTableDefinition: true;
    insertDML: (record: Record<string, unknown>) => string;
  } & mod.SqlLintIssuesSupplier = {
    isTableDefinition: true,
    SQL: () =>
      ws.unindentWhitespace(`
      CREATE TABLE "synthetic_table1" (
        "synthetic_table1_id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "column_one_text" TEXT NOT NULL,
        "column_two_text_nullable" TEXT,
        "column_unique" TEXT NOT NULL,
        "column_linted_optional" TEXT,
        "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("column_unique")
      );`),
    insertDML: () =>
      `INSERT INTO "synthetic_table1" ("column_one_text", "column_two_text_nullable", "column_unique", "column_linted_optional", "created_at") VALUES ('test', NULL, 'testHI', NULL, NULL);`,
    registerLintIssue: () => {},
    lintIssues: [{ lintIssue: "synthetic lint issue #1" }],
  };

  const syntheticTable1ViewWrapper:
    & mod.SqlTextSupplier<SyntheticTmplContext>
    & {
      isViewDefinition: true;
    } = {
      isViewDefinition: true,
      SQL: () =>
        ws.unindentWhitespace(`
      CREATE VIEW IF NOT EXISTS "synthetic_table1_view"("synthetic_table1_id", "column_one_text", "column_two_text_nullable", "column_unique", "column_linted_optional", "created_at") AS
        SELECT "synthetic_table1_id", "column_one_text", "column_two_text_nullable", "column_unique", "column_linted_optional", "created_at"
          FROM "synthetic_table1";`),
    };

  const syntheticTable2Defn: mod.SqlTextSupplier<SyntheticTmplContext> & {
    isTableDefinition: true;
  } = {
    isTableDefinition: true,
    SQL: () =>
      ws.unindentWhitespace(`
      CREATE TABLE "synthetic_schema"."synthetic_table2" (
        "synthetic_table2_id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "column_three_text" TEXT NOT NULL,
        "column_four_int_nullable" INTEGER,
        "column_unique" TEXT NOT NULL,
        "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("column_unique")
      );`),
  };

  const persist = (
    sts: mod.SqlTextSupplier<SyntheticTmplContext>,
    basename: string,
  ) => {
    const result: mod.PersistableSqlText<SyntheticTmplContext> = {
      sqlTextSupplier: sts,
      persistDest: (_, index) => `${index}_${basename}`,
    };
    return result;
  };

  const tablesDeclared = new Set<{ isTableDefinition: true }>();
  const viewsDeclared = new Set<{ isViewDefinition: true }>();

  // deno-fmt-ignore
  const catalog = (sts: mod.SqlTextSupplier<SyntheticTmplContext>) => {
    if (isTableDefinition(sts)) {
      tablesDeclared.add(sts);
    }
    if (isViewDefinition(sts)) {
      viewsDeclared.add(sts);
    }
  }

  const [tokens1, tokens2, tokens3] = mod.qualifiedTokens(
    {
      sqlNSS: { sqlNamingStrategy: mod.typicalSqlNamingStrategy() },
      tokens: (text, ns) => ({ sqlInjection: ns.typeName(text) }),
      nsOptions: { quoteIdentifiers: true, qnss: syntheticNS },
    },
    "tokens1_sql",
    "tokens2_sql",
    "tokens3_sql",
  );

  const ctx = stContext();
  const ddlOptions = mod.typicalSqlTextSupplierOptions<SyntheticTmplContext>({
    prepareEvents: (spEE) => {
      spEE.on("sqlEmitted", (_, sts) => catalog(sts));
      spEE.on(
        "sqlPersisted",
        (_ctx, _destPath, psts) => catalog(psts.sqlTextSupplier),
      );
      return spEE;
    },
  });
  ddlOptions.sqlTextLintState?.lintedSqlText.registerLintIssue(
    ...syntheticTable1Defn.lintIssues,
  );
  const lintState = mod.typicalSqlLintSummaries(ddlOptions.sqlTextLintState);
  // deno-fmt-ignore
  const DDL = mod.SQL<SyntheticTmplContext>(ddlOptions)`
    -- Generated by ${path.basename(import.meta.url)}. DO NOT EDIT.
    -- these are some comments that should carry through to the generated SQL

    ${lintState.sqlTextLintSummary}
    -- ${ctx.syntheticBehavior1}

    ${syntheticTable1Defn}
    ${persist(syntheticTable1Defn, "publ-host.sql")}

    ${syntheticTable1ViewWrapper}
    ${ctx.syntheticBehavior2} -- the behavior will execute but this entire line will be removed from the interpolated result

    ${syntheticTable1Defn.insertDML({ column_one_text: "test", column_unique: "testHI" })}

    ${syntheticTable2Defn}

    ${mod.preprocess(import.meta.resolve("./mod_test_pp-fixture.sql"))}

    -- show that arbitrary "SQL tokens" can be emitted in the template...${tokens1} ${tokens2} ${tokens3}

    -- ${ctx.syntheticBehavior1}`;

  const syntheticSQL = DDL.SQL(ctx);
  ta.assertEquals(syntheticSQL, fixturePrime);
  ta.assertEquals(
    1,
    DDL.stsOptions.sqlTextLintState?.lintedSqlText.lintIssues.length,
  );
  ta.assertEquals(tablesDeclared.size, 2);
  ta.assertEquals(viewsDeclared.size, 1);
  ta.assertEquals(ctx.behaviorState.state1Value, 2);
  ta.assertEquals(ctx.behaviorState.state2Value, 1);
});

// deno-fmt-ignore
const fixturePrime = ws.unindentWhitespace(/*sql*/`
  -- Generated by mod_test.ts. DO NOT EDIT.
  -- these are some comments that should carry through to the generated SQL

  -- synthetic lint issue #1
  -- behavior 1 state value: 1

  CREATE TABLE "synthetic_table1" (
    "synthetic_table1_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "column_one_text" TEXT NOT NULL,
    "column_two_text_nullable" TEXT,
    "column_unique" TEXT NOT NULL,
    "column_linted_optional" TEXT,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("column_unique")
  );
  -- encountered persistence request for 1_publ-host.sql

  CREATE VIEW IF NOT EXISTS "synthetic_table1_view"("synthetic_table1_id", "column_one_text", "column_two_text_nullable", "column_unique", "column_linted_optional", "created_at") AS
    SELECT "synthetic_table1_id", "column_one_text", "column_two_text_nullable", "column_unique", "column_linted_optional", "created_at"
      FROM "synthetic_table1";

  INSERT INTO "synthetic_table1" ("column_one_text", "column_two_text_nullable", "column_unique", "column_linted_optional", "created_at") VALUES ('test', NULL, 'testHI', NULL, NULL);

  CREATE TABLE "synthetic_schema"."synthetic_table2" (
    "synthetic_table2_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "column_three_text" TEXT NOT NULL,
    "column_four_int_nullable" INTEGER,
    "column_unique" TEXT NOT NULL,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("column_unique")
  );

  -- \\set varName1 varValue1 (variable: varName1, value: varValue1, srcLine: 1)
  -- \\set varName2 varValue2 (variable: varName2, value: varValue2, srcLine: 2)

  select * from "varValue1";
  select * from "varValue1" where column = 'varValue2';

  -- show that arbitrary "SQL tokens" can be emitted in the template..."synthetic"."tokens1_sql" "synthetic"."tokens2_sql" "synthetic"."tokens3_sql"

  -- behavior 1 state value: 2`);
