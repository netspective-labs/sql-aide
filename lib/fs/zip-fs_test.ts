import { path } from "../../deps.ts";
import { assert, assertEquals } from "./deps-test.ts";
import { ZipFile, ZipFS } from "./zip-fs.ts";
import JSZip from "npm:jszip";

/**
 * Given a file name, get its current location relative to this test script;
 * useful because unit tests can be run from any directory so we must find
 * the proper location automatically.
 */
const relativeFilePath = (name: string) => {
  const absPath = path.fromFileUrl(import.meta.resolve(name));
  return path.relative(Deno.cwd(), absPath);
};

async function generateTestFiles(testZipFileName: string, depth: number) {
  // Remove the zip file if it exists
  try {
    await Deno.remove(testZipFileName);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      // File not found, which is fine
    } else {
      throw error;
    }
  }

  const zip = new JSZip();
  const directories: string[] = [];
  const files: string[] = [];

  function addDirectory(path: string, currentDepth: number) {
    if (currentDepth > depth) return;
    directories.push(path);
    for (let i = 0; i < 3; i++) {
      const dirPath = `${path}dir${i}/`;
      addDirectory(dirPath, currentDepth + 1);
      const filePath = `${path}file${i}.txt`;
      zip.file(filePath, `Content of ${filePath}`);
      files.push(filePath);
    }
  }

  addDirectory("", 0);

  await Deno.writeFile(
    testZipFileName,
    await zip.generateAsync({ type: "uint8array" }),
  );

  return {
    directories,
    files,
    zipFileName: testZipFileName,
    cleanup: async () => {
      await Deno.remove(testZipFileName);
    },
  };
}

Deno.test("ZipFS - Read File Content from existing fixture", async () => {
  const zipFs = await ZipFS.fromPath(
    relativeFilePath("./zip-fs_test-fixture.zip"),
  );
  const file = zipFs.file({ canonicalPath: "file0.txt" }); // Replace with actual path inside the zip
  const content = await file.text();

  assertEquals(content, "file0.txt content in zip-fs_test-fixture.zip"); // Replace with the actual expected content
});

Deno.test("ZipFS - Full Functionality with generated Zip", async () => {
  const testFiles = await generateTestFiles(
    relativeFilePath("./zip-fs_test-synthetic.zip"),
    2,
  );
  const zipFs = await ZipFS.fromPath(testFiles.zipFileName);

  for (const dir of testFiles.directories) {
    const directory = zipFs.directory({ canonicalPath: dir });

    // Assertion: Directory should exist
    assert(directory !== null, `Directory ${dir} should exist`);

    // Collect files and subdirectories from the directory
    const files: string[] = [];
    const subdirs: string[] = [];
    for await (const entry of directory.entries()) {
      if (entry instanceof ZipFile) {
        files.push(entry.fsEntry.canonicalPath);
      } else {
        subdirs.push(entry.fsEntry.canonicalPath);
      }
    }

    // Assertion: Directory should contain the expected files
    for (let i = 0; i < 3; i++) {
      const expectedFilePath = `${dir}file${i}.txt`;
      assert(
        files.includes(expectedFilePath),
        `Directory ${dir} should contain file ${expectedFilePath}`,
      );
    }

    // Assertion: Directory should contain the expected subdirectories (up to the specified depth)
    if (dir.split("/").length - 1 < 2) { // Adjust based on depth
      for (let i = 0; i < 3; i++) {
        const expectedSubdirPath = `${dir}dir${i}/`;
        assert(
          subdirs.includes(expectedSubdirPath),
          `Directory ${dir} should contain subdirectory ${expectedSubdirPath}`,
        );
      }
    }
  }

  for (const file of testFiles.files) {
    const fileInstance = zipFs.file({ canonicalPath: file });
    const content = await fileInstance.text();
    assertEquals(content, `Content of ${file}`);
  }

  await testFiles.cleanup();
});
