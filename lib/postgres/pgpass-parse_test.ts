import * as ta from "https://deno.land/std@0.173.0/testing/asserts.ts";
import { fromFileUrl } from "https://deno.land/std@0.173.0/path/mod.ts";
import * as mod from "./pgpass-parse.ts";

Deno.test("parse pgpass.golden", async () => {
  const { conns, connsDict, issues } = await mod.parse(
    fromFileUrl(import.meta.resolve("./pgpass.golden")),
  );

  ta.assertEquals(Array.from(connsDict.keys()), [
    "MY_SPECIAL_DB",
    "MY_SPECIAL_DB2",
  ]);
  ta.assertEquals(conns, [
    {
      index: 0,
      connDescr: {
        vendor: "PostgreSQL",
        provenance: ".pgpass",
        id: "MY_SPECIAL_DB",
        description: "Human-friendly description of database",
        boundary: "Network",
        srcLineNumber: 34,
      },
      host: "192.168.2.24",
      port: 5432,
      database: "pgDB_name",
      username: "pgDB_username",
      password: "sup3rSecure!",
      connURL:
        "postgres://pgDB_username:sup3rSecure!@192.168.2.24:5432/pgDB_name",
      srcLineNumber: 35,
    },
    {
      index: 1,
      connDescr: {
        vendor: "PostgreSQL",
        provenance: ".pgpass",
        id: "MY_SPECIAL_DB2",
        description: "Human-friendly description of database 2",
        boundary: "Network",
        srcLineNumber: 37,
      },
      host: "192.168.2.24",
      port: 5033,
      database: "pgDB2_name",
      username: "pgDB2_username",
      password: "sup3rSecure!",
      connURL:
        "postgres://pgDB2_username:sup3rSecure!@192.168.2.24:5033/pgDB2_name",
      srcLineNumber: 38,
    },
  ]);
  ta.assertEquals(issues.length, 3);
  ta.assertEquals(issues[0], {
    message: "conn has no descriptor preceding it.",
    srcLineNumber: 41,
  });
  ta.assertEquals(
    issues[1].message,
    'Unable to parse conn descriptor:  { badID: "MY_SPECIAL_DB2", description: "Human-friendly description of database 4", boundary: "Network" }',
  );
  ta.assert(issues[1].error);
  ta.assertEquals(issues[2].srcLineNumber, 45);
  ta.assertEquals(issues[2], {
    message: "conn has no descriptor preceding it.",
    srcLineNumber: 45,
  });
});
