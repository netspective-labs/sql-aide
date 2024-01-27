import { assertEquals, path, tapParser as tp } from "./deps-test.ts";
import * as mod from "./mod.ts";

Deno.test("TAP content generator", async () => {
  const fixture01 = (await new mod.TapContentBuilder()
    .populate((body) => {
      body
        .comment("comment at top of file")
        .ok("Input file opened")
        .notOk("First line of the input valid", {
          diagnostic: {
            message: "First line invalid",
            severity: "fail",
            data: {
              got: "Flirble",
              expect: "Fnible",
            },
          },
        })
        .ok("Read the rest of the file")
        .comment("comment 2")
        .notOk("Summarized correctly", {
          todo: "Not written yet",
          diagnostic: {
            message: "Can't make summary yet",
            severity: "todo",
          },
        });
    }))
    .tapContent();
  const tapOutput01 = mod.stringify(fixture01);

  // now parse the output and see if it was parsed properly
  const parsed01 = tp.Parser.parse(tapOutput01);
  assertEquals(
    await Deno.readTextFile(
      path.fromFileUrl(import.meta.resolve("./fixture-01.tap")),
    ),
    tp.Parser.stringify(parsed01),
  );
});
