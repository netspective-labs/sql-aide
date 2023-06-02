import $ from "https://deno.land/x/dax@0.30.1/mod.ts";
import { testingAsserts as ta } from "../../deps-test.ts";
import { unindentWhitespace as uws } from "../../lib/universal/whitespace.ts";

const relativeFilePath = (name: string) => {
  const absPath = $.path.fromFileUrl(import.meta.resolve(name));
  return $.path.relative(Deno.cwd(), absPath);
};

Deno.test("psql-style pre-process", async () => {
  const CLI = relativeFilePath("./mod.ts");
  const srcFile = relativeFilePath("./psql/include_test.fixture-01.sql");
  const output = await $`./${CLI} psql ${srcFile}`.text();
  ta.assertEquals(
    output,
    uws(`
          -- fixture-01

          -- \\set name 'John Doe' (variable: name, value: John Doe, srcLine: 3)
          -- \\set table users (variable: table, value: users, srcLine: 4)
          -- \\set unit_test_schema dcp_assurance (variable: unit_test_schema, value: dcp_assurance, srcLine: 5)

          SELECT * FROM users WHERE username = 'John Doe';
          SELECT * FROM users WHERE username = 'John Doe';
          SELECT * FROM "users" WHERE username = 'John Doe';
          SELECT * FROM "users" WHERE username::"varchar" = 'John Doe';
          SELECT email FROM dcp_assurance.upsert_test_user((1, 'Updated Name', 'john.doe@example.com')::"dcp_assurance".test_user);`),
  );
});
