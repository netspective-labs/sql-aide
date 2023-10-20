import { testingAsserts as ta } from "../../deps-test.ts";
import { path } from "../../deps.ts";
import * as ft from "../../lib/universal/flexible-text.ts";
import * as sh from "../../lib/sqlite/shell.ts";
import * as SQLa from "../../render/mod.ts";
import * as mod from "./notebooks.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

class SqliteError extends Error {
  constructor(readonly sql: ft.FlexibleTextSupplierSync, message: string) {
    super(message);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SqliteError);
    }

    this.name = "SqliteError";
  }
}

async function execDbQueryResult<Shape>(
  sql: ft.FlexibleTextSupplierSync,
  sqliteDb?: string,
) {
  let sqliteErr: SqliteError | undefined = undefined;
  const scaj = await sh.sqliteCmdAsJSON<Shape>(
    sqliteDb ?? ":memory:",
    sql,
    {
      onError: (escResult) => {
        sqliteErr = new SqliteError(sql, escResult.stderr());
        return undefined;
      },
    },
  );
  return sqliteErr ?? scaj;
}

export const sqlPkgExtnLoadSqlSupplier = (
  extnIdentity: string,
): SQLa.SqlTextBehaviorSupplier<Any> => {
  const sqlPkgHome = Deno.env.has("SQLPKG_HOME")
    ? Deno.env.get("SQLPKG_HOME")
    : path.fromFileUrl(
      import.meta.resolve(`../../support/bin/sqlpkg`),
    );
  return {
    executeSqlBehavior: () => {
      return {
        SQL: () => `.load ${sqlPkgHome}/${extnIdentity}`,
      };
    },
  };
};

Deno.test("migration notebooks", async () => {
  const ctx = SQLa.typicalSqlEmitContext();
  const nbh = new mod.SqlNotebookHelpers<typeof ctx>({
    loadExtnSQL: sqlPkgExtnLoadSqlSupplier,
    execDbQueryResult,
  });
  const sno = new mod.SqlNotebooksOrchestrator(nbh);

  // deno-fmt-ignore
  const sql = nbh.SQL`
    ${(await sno.cnf.SQL({ separator: sno.separator }))}

    ${(await sno.mnf.SQL({ separator: sno.separator }))}
    `.SQL(ctx);

  // TODO: figure out why running this creates a `stdout;` file in current working directory
  const edbqr = await execDbQueryResult(
    sql,
    //"fs-content-mod_test.ts.sqlite.db",
  );
  if (edbqr instanceof SqliteError) {
    ta.assertNotInstanceOf(
      edbqr,
      SqliteError,
      edbqr.message,
    );
    console.error(sql);
  }
});

// TODO: create file generator testing!?
/*
import * as fs from 'fs/promises';
import * as path from 'path';

// Define a Plugin Interface
interface FileGeneratorPlugin {
  generate(outputPath: string, options: any): Promise<void>;
}

// Create a FileGenerator class to manage plugins
class FileGenerator {
  private plugins: Record<string, FileGeneratorPlugin> = {};
  private generatedFiles: string[] = [];

  constructor(private outputDir: string) {}

  // Register a plugin for a specific file type
  registerPlugin(fileType: string, plugin: FileGeneratorPlugin) {
    this.plugins[fileType] = plugin;
  }

  // Generate a file of a specific type using a registered plugin
  async generateFile(outputPath: string, fileType: string, options: any) {
    const plugin = this.plugins[fileType];
    if (!plugin) {
      throw new Error(`No plugin registered for ${fileType}`);
    }

    const fullOutputPath = path.join(this.outputDir, outputPath);
    await fs.mkdir(path.dirname(fullOutputPath), { recursive: true });
    await plugin.generate(fullOutputPath, options);
    this.generatedFiles.push(fullOutputPath);
  }

  // Get the list of generated files
  getGeneratedFiles() {
    return this.generatedFiles;
  }
}

// Implement specific file generator plugins

// Example Markdown Plugin
class MarkdownGenerator implements FileGeneratorPlugin {
  async generate(outputPath: string, options: any) {
    // Generate Markdown content and write it to the specified outputPath.
    await fs.writeFile(outputPath, '# Example Markdown Content');
  }
}

// Example HTML Plugin
class HTMLGenerator implements FileGeneratorPlugin {
  async generate(outputPath: string, options: any) {
    // Generate HTML content and write it to the specified outputPath.
    await fs.writeFile(outputPath, '<html><body><h1>Example HTML Content</h1></body></html>');
  }
}

// Create an instance of FileGenerator
const outputDirectory = 'output';
const fileGenerator = new FileGenerator(outputDirectory);

// Register plugins for various file types
fileGenerator.registerPlugin('markdown', new MarkdownGenerator());
fileGenerator.registerPlugin('html', new HTMLGenerator());

// Generate files based on options
(async () => {
  try {
    const options = {
      fileCounts: {
        markdown: 5,
        html: 3,
      },
      subdirectoryDepth: 2,
    };

    for (const fileType of Object.keys(options.fileCounts)) {
      const count = options.fileCounts[fileType];
      for (let i = 0; i < count; i++) {
        const filePath = `${fileType}/file${i}.${fileType}`;
        await fileGenerator.generateFile(filePath, fileType, {});
      }
    }

    const generatedFiles = fileGenerator.getGeneratedFiles();
    console.log('Generated Files:', generatedFiles);
  } catch (error) {
    console.error(error);
  }
})();
*/
