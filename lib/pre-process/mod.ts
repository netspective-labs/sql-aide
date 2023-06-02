#!/usr/bin/env -S deno run --allow-all
import * as cli from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";
import * as psql from "./psql/mod.ts";

export * as cli from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";
export * as psql from "./psql/mod.ts";

if (import.meta.main) {
  const script = import.meta.url;
  // deno-fmt-ignore
  await new cli.Command()
    .name(script.slice(script.lastIndexOf("/") + 1))
    .version("0.0.1")
    .description("Preprocess a SQL file and replace variables.")
    .command("help", new cli.HelpCommand().global())
    .command("completions", new cli.CompletionsCommand())
    .command("psql", new cli.Command()
      .description("Preprocess a SQL file similar to how `psql` would process variables and other input.")
      .arguments("<src>")
      .option("-s --src <...psql-file:string>", "additional SQL source file(s)")
      .option("-i --inspect", "show inspection output instead of emitting SQL source")
      .option("--set.* <variable:string>", "--set.XYZ=value would override XYZ with value provided")
      .action((options, src) => {
          const srcFiles = [src, ...(options.src ?? [])];
          for (const srcFile of srcFiles) {
            const pp = psql.psqlPreprocess(
              Deno.readTextFileSync(srcFile),
              options.set && Object.keys(options.set).length > 0 ? {
                setMetaCmd: psql.psqlSetMetaCmd({ overrides: options.set })
              } : undefined,
            );
            if (options?.inspect) {
              console.dir(pp.inspect);
            } else {
              console.log(pp.interpolatedText);
            }
          }
        }))
    // TODO: add other pre-processors like MySQL, ORACLE, SQL*Server, SQLite, etc.
    .parse(Deno.args);
}
