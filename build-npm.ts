import { build, emptyDir } from "https://deno.land/x/dnt@0.35.0/mod.ts";

const pgPath = "./npm/package.json";

// Getting latest package.json version before is being deleted
const { version: pgVersion } = readJSONFileWithFallback(pgPath, {
  version: "0.1.0",
});

await emptyDir("./npm");

await build({
  // TODO: turn off typeCheck while we figure out error:
  //       src/deps/deno.land/x/eventemitter@1.2.4/mod.ts:218:4 - error TS2322: Type 'Timeout | null' is not assignable to type 'number | null'.
  typeCheck: false,

  // disable type checking, testing, declaration emit, and CommonJS/UMD Output
  // because we're targeting ESM
  test: false,
  declaration: true,
  scriptModule: false,

  entryPoints: ["./entry-point.npm.ts"],
  outDir: "./npm",
  shims: {
    // see JS docs for overview and more options
    deno: true,
  },
  package: {
    // package.json properties
    name: "@netspective-labs/nlc-deno-sqla",
    version: pgVersion,
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

    // Adding main property in package.json because DNT is not including it for some reason
    const pg = JSON.parse(Deno.readTextFileSync(pgPath));
    pg.main = pg.module;

    Deno.writeTextFileSync(pgPath, JSON.stringify(pg));

    // Adding .npmrc
    const npmrcContent =
      "@netspective-labs:registry=https://npm.pkg.github.com";
    Deno.writeTextFileSync("./npm/.npmrc", npmrcContent);
  },
});

function readJSONFileWithFallback<T>(filePath: string, fallbackValue: T): T {
  let jsonData: T = fallbackValue;

  try {
    const fileContent = Deno.readTextFileSync(filePath);
    jsonData = JSON.parse(fileContent);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.error(`File not found: '${filePath}'`);
    } else {
      console.error("An error occurred while reading the file:", error);
    }
  }

  return jsonData;
}
