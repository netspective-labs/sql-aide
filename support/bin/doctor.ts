#!/usr/bin/env -S deno run --allow-all

import * as colors from "https://deno.land/std@0.190.0/fmt/colors.ts";
import $ from "https://deno.land/x/dax@0.31.1/mod.ts";

export interface DoctorReporter {
  (
    args: {
      ok: string;
    } | {
      warn: string;
    } | {
      suggest: string;
    } | {
      test: () => boolean;
      pass: string;
      fail: string;
    } | {
      expectText: string;
      textNotFound: string;
      pass?: (reporter: {
        expectText: string;
        textNotFound: string;
      }) => string;
    },
  ): void;
}

export interface DoctorDiagnostic {
  readonly diagnose: (report: DoctorReporter) => Promise<void>;
}

export interface DoctorCategory {
  readonly label: string;
  readonly diagnostics: () => Generator<DoctorDiagnostic, void>;
}

export function doctorCategory(
  label: string,
  diagnostics: () => Generator<DoctorDiagnostic, void>,
): DoctorCategory {
  return {
    label,
    diagnostics,
  };
}

export function denoDoctor(): DoctorCategory {
  return doctorCategory("Deno", function* () {
    const deno: DoctorDiagnostic = {
      diagnose: async (report: DoctorReporter) => {
        report({ ok: (await $`deno --version`.text()).split("\n")[0] });
      },
    };
    yield deno;
  });
}

/**
 * Doctor task legend:
 * - 🚫 is used to indicate a warning or error and should be corrected
 * - 💡 is used to indicate an (optional) _suggestion_
 * - 🆗 is used to indicate success
 * @param categories
 * @returns
 */
export function doctor(categories: () => Generator<DoctorCategory>) {
  return async () => {
    for (const cat of categories()) {
      console.info(colors.dim(cat.label));
      for (const diag of cat.diagnostics()) {
        await diag.diagnose((options) => {
          if ("expectText" in options) {
            if (options.expectText && options.expectText.trim().length > 0) {
              console.info(
                "  🆗",
                colors.green(options.pass?.(options) ?? options.expectText),
              );
            } else {
              console.warn("  🚫", colors.brightRed(options.textNotFound));
            }
          } else if ("test" in options) {
            if (options.test()) {
              console.info("  🆗", colors.green(options.pass));
            } else {
              console.warn("  🚫", colors.brightRed(options.fail));
            }
          } else if ("suggest" in options) {
            console.info("  💡", colors.yellow(options.suggest));
          } else {
            if ("ok" in options) {
              console.info("  🆗", colors.green(options.ok));
            } else {
              console.warn("  🚫", colors.brightRed(options.warn));
            }
          }
        });
      }
    }
  };
}

export const checkup = doctor(function* () {
  yield doctorCategory("Git dependencies", function* () {
    yield {
      diagnose: async (report) => {
        const hooksPath =
          (await $`git config core.hooksPath`.noThrow().text()).split("\n")[0];
        if (hooksPath.trim().length > 0) {
          const hooks =
            await $`find ${hooksPath} -maxdepth 1 -type f -executable`.noThrow()
              .text();
          for (const hook of hooks.split("\n")) {
            report({
              expectText: hook,
              textNotFound: "this should never happen",
            });
          }
        } else {
          report({
            expectText: hooksPath,
            textNotFound: "Git hooks not setup, run `deno task init`",
          });
        }
      },
    };
  });
  yield doctorCategory("Runtime dependencies", function* () {
    yield* denoDoctor().diagnostics();
    yield {
      // deno-fmt-ignore
      diagnose: async (report) => {
        report({
          expectText: (await $`sqlite3 --version`.noThrow().text()).split("\n")[0],
          textNotFound: "SQLite not found in PATH, install it",
          pass: (args) => `SQLite ${args.expectText.split(' ')[0]}` });
        report({ expectText: (await $`psql --version`.noThrow().text()).split("\n")[0], textNotFound: "PostgreSQL psql not found in PATH, install it" });
      },
    };
  });
  yield doctorCategory("Build dependencies", function* () {
    yield {
      // deno-fmt-ignore
      diagnose: async (report) => {
        report({ expectText: (await $`dot -V`.noThrow().captureCombined()).combined.split("\n")[0], textNotFound: "graphviz dot not found in PATH, install it" });
        report({ expectText: (await $`java --version`.noThrow().text()).split("\n")[0], textNotFound: "java not found in PATH, install it" });
        report({ expectText: (await $`java -jar support/bin/plantuml.jar -version`.noThrow().text()).split("\n")[0], textNotFound: `plantuml.jar not found in support/bin` });
      },
    };
  });
});

if (import.meta.main) {
  await checkup();
}
