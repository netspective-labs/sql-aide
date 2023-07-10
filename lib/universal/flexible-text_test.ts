import { testingAsserts as ta } from "../../deps-test.ts";
import { flexibleTextList, flexibleTextType } from "./flexible-text.ts";

Deno.test("flexibleTextList - String", () => {
  const input = "SELECT * FROM users;";
  const output = flexibleTextList(input);
  ta.assertEquals(output, [input]);
});

Deno.test("flexibleTextList - Function", () => {
  const input = () => "SELECT * FROM users;";
  const output = flexibleTextList(input);
  ta.assertEquals(output, [input()]);
});

Deno.test("flexibleTextList - Object with fileSystemPath", () => {
  const filepath = "/sql/query.sql";
  const fileContent = "SELECT * FROM users;";
  const input = { fileSystemPath: filepath };
  const output = flexibleTextList(input, {
    readTextFileSync: () => [fileContent],
  });
  ta.assertEquals(output, [fileContent]);
});

Deno.test("flexibleTextType - String", () => {
  const input = "SELECT * FROM users;";
  const output = flexibleTextType(input);
  ta.assertEquals(output, "text");
});

Deno.test("flexibleTextType - Function", () => {
  const input = () => "SELECT * FROM users;";
  const output = flexibleTextType(input);
  ta.assertEquals(output, "text (function result)");
});

Deno.test("flexibleTextType - Object with fileSystemPath", () => {
  const filepath = "/sql/query.sql";
  const input = { fileSystemPath: filepath };
  const output = flexibleTextType(input);
  ta.assertEquals(output, `file ${filepath}`);
});
