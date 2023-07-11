import { testingAsserts as ta } from "../../deps-test.ts";
import $ from "https://deno.land/x/dax@0.30.1/mod.ts";
import { sqlDDL } from "./ia-example.omc.sqla.ts";
import * as typical from "../../pattern/typical/mod.ts";

const { SQLa } = typical;

const relativeFilePath = (name: string) => {
  const absPath = $.path.fromFileUrl(import.meta.resolve(name));
  return $.path.relative(Deno.cwd(), absPath);
};

const relativeFileContent = (name: string) => {
  const absPath = $.path.fromFileUrl(import.meta.resolve(name));
  return Deno.readTextFileSync($.path.relative(Deno.cwd(), absPath));
};

export const ddlOptions = SQLa.typicalSqlTextSupplierOptions();
export const ctx = SQLa.typicalSqlEmitContext();
export const SQL = SQLa.SQL<Context>(ddlOptions);
export type Context = typeof ctx;
type EmitContext = typeof ctx;

Deno.test("Infra Assurance CLI", async (tc) => {
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

  await tc.step("CLI bash script generator content", async () => {
    const output = await $`./${CLI} bash`.text();
    ta.assertEquals(
      output,
      relativeFileContent("./ia-example.omc.sqla.fixture.sh"),
    );
  });
});

Deno.test("Infra Assurance Module", async (tc) => {
  await tc.step("CLI SQL content", () => {
    const output = sqlDDL().SQL(ctx);
    ta.assertEquals(
      output,
      relativeFileContent("./ia-example.omc.sqla.fixture.sql"),
    );
  });
});
