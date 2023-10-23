import { testingAsserts as ta } from "./deps-test.ts";
import { unindentWhitespace as uws } from "../universal/whitespace.ts";
import * as mod from "./command.ts";

Deno.test(`SpawnableProcessCell`, async (tc) => {
  const cnb = mod.CommandsNotebook.create();

  await tc.step(`untyped sqlite3 spawnable process`, async () => {
    const p = await cnb.process(mod.spawnableProcess("sqlite3"))
      .stdin("bad sql")
      .spawn();
    ta.assertEquals(p.code, 1);
    ta.assert(
      new TextDecoder().decode(p.stderr).startsWith(
        `Parse error near line 1: near "bad": syntax error`,
      ),
    );
  });
});

Deno.test(`SqliteCell typed sqlite3 spawnable process`, async (tc) => {
  const cnb = mod.CommandsNotebook.create();
  const syntheticSqlDDL = uws(`
  CREATE TABLE synthetic_table(
    column1 text,
    column2 integer
  );`);

  await tc.step(`create in memory should fail`, async () => {
    const result = await mod.CommandsNotebook.create().sqlite3({
      sqlSupplier: `bad SQL`,
    }).spawn();
    ta.assertEquals(result.code, 1);
    ta.assert(
      new TextDecoder().decode(result.stderr).startsWith(
        `Parse error near line 1: near "bad": syntax error`,
      ),
    );
  });

  await tc.step(`create in memory should succeed`, async () => {
    const result = await mod.CommandsNotebook.create().sqlite3().SQL(
      syntheticSqlDDL,
    ).spawn();
    ta.assertEquals(result.code, 0);
  });

  await tc.step(
    `create in memory, emit SQL, and go back into memory should succeed`,
    async () => {
      const ddlResult = await cnb.sqlite3().SQL(syntheticSqlDDL).pragma({
        dump: true,
      }).text();
      ta.assert(ddlResult);

      const finalResult = await cnb.sqlite3({ sqlSupplier: ddlResult })
        .SQL(
          uws(`
        insert into synthetic_table VALUES ('test', 1);
        select count(*) from synthetic_table;
      `),
        ).spawn();
      ta.assertEquals(finalResult.code, 0);
      ta.assertEquals(finalResult.stdout, new TextEncoder().encode("1\n"));
    },
  );

  await tc.step(
    `create in memory, emit SQL, and retrieve JSON from new database should succeed`,
    async () => {
      const json = await cnb.sqlite3()
        .SQL(syntheticSqlDDL)
        .pragma({ dump: true })
        .pipe(cnb.sqlite3())
        .SQL(uws(`
              insert into synthetic_table VALUES ('test', 1);
              select * from synthetic_table;`))
        .json<{ column1: string; column2: number }[]>();

      ta.assert(json);
      ta.assertEquals(json.length, 1);
      ta.assertEquals(json[0].column1, "test");
      ta.assertEquals(json[0].column2, 1);
    },
  );

  await tc.step(
    `create in memory in untyped process, emit SQL, and retrieve JSON from typed command`,
    async () => {
      const json = await cnb.process(mod.spawnableProcess("sqlite3"))
        .stdin(syntheticSqlDDL)
        .stdin("\n.dump")
        .pipe(cnb.sqlite3())
        .SQL(uws(`
              insert into synthetic_table VALUES ('test', 1);
              select * from synthetic_table;`))
        .json<{ column1: string; column2: number }[]>();

      ta.assert(json);
      ta.assertEquals(json.length, 1);
      ta.assertEquals(json[0].column1, "test");
      ta.assertEquals(json[0].column2, 1);
    },
  );
});
