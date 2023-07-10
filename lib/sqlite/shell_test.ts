import { testingAsserts as ta } from "./deps-test.ts";
import { unindentWhitespace as uws } from "../universal/whitespace.ts";
import * as mod from "./shell.ts";

const syntheticSqlDDL = uws(`
  CREATE TABLE synthetic_table(
    column1 text,
    column2 integer
  );`);

Deno.test("SQLite create in memory should fail", async () => {
  const result = await mod.executeSqliteCmd(":memory:", `bad SQL`);
  ta.assertEquals(result.code, 1);
  ta.assert(
    result.stderr().startsWith(
      `Parse error near line 1: near "bad": syntax error`,
    ),
  );
});

Deno.test("SQLite create in memory should succeed", async () => {
  const result = await mod.executeSqliteCmd(":memory:", syntheticSqlDDL);
  ta.assertEquals(result.code, 0);
});

Deno.test("SQLite create in memory, emit SQL, and go back into memory should succeed", async () => {
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
