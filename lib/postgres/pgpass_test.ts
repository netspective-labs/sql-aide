import * as ta from "https://deno.land/std@0.173.0/testing/asserts.ts";
import { fromFileUrl } from "https://deno.land/std@0.173.0/path/mod.ts";
import $ from "https://deno.land/x/dax@0.24.1/mod.ts";

Deno.test("pgpass test --src ./pgpass.golden", async () => {
  const pgpass = fromFileUrl(import.meta.resolve("./pgpass.ts"));
  const golden = fromFileUrl(import.meta.resolve("./pgpass.golden"));

  // issue messages go to STDOUT, errors (stacks) go to STDERR
  ta.assertEquals(
    await $`${pgpass} test --src=${golden}`.quiet().text(),
    `conn has no descriptor preceding it. (line 41)
Unable to parse conn descriptor:  { badID: "MY_SPECIAL_DB2", description: "Human-friendly description of database 4", boundary: "Network" } (line 44)
conn has no descriptor preceding it. (line 45)`,
  );
});

Deno.test("pgpass ls conn --src ./pgpass.golden", async () => {
  const pgpass = fromFileUrl(import.meta.resolve("./pgpass.ts"));
  const golden = fromFileUrl(import.meta.resolve("./pgpass.golden"));

  ta.assertEquals(
    await $`${pgpass} ls conn --src=${golden} --no-color`.quiet().text(),
    `MY_SPECIAL_DB Human-friendly description of database [192.168.2.24:5432 pgDB_username@pgDB_name]
MY_SPECIAL_DB2 Human-friendly description of database 2 [192.168.2.24:5033 pgDB2_username@pgDB2_name]`,
  );
});

Deno.test("pgpass env --src ./pgpass.golden", async () => {
  const pgpass = fromFileUrl(import.meta.resolve("./pgpass.ts"));
  const golden = fromFileUrl(import.meta.resolve("./pgpass.golden"));

  ta.assertEquals(
    await $`${pgpass} env --src=${golden}`.quiet().text(),
    `export MY_SPECIAL_DB_PGHOST="192.168.2.24"
export MY_SPECIAL_DB_PGPORT="5432"
export MY_SPECIAL_DB_PGDATABASE="pgDB_name"
export MY_SPECIAL_DB_PGUSER="pgDB_username"
export MY_SPECIAL_DB_PGPASSWORD="sup3rSecure!"
export MY_SPECIAL_DB2_PGHOST="192.168.2.24"
export MY_SPECIAL_DB2_PGPORT="5033"
export MY_SPECIAL_DB2_PGDATABASE="pgDB2_name"
export MY_SPECIAL_DB2_PGUSER="pgDB2_username"
export MY_SPECIAL_DB2_PGPASSWORD="sup3rSecure!"`,
  );
});
