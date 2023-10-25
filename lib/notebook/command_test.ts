import { testingAsserts as ta } from "./deps-test.ts";
import { unindentWhitespace as uws } from "../universal/whitespace.ts";
import * as mod from "./command.ts";

Deno.test(`Command`, async (tc) => {
  await tc.step(
    `multiple pipes executing at the end`,
    async () => {
      const echo = mod.spawnable("echo");
      const cat = mod.spawnable("cat");
      const sr = await mod.process(echo)
        .args(`first echo`)
        .pipe(mod.process(cat))
        .stdin("second cat\n")
        .pipe(mod.process(cat))
        .stdin("third cat")
        .execute();
      ta.assertEquals(
        new TextDecoder().decode(sr.stdout),
        `first echo\nsecond cat\nthird cat`,
      );
    },
  );
});

Deno.test(`SpawnableProcessCell`, async (tc) => {
  // spawnableSqlite3 can be safely reused
  const spawnableSqlite3 = mod.spawnable("sqlite3");

  await tc.step(
    `untyped sqlite3 idemptency`,
    async () => {
      const sqlite3 = mod.content()
        .content("bad sql") // prepare STDIN
        .pipe(mod.process(spawnableSqlite3)); // use STDIN for sqlite3

      ta.assertEquals(sqlite3.executionState(), "not-executed");
      const p1 = await sqlite3.execute();
      ta.assertEquals(sqlite3.executionState(), "executed");

      ta.assertEquals(p1.code, 1);
      ta.assert(
        new TextDecoder().decode(p1.stderr).startsWith(
          `Parse error near line 1: near "bad": syntax error`,
        ),
      );

      // if sqlite3 is idempotent, then it will not run again but return previous result
      const p2 = await sqlite3.execute();
      ta.assertEquals(p2.code, 1);
      ta.assert(
        new TextDecoder().decode(p2.stderr).startsWith(
          `Parse error near line 1: near "bad": syntax error`,
        ),
      );
    },
  );

  await tc.step(
    `untyped sqlite3 spawnable process with single piped content`,
    async () => {
      const p = await mod.content()
        .content("bad sql")
        .pipe(mod.process(spawnableSqlite3))
        .execute();
      ta.assertEquals(p.code, 1);
      ta.assert(
        new TextDecoder().decode(p.stderr).startsWith(
          `Parse error near line 1: near "bad": syntax error`,
        ),
      );
    },
  );

  await tc.step(
    `untyped sqlite3 spawnable process with direct SQL`,
    async () => {
      const p = await mod.process(spawnableSqlite3)
        .stdin("bad sql")
        .execute();
      ta.assertEquals(p.code, 1);
      ta.assert(
        new TextDecoder().decode(p.stderr).startsWith(
          `Parse error near line 1: near "bad": syntax error`,
        ),
      );
    },
  );
});

Deno.test(`SqliteCell type-safe sqlite3 spawnable process`, async (tc) => {
  const syntheticSqlDDL = uws(`
  CREATE TABLE synthetic_table(
    column1 text,
    column2 integer
  );`);

  await tc.step(`create in memory should fail`, async () => {
    const result = await mod.sqlite3({
      sqlSupplier: `bad SQL`,
    }).execute();
    ta.assertEquals(result.code, 1);
    ta.assert(
      new TextDecoder().decode(result.stderr).startsWith(
        `Parse error near line 1: near "bad": syntax error`,
      ),
    );
  });

  await tc.step(`create in memory should succeed`, async () => {
    const result = await mod.sqlite3().SQL(
      syntheticSqlDDL,
    ).execute();
    ta.assertEquals(result.code, 0);
  });

  await tc.step(
    `create in memory, emit SQL, and go back into memory should succeed`,
    async () => {
      const ddlResult = await mod.sqlite3().SQL(syntheticSqlDDL).pragma({
        dump: true,
      }).text();
      ta.assert(ddlResult);

      const finalResult = await mod.sqlite3({ sqlSupplier: ddlResult })
        .SQL(
          uws(`
        insert into synthetic_table VALUES ('test', 1);
        select count(*) from synthetic_table;
      `),
        ).execute();
      ta.assertEquals(finalResult.code, 0);
      ta.assertEquals(finalResult.stdout, new TextEncoder().encode("1\n"));
    },
  );

  await tc.step(
    `create in memory, emit SQL, and retrieve JSON from new database should succeed`,
    async () => {
      const json = await mod.sqlite3()
        .SQL(syntheticSqlDDL)
        .pragma({ dump: true })
        .pipe(mod.sqlite3())
        .SQL(uws(`
              insert into synthetic_table VALUES ('test', 1);
              select * from synthetic_table;`))
        .outputJSON()
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
      const json = await mod.process(mod.spawnable("sqlite3"))
        .stdin(syntheticSqlDDL)
        .stdin("\n.dump")
        .pipe(mod.sqlite3({ outputJSON: true }))
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
