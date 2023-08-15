import { assert, assertEquals } from "./deps-test.ts";
import {
  MemoryDirectory,
  MemoryFile,
  MemoryMutableDirectory,
  MemoryMutableFile,
} from "./memory-fs.ts";

Deno.test("MemoryFile read content", async () => {
  const file = new MemoryMutableFile({ canonicalPath: "/file0.txt" });
  const writer = file.writer();
  await writer.write(new TextEncoder().encode("This is file 0"));

  // Using content method
  const content = await file.content();
  const textFromContent = new TextDecoder().decode(content);

  // Using text method
  const textFromTextMethod = await file.text();

  // Using reader method
  const reader = file.reader();
  const buffer = new Uint8Array(textFromTextMethod.length); // if longer, then zero padded
  await reader.read(buffer);
  const textFromReader = new TextDecoder().decode(buffer).trim();

  // Assert that all methods return the same result
  assertEquals(textFromContent, "This is file 0");
  assertEquals(textFromTextMethod, "This is file 0");
  assertEquals(textFromReader, "This is file 0");
});

Deno.test("MemoryMutableFile write content", async () => {
  const file = new MemoryMutableFile({ canonicalPath: "/file1.txt" });
  const writer = file.writer();
  const newText = "Updated content";
  await writer.write(new TextEncoder().encode(newText));
  const updatedContent = await file.text();
  assertEquals(updatedContent, newText);
});

Deno.test("MemoryDirectory list files", async () => {
  const dir = new MemoryMutableDirectory({ canonicalPath: "/" });
  const file = new MemoryFile({ canonicalPath: "/file2.txt" });
  await dir.add(file);

  const files: MemoryFile[] = [];
  for await (const f of dir.files()) {
    files.push(f);
  }
  assertEquals(files.length, 1);
  assertEquals(await files[0].text(), "");
});

Deno.test("MemoryMutableDirectory add file and directory", async () => {
  const dir = new MemoryMutableDirectory({ canonicalPath: "/" });

  // Add a new file
  const newFile = new MemoryFile({ canonicalPath: "/newFile.txt" });
  await dir.add(newFile);

  // Add a new directory
  const newDir = new MemoryDirectory({ canonicalPath: "/newDir" });
  await dir.add(newDir);

  const entries: unknown[] = [];
  for await (const entry of dir.entries()) {
    entries.push(entry);
  }

  assertEquals(entries.length, 2);
  assert(entries[0] instanceof MemoryFile);
  assert(entries[1] instanceof MemoryDirectory);
});
