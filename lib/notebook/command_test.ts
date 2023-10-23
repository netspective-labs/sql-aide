import { testingAsserts as ta } from "./deps-test.ts";
import { unindentWhitespace as uws } from "../universal/whitespace.ts";
import * as mod from "./command.ts";

const syntheticSqlDDL = uws(`
  CREATE TABLE synthetic_table(
    column1 text,
    column2 integer
  );`);

Deno.test(`SQLite create in memory should fail`, async () => {
  const result = await mod.CommandsNotebook.create().sqlite3({
    sqlSupplier: `bad SQL`,
  }).spawn();
  ta.assertEquals(result.code, 1);
  ta.assert(
    result.stderr().startsWith(
      `Parse error near line 1: near "bad": syntax error`,
    ),
  );
});

Deno.test(`SQLite create in memory should succeed`, async () => {
  const result = await mod.CommandsNotebook.create().sqlite3().SQL(
    syntheticSqlDDL,
  ).spawn();
  ta.assertEquals(result.code, 0);
});

Deno.test(`SQLite create in memory, emit SQL, and go back into memory should succeed`, async () => {
  const notebook = mod.CommandsNotebook.create();
  const ddlResult = await notebook.sqlite3().SQL(syntheticSqlDDL).pragma({
    dump: true,
  }).text();
  ta.assert(ddlResult);

  const finalResult = await notebook.sqlite3({ sqlSupplier: ddlResult }).SQL(
    uws(`
      insert into synthetic_table VALUES ('test', 1);
      select count(*) from synthetic_table;
    `),
  ).spawn();
  ta.assertEquals(finalResult.code, 0);
  ta.assertEquals(finalResult.stdout(), "1\n");
});

Deno.test(`SQLite create in memory, emit SQL, and retrieve JSON from new database should succeed`, async () => {
  const notebook = mod.CommandsNotebook.create();
  const json = await notebook.sqlite3()
    .SQL(syntheticSqlDDL)
    .pragma({ dump: true })
    .pipe(notebook.sqlite3())
    .SQL(uws(`
            insert into synthetic_table VALUES ('test', 1);
            select * from synthetic_table;`))
    .json<{ column1: string; column2: number }[]>();

  ta.assert(json);
  ta.assertEquals(json.length, 1);
  ta.assertEquals(json[0].column1, "test");
  ta.assertEquals(json[0].column2, 1);
});
