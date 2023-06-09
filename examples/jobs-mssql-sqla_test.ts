import $ from "https://deno.land/x/dax@0.30.1/mod.ts";
import { testingAsserts as ta } from "../deps-test.ts";

const relativeFilePath = (name: string) => {
  const absPath = $.path.fromFileUrl(import.meta.resolve(name));
  return $.path.relative(Deno.cwd(), absPath);
};

const relativeFileContent = (name: string) => {
  const absPath = $.path.fromFileUrl(import.meta.resolve(name));
  return Deno.readTextFileSync($.path.relative(Deno.cwd(), absPath));
};

Deno.test("Jobs Example for Microsoft SQL Server", async (tc) => {
  const CLI = relativeFilePath("./jobs-mssql-sqla.ts");

  await tc.step("01. CLI's SQL", async () => {
    const output = await $`./${CLI} sql`.text();
    ta.assertEquals(
      output,
      relativeFileContent("./jobs-mssql-sqla_test.fixture-01.sql"),
    );
  });

  // TODO:
  // await tc.step("02. CLI's ERD", async () => {
  //   const output = await $`./${CLI} diagram`.text();
  //   ta.assertEquals(
  //     output,
  //     relativeFileContent("./data-vault-sqla_test.fixture-02.puml"),
  //   );
  // });
});
