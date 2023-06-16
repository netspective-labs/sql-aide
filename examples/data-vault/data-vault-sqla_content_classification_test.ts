import $ from "https://deno.land/x/dax@0.30.1/mod.ts";
import { testingAsserts as ta } from "../../deps-test.ts";

const relativeFilePath = (name: string) => {
  const absPath = $.path.fromFileUrl(import.meta.resolve(name));
  return $.path.relative(Deno.cwd(), absPath);
};

const relativeFileContent = (name: string) => {
  const absPath = $.path.fromFileUrl(import.meta.resolve(name));
  return Deno.readTextFileSync($.path.relative(Deno.cwd(), absPath));
};

Deno.test("Content Classification Datavault", async (tc) => {
  const CLI = relativeFilePath("./data-vault-sqla_content_classification.ts");

  await tc.step("CLI's SQL", async () => {
    const output = (await $`./${CLI} sql`.text()).trim();
    const fixtureContent = relativeFileContent(
      "./data-vault-sqla_content_classification_test.fixture.sql",
    ).trim();
    ta.assertEquals(output, fixtureContent);
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
