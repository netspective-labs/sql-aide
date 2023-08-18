import { assert, assertEquals } from "./deps-test.ts";
import {
  LocalDirectory,
  LocalFile,
  localFsEntry,
  LocalMutableDirectory,
  LocalMutableFile,
} from "./local-fs.ts";
import { streamFromText, textFromStream } from "./content.ts";

async function generateTestFiles(testDirRootPath: string, depth: number) {
  // Check if the directory already exists and remove it
  try {
    await Deno.stat(testDirRootPath);
    await Deno.remove(testDirRootPath, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error; // Rethrow any errors other than NotFound
    }
  }

  // Create the root directory
  await Deno.mkdir(testDirRootPath, { recursive: true });

  const generated = {
    directories: [] as string[],
    files: [] as string[],
    canonicalPath: testDirRootPath,
    cleanup: async function () {
      await Deno.remove(testDirRootPath, { recursive: true });
    },
    fsEntry: function (relativePath: string) {
      return localFsEntry(`${testDirRootPath}/${relativePath}`);
    },
  };

  // Inner function for recursive directory and file creation
  async function recursiveGenerate(path: string, currentDepth: number) {
    if (currentDepth === 0) return;

    // Create a random number of directories and files
    const dirCount = Math.floor(Math.random() * 5) + 1;
    const fileCount = Math.floor(Math.random() * 5) + 1;

    for (let i = 0; i < dirCount; i++) {
      const dirPath = `${path}/dir${i}`;
      generated.directories.push(dirPath);
      await Deno.mkdir(dirPath);
      await recursiveGenerate(dirPath, currentDepth - 1);
    }

    for (let i = 0; i < fileCount; i++) {
      const filePath = `${path}/file${i}.txt`;
      generated.files.push(filePath);
      await Deno.writeTextFile(filePath, `This is file ${i}`);
    }
  }

  // Start the recursive generation
  await recursiveGenerate(testDirRootPath, depth);

  return generated;
}

Deno.test("LocalFile read content", async () => {
  const testResources = await generateTestFiles("./testDir", 2);

  const file = new LocalFile(testResources.fsEntry("file0.txt"));

  // Using content method
  const content = await file.content();
  const textFromContent = new TextDecoder().decode(content);

  // Using text method
  const textFromTextMethod = await file.text();

  // Using reader method
  const textFromReader = await textFromStream(await file.readable());

  // Assert that all methods return the same result
  assertEquals(textFromContent, "This is file 0");
  assertEquals(textFromTextMethod, "This is file 0");
  assertEquals(textFromReader, "This is file 0");

  // Cleanup
  await testResources.cleanup();
});

Deno.test("LocalMutableFile write content", async () => {
  const testResources = await generateTestFiles("./testDir", 2);

  const newText = "Updated content";
  const file = new LocalMutableFile(testResources.fsEntry("file1.txt"));
  await streamFromText(newText).pipeTo(
    await file.writable(),
  );
  const updatedContent = await Deno.readTextFile(
    testResources.fsEntry("file1.txt").canonicalPath,
  );
  assertEquals(updatedContent, newText);

  // Cleanup
  await testResources.cleanup();
});

Deno.test("LocalDirectory list files", async () => {
  const testResources = await generateTestFiles("./testDir", 2);

  const dir = new LocalDirectory(testResources.fsEntry(""));
  const files: LocalFile[] = [];
  for await (const file of dir.files()) {
    files.push(file);
  }
  assert(files.length > 0);

  // Cleanup
  await testResources.cleanup();
});

Deno.test("MutableLocalDirectory add file and directory", async () => {
  const testResources = await generateTestFiles("./testMutableDir", 2);

  const mutableDir = new LocalMutableDirectory(testResources.fsEntry(""));

  // Add a new file
  const newFile = new LocalMutableFile(testResources.fsEntry("newFile.txt"));
  await streamFromText("This is a new file").pipeTo(
    await newFile.writable(),
  );
  await mutableDir.add(newFile);

  // Verify the new file was added
  const newFileContent = await Deno.readTextFile(
    testResources.fsEntry("newFile.txt").canonicalPath,
  );
  assertEquals(newFileContent, "This is a new file");

  // Add a new directory
  const newDir = new LocalDirectory(testResources.fsEntry("newDir"));
  await mutableDir.add(newDir);

  // Verify the new directory was added
  const newDirStat = await Deno.stat(
    testResources.fsEntry("newDir").canonicalPath,
  );
  assert(newDirStat.isDirectory);

  // Cleanup
  await testResources.cleanup();
});
