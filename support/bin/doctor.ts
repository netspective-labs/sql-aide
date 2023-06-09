#!/usr/bin/env -S deno run --allow-all

import * as colors from "https://deno.land/std@0.190.0/fmt/colors.ts";
import { build$, CommandBuilder } from "https://deno.land/x/dax@0.31.1/mod.ts";

const $ = build$({ commandBuilder: new CommandBuilder().noThrow() });

export type ReportResult = {
  readonly ok: string;
} | {
  readonly warn: string;
} | {
  readonly suggest: string;
};

export interface DoctorReporter {
  (
    args: ReportResult | {
      test: () => ReportResult | Promise<ReportResult>;
    },
  ): Promise<void>;
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
        report({ ok: (await $`deno --version`.lines())[0] });
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
  // deno-lint-ignore require-await
  const report = async (options: ReportResult) => {
    if ("ok" in options) {
      console.info("  🆗", colors.green(options.ok));
    } else if ("suggest" in options) {
      console.info("  💡", colors.yellow(options.suggest));
    } else {
      console.warn("  🚫", colors.brightRed(options.warn));
    }
  };

  return async () => {
    for (const cat of categories()) {
      console.info(colors.dim(cat.label));
      for (const diag of cat.diagnostics()) {
        await diag.diagnose(async (options) => {
          if ("test" in options) {
            try {
              report(await options.test());
            } catch (err) {
              report({ warn: err.toString() });
            }
          } else {
            report(options);
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
        const hooksPath = (await $`git config core.hooksPath`.lines())[0];
        if (hooksPath.trim().length > 0) {
          const hooks =
            await $`find ${hooksPath} -maxdepth 1 -type f -executable`.noThrow()
              .text();
          for (const hook of hooks.split("\n")) {
            report({ test: () => ({ ok: hook }) });
          }
        } else {
          report({
            test: () => ({ warn: "Git hooks not setup, run `deno task init`" }),
          });
        }
      },
    };
  });
  yield doctorCategory("Optional runtime dependencies", function* () {
    yield {
      diagnose: async (report) => {
        await report({
          test: async () => (await $.commandExists("sqlite3")
            ? { ok: `SQLite ${(await $`sqlite3 --version`.lines())[0]}` }
            : { suggest: "SQLite not found in PATH, install it" }),
        });
        await report({
          test: async () => (await $.commandExists("psql")
            ? { ok: (await $`psql --version`.lines())[0] }
            : { suggest: "PostgreSQL psql not found in PATH, install it" }),
        });
      },
    };
  });
  yield doctorCategory("Build dependencies", function* () {
    yield* denoDoctor().diagnostics();
  });
  yield doctorCategory("Optional build dependencies", function* () {
    yield {
      diagnose: async (report) => {
        await report({
          // deno-fmt-ignore
          test: async () => (await $.commandExists("dot")
            ? { ok: (await $`dot -V`.noThrow().captureCombined()).combined.split("\n")[0] }
            : { suggest: "graphviz dot not found in PATH, install it to be able to generate ERDs" }),
        });
        await report({
          // deno-fmt-ignore
          test: async () => (await $.commandExists("java")
            ? { ok: (await $`java --version`.lines())[0] }
            : { suggest: "java not found in PATH, install it to be able to use PlantUML for ERDs" }),
        });
        if (await $.commandExists("java")) {
          await report({
            test:
              // deno-fmt-ignore
              async () => ((await $`java -jar support/bin/plantuml.jar -version`.noThrow().quiet().spawn()).code == 0
                ? { ok: (await $`java -jar support/bin/plantuml.jar -version`.lines())[0] }
                : { suggest: "plantuml.jar not found in support/bin" }),
          });
        }
      },
    };
  });
});

if (import.meta.main) {
  await checkup();
}
