import { build, emptyDir } from "https://deno.land/x/dnt@0.35.0/mod.ts";

await emptyDir("./npm");

await build({
  // TODO: turn off typeCheck while we figure out error:
  //       src/deps/deno.land/x/eventemitter@1.2.4/mod.ts:218:4 - error TS2322: Type 'Timeout | null' is not assignable to type 'number | null'.
  typeCheck: false,

  // disable type checking, testing, declaration emit, and CommonJS/UMD Output
  // because we're targeting ESM
  test: false,
  declaration: false,
  scriptModule: false,

  entryPoints: ["./render/mod.ts"],
  outDir: "./npm",
  shims: {
    // see JS docs for overview and more options
    deno: true,
  },
  package: {
    // package.json properties
    name: "@netspective-labs/nlc-deno-sqla",
    version: Deno.args[0],
    description: "Your package.",
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/netspective-labs/commons.git",
    },
    bugs: {
      url: "https://github.com/netspective-labs/commons/issues",
    },
  },
  postBuild() {
    // steps to run after building and before running the tests
    Deno.copyFileSync("LICENSE", "npm/LICENSE");
    Deno.copyFileSync("README.md", "npm/README.md");
  },
});
