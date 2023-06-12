import { testingAsserts as ta } from "../../deps-test.ts";
import { persistCmdOutput, textFilesPersister } from "./persist-content.ts";

Deno.test("persistCmdOutput and textFilesPersister", async () => {
  const persistEncountered: { destFile: string; content: string }[] = [];
  const persister = textFilesPersister({
    destPath: () => "output.txt",
    content: async function* () {
      const provenance = { source: "echo hello" };
      yield {
        ...persistCmdOutput({
          provenance: () => provenance,
          basename: () => "hello.txt",
        }),
        // deno-lint-ignore require-await
        content: async () => ({ provenance, text: `hello` }),
      };
    },
    // we're simulating writing to we're just putting it in RAM right now
    // deno-lint-ignore require-await
    persist: async (destFile, content) => {
      persistEncountered.push({ destFile, content });
    },
  });
  const emitted = await persister.emitAll();
  ta.assertEquals(
    emitted.map((e) => ({ destFile: e.destFile, content: e.text })),
    persistEncountered,
  );
  ta.assertEquals(persistEncountered, [{
    destFile: "output.txt",
    content: "hello",
  }]);
});
