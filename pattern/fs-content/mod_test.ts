import { testingAsserts as ta } from "../../deps-test.ts";
import { path } from "../../deps.ts";
import * as cmdNB from "../../lib/notebook/command.ts";
import * as SQLa from "../../render/mod.ts";
import * as mod from "./mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

Deno.test("migration and typical mutations", async () => {
  const sno = mod.prepareOrchestrator();

  // deno-fmt-ignore
  const sql = sno.nbh.SQL`
    -- construct all information model objects (initialize the database)
    ${(await sno.constructionNBF.SQL({ separator: sno.separator }))}

    -- store all SQL that is potentially reusable in the database
    ${(await sno.storeNotebookCellsDML())}

    ${(await sno.mutationNBF.SQL({ separator: sno.separator }, "mimeTypesSeedDML", "SQLPageSeedDML", "insertFsContent"))}

    -- TODO: now "run" whatever SQL we want
    `;

  // enable the following if you want to debug the output in SQLite, otherwise it will be :memory:
  // const sqlite3 = () => cmdNB.sqlite3({ filename: "fs-content-mod_test.ts.sqlite.db" });
  const sqlite3 = () => cmdNB.sqlite3();
  const renderSQL = () =>
    SQLa.RenderSqlCommand.renderSQL((sts) => sts.SQL(sno.nbh.emitCtx));

  // we're using the Command Notebook pattern where each cell is a chainable command with piping
  const sr = await renderSQL()
    .SQL(sql)
    .pipe(sqlite3())
    .execute();
  if (sr.code != 0) {
    const sc = cmdNB.spawnedContent(sr);
    Deno.writeTextFileSync(
      path.fromFileUrl(
        import.meta.resolve("./DELETE_ME_DEBUG_mod_test-error.ts.sql"),
      ),
      sql.SQL(sno.nbh.emitCtx),
    );
    console.log(sc.errText());
  }
  ta.assertEquals(sr.code, 0);
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
