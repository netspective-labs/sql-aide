import { testingAsserts as ta } from "./deps-test.ts";
import { unindentWhitespace as uws } from "../universal/whitespace.ts";
import * as mod from "./shell.ts";

const isCICD = Deno.env.get("CI") ? true : false;
const isCICDMsg = isCICD ? ` (skipped in CI)` : "";
const syntheticSqlDDL = uws(`
  CREATE TABLE synthetic_table(
    column1 text,
    column2 integer
  );`);

Deno.test(`SQLite create in memory should fail${isCICDMsg}`, async () => {
  // if we're running in GitHub Actions or other Continuous Integration (CI)
  // or Continuous Delivery (CD) environment then PostgreSQL won't be available
  // so don't fail the test case, just don't run it
  if (isCICD) return;

  const result = await mod.executeSqliteCmd(":memory:", `bad SQL`);
  ta.assertEquals(result.code, 1);
  ta.assert(
    result.stderr().startsWith(
      `Parse error near line 1: near "bad": syntax error`,
    ),
  );
});

Deno.test(`SQLite create in memory should succeed${isCICDMsg}`, async () => {
  if (isCICD) return;
  const result = await mod.executeSqliteCmd(":memory:", syntheticSqlDDL);
  ta.assertEquals(result.code, 0);
});

Deno.test(`SQLite create in memory, emit SQL, and go back into memory should succeed${isCICDMsg}`, async () => {
  if (isCICD) return;
  const result = await mod.executeOptimizedSqliteCmd(
    ":memory:",
    syntheticSqlDDL,
    {
      destDbSQL: uws(`
        insert into synthetic_table VALUES ('test', 1);
        select count(*) from synthetic_table;
      `),
    },
  );
  ta.assertEquals(result.inMemory.code, 0);
  ta.assert(result.dest);
  ta.assertEquals(result.dest.code, 0);
  ta.assertEquals(result.dest.stdout(), "1\n");
});
