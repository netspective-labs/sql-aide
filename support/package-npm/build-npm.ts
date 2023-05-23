import $ from "https://deno.land/x/dax@0.30.1/mod.ts";
import { build, emptyDir } from "https://deno.land/x/dnt@0.36.0/mod.ts";

const relativeFilePath = (name: string) => {
  const absPath = $.path.fromFileUrl(import.meta.resolve(name));
  return $.path.relative(Deno.cwd(), absPath);
};

// get the latest tag and use that as the version so it matches Deno
const version =
  await $`git describe --tags ${await $`git rev-list --tags --max-count=1`
    .text()}`.text();
const outDir = relativeFilePath("./npm");
await emptyDir(outDir);

await build({
  // TODO: turn off typeCheck while we figure out error:
  //       src/deps/deno.land/x/eventemitter@1.2.4/mod.ts:218:4 - error TS2322: Type 'Timeout | null' is not assignable to type 'number | null'.
  typeCheck: false,

  // disable type checking, testing, declaration emit, and CommonJS/UMD Output
  // because we're targeting ESM
  test: false,
  declaration: false,
  scriptModule: false,

  entryPoints: [relativeFilePath("./entry-point.npm.ts")],
  outDir,
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
    Deno.copyFileSync(relativeFilePath("../../LICENSE"), `${outDir}/LICENSE`);
    Deno.copyFileSync(
      relativeFilePath("../../README.md"),
      `${outDir}/README.md`,
    );

    // Adding main property in package.json because DNT is not including it for some reason
    const pjPath = `${outDir}/package.json`;
    const packageJSON = JSON.parse(Deno.readTextFileSync(pjPath));

    packageJSON.main = packageJSON.module;

    // Adding latest version to package.json (if we don't to this, version property won't be included at all)
    packageJSON.version = version;

    Deno.writeTextFileSync(
      pjPath,
      JSON.stringify(packageJSON, undefined, "  "),
    );

    // Adding .npmrc
    const npmrcContent =
      "@netspective-labs:registry=https://npm.pkg.github.com";
    Deno.writeTextFileSync(`${outDir}/.npmrc`, npmrcContent);
  },
});
