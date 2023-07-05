import { testingAsserts as ta } from "../../deps-test.ts";
import * as mod from "./mod.ts";

Deno.test("PgDCP examples", async () => {
  const { path } = mod;
  const persisted: {
    destFile: string;
    content: string;
    isExecutable: boolean;
  }[] = [];
  const persister = mod.pgDcpPersister(mod.persistables(), {
    // usually persist writes files to disk but we're doing a test so we'll just
    // store in RAM to test that they will be written (we're not sure about the
    // content, we just know how many files to expect)
    persist: async () => {},
    reportSuccess: (result) => {
      const { destFile, text } = result;
      persisted.push({
        destFile: path.basename(destFile),
        content: text,
        isExecutable: "isExecutable" in result ? true : false,
      });
    },
  });
  await persister.emitAll();
  ta.assertEquals(persisted.map((p) => [p.destFile, p.isExecutable]), [
    ["000_context.auto.psql", false],
    ["001_engine.auto.psql", false],
    ["002_federated.auto.psql", false],
    ["driver.auto.psql", false],
  ]);
});
