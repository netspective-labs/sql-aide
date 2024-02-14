import { assertEquals, path } from "./deps-test.ts";
import * as mod from "./protocol.ts";

Deno.test("TAP untyped diagnostics content generator (custom subtests)", async () => {
  const fixture01 = new mod.TapContentBuilder();
  const { bb, bb: { factory: f } } = fixture01;

  // Use "compose" to mix Promise / non-Promise suite elements and let the
  // library take care of preparing test cases in the order they're defined.
  await bb.compose(
    f.comment("comment at top of file"),
    f.okParent("Input file opened (with subtests)", {
      subtests: async (sb) => {
        await sb.ok("sub 1");
        await sb.notOk("sub 2", {
          diagnostics: {
            message: "sub 2 invalid",
            severity: "fatal",
          },
        });
        return {
          body: sb.content,
          title: "Input file opened (with subtests)",
          plan: sb.plan(),
        };
      },
    }),
    f.notOk("First line of the input valid", {
      diagnostics: {
        message: "First line invalid",
        severity: "fail",
        data: {
          got: "Flirble",
          expect: "Fnible",
        },
      },
    }),
  );

  // Use the promise version in case you want more control
  await bb.ok("Read the rest of the file");
  bb.comment("comment 2");
  await bb.notOk("Summarized correctly", {
    todo: "Not written yet",
    diagnostics: {
      message: "Can't make summary yet",
      severity: "todo",
    },
  });

  assertEquals(
    await Deno.readTextFile(
      path.fromFileUrl(import.meta.resolve("./protocol_test-fixture-01.tap")),
    ),
    mod.stringify(fixture01.tapContent()),
  );
});

Deno.test("TAP untyped diagnostics content generator (simple subtests)", async () => {
  const fixture01 = new mod.TapContentBuilder();
  const { bb, bb: { factory: f } } = fixture01;

  // Use "compose" to mix Promise / non-Promise suite elements and let the
  // library take care of preparing test cases in the order they're defined.
  await bb.compose(
    f.comment("comment at top of file"),
    f.okParent("Input file opened (with subtests)", (sb) => {
      sb.ok("sub 1");
      sb.notOk("sub 2", {
        diagnostics: {
          message: "sub 2 invalid",
          severity: "fatal",
        },
      });
    }),
    f.notOk("First line of the input valid", {
      diagnostics: {
        message: "First line invalid",
        severity: "fail",
        data: {
          got: "Flirble",
          expect: "Fnible",
        },
      },
    }),
  );

  // Use the promise version in case you want more control
  await bb.ok("Read the rest of the file");
  bb.comment("comment 2");
  await bb.notOk("Summarized correctly", {
    todo: "Not written yet",
    diagnostics: {
      message: "Can't make summary yet",
      severity: "todo",
    },
  });

  assertEquals(
    await Deno.readTextFile(
      path.fromFileUrl(import.meta.resolve("./protocol_test-fixture-01.tap")),
    ),
    mod.stringify(fixture01.tapContent()),
  );
});

Deno.test("TAP typed diagnostics content generator", async () => {
  const fixture01 = new mod.TapContentBuilder<
    string,
    { message: string; severity?: string }
  >();
  const { bb } = fixture01;

  // Use "populate" to yield only type-safe test cases and content
  await bb.populate(
    async function* (f) {
      yield f.comment("comment at top of file");

      yield await f.okParent("Input file opened (with subtests)", {
        subtests: async (sb) => {
          await sb.ok("sub 1");
          await sb.notOk("sub 2", {
            diagnostics: {
              message: "sub 2 invalid",
              severity: "fatal",
            },
          });
          return {
            body: sb.content,
            title: "Input file opened (with subtests)",
            plan: sb.plan(),
          };
        },
      });
    },
  );

  // Use "populateCustom" to yield only type-safe test cases and content when
  // the diagnostics might be different for specific cases
  await bb.populateCustom<
    string,
    { message: string; severity?: string; data?: mod.Diagnostics }
  >(
    async function* (f) {
      yield f.notOk("First line of the input valid", {
        diagnostics: {
          message: "First line invalid",
          severity: "fail",
          data: {
            got: "Flirble",
            expect: "Fnible",
          },
        },
      });
    },
  );

  // Use the promise version in case you want more control
  await bb.ok("Read the rest of the file");
  bb.comment("comment 2");
  await bb.notOk("Summarized correctly", {
    todo: "Not written yet",
    diagnostics: {
      message: "Can't make summary yet",
      severity: "todo",
    },
  });

  assertEquals(
    await Deno.readTextFile(
      path.fromFileUrl(import.meta.resolve("./protocol_test-fixture-01.tap")),
    ),
    mod.stringify(fixture01.tapContent()),
  );
});
