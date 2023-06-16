#!/usr/bin/env -S deno run --allow-all

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

Deno.test("ia Omc Example", async (tc) => {
  const CLI = relativeFilePath("./ia-example.omc.sqla.ts");

  await tc.step("CLI SQL content", async () => {
    const output = await $`./${CLI} sql`.text();
    ta.assertEquals(
      output,
      relativeFileContent("./ia-example.omc.sqla.fixture.sql"),
    );
  });

  await tc.step("CLI diagram", async () => {
    const output = await $`./${CLI} diagram`.text();
    ta.assertEquals(
      output,
      relativeFileContent("./ia-example.omc.sqla.fixture.puml"),
    );
  });

  await tc.step("CLI driver content", async () => {
    const output = await $`./${CLI} driver`.text();
    ta.assertEquals(
      output,
      relativeFileContent("./ia-example.omc.sqla.fixture.sh"),
    );
  });
});
