import {
  Directory,
  File,
  FileSystemEntry,
  FlatFileSystem,
  HierarchicalFileSystem,
  MutableDirectory,
  MutableFile,
} from "./governance.ts";
import { Content, TextContent } from "./content.ts";

export type MemoryFsEntry = FileSystemEntry<string, unknown>;

export class MemoryFile
  implements
    File<MemoryFsEntry, Uint8Array>,
    Content<MemoryFsEntry>,
    TextContent<MemoryFsEntry> {
  protected inMemData: Uint8Array = new Uint8Array();

  constructor(public readonly fsEntry: MemoryFsEntry) {}

  // deno-lint-ignore require-await
  async readable() {
    return this.readableSync();
  }

  readableSync() {
    return new ReadableStream({
      start: (controller) => {
        controller.enqueue(this.inMemData);
        controller.close();
      },
    });
  }

  // deno-lint-ignore require-await
  async content(): Promise<Uint8Array> {
    return this.inMemData;
  }

  // deno-lint-ignore require-await
  async text(): Promise<string> {
    return new TextDecoder().decode(this.inMemData);
  }
}

export class StringFile
  implements
    File<MemoryFsEntry, string>,
    Content<MemoryFsEntry>,
    TextContent<MemoryFsEntry> {
  readonly inMemData: Uint8Array;
  constructor(readonly fsEntry: MemoryFsEntry, readonly inMemString: string) {
    this.inMemData = new TextEncoder().encode(inMemString);
  }

  // deno-lint-ignore require-await
  async readable() {
    return this.readableSync();
  }

  readableSync() {
    return new ReadableStream({
      start: (controller) => {
        controller.enqueue(this.inMemData);
        controller.close();
      },
    });
  }

  // deno-lint-ignore require-await
  async content(): Promise<Uint8Array> {
    return this.inMemData;
  }

  // deno-lint-ignore require-await
  async text(): Promise<string> {
    return this.inMemString;
  }
}

export class MemoryMutableFile extends MemoryFile
  implements MutableFile<MemoryFsEntry, Uint8Array> {
  // deno-lint-ignore require-await
  async writable() {
    return this.writableSync();
  }

  writableSync() {
    return new WritableStream<Uint8Array>({
      write: (chunk) => {
        this.inMemData = new Uint8Array([...this.inMemData, ...chunk]);
      },
    });
  }
}

export class MemoryDirectory implements Directory<MemoryFsEntry, MemoryFile> {
  protected inMemEntries:
    (MemoryFile | Directory<MemoryFsEntry, MemoryFile>)[] = [];

  constructor(public readonly fsEntry: MemoryFsEntry) {}

  async *files<Content extends MemoryFile>(
    options?: Parameters<Directory<MemoryFsEntry, Content>["files"]>[0],
  ): AsyncIterable<Content> {
    for (const entry of this.inMemEntries) {
      if (entry instanceof MemoryFile) {
        let file = entry as Content;
        if (options?.factory) {
          file = options.factory(file);
        }
        if (!options?.filter || options.filter(file) !== false) {
          yield file;
        }
      }
    }
  }

  async *subdirectories(
    options?: Parameters<
      Directory<MemoryFsEntry, MemoryFile>["subdirectories"]
    >[0],
  ): AsyncIterable<Directory<MemoryFsEntry, MemoryFile>> {
    for (const entry of this.inMemEntries) {
      let dir = entry as Directory<MemoryFsEntry, MemoryFile>;
      if (options?.factory) {
        dir = options.factory(dir);
      }
      if (!options?.filter || options.filter(dir) !== false) {
        yield dir;
      }
    }
  }

  async *entries(
    options?: Parameters<Directory<MemoryFsEntry, MemoryFile>["entries"]>[0],
  ): AsyncIterable<MemoryFile | Directory<MemoryFsEntry, MemoryFile>> {
    for (const entry of this.inMemEntries) {
      const instance = options?.factory ? options.factory(entry) : entry;
      if (!options?.filter || options.filter(instance) !== false) {
        yield instance;
      }
    }
  }
}

export class MemoryMutableDirectory extends MemoryDirectory
  implements MutableDirectory<MemoryFsEntry, MemoryFile> {
  // deno-lint-ignore require-await
  async add(
    entry: MemoryFile | Directory<MemoryFsEntry, MemoryFile>,
  ): Promise<boolean> {
    this.inMemEntries.push(entry);
    return true;
  }
}

export class MemoryFileSystem
  implements
    FlatFileSystem<MemoryFsEntry, MemoryFile>,
    HierarchicalFileSystem<MemoryFsEntry, MemoryFile, MemoryDirectory> {
  file(path: MemoryFsEntry): MemoryFile {
    return new MemoryFile(path);
  }

  directory(path?: MemoryFsEntry): MemoryDirectory {
    return new MemoryDirectory(path || { canonicalPath: "/" });
  }
}
