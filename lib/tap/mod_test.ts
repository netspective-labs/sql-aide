import { assertEquals, path } from "./deps-test.ts";
import * as mod from "./mod.ts";

Deno.test("TAP content generator", async () => {
  const fixture01 = (await mod.TapContentBuilder.create()
    .populate(async (bb) => {
      const { factory: f } = bb;
      await bb.compose(
        f.comment("comment at top of file"),
        f.ok("Input file opened (with subtests)", {
          subtests: async (sb) => {
            await sb.ok("sub 1");
            await sb.notOk("sub 2", {
              diagnostic: {
                message: "sub 2 invalid",
                severity: "fatal",
              },
            });
            return {
              body: sb.content,
              title: "subtests",
              plan: sb.plan(),
            };
          },
        }),
        f.notOk("First line of the input valid", {
          diagnostic: {
            message: "First line invalid",
            severity: "fail",
            data: {
              got: "Flirble",
              expect: "Fnible",
            },
          },
        }),
      );
      await bb.ok("Read the rest of the file");
      bb.comment("comment 2");
      await bb.notOk("Summarized correctly", {
        todo: "Not written yet",
        diagnostic: {
          message: "Can't make summary yet",
          severity: "todo",
        },
      });
    }))
    .tapContent();

  const tapOutput01 = mod.stringify(fixture01);
  assertEquals(
    await Deno.readTextFile(
      path.fromFileUrl(import.meta.resolve("./fixture-01.tap")),
    ),
    tapOutput01,
  );
});
