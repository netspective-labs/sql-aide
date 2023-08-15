import {
  Content,
  Directory,
  File,
  FileSystem,
  FileSystemEntry,
  MutableDirectory,
  MutableFile,
  TextContent,
} from "./governance.ts";

export type MemoryFsEntry = FileSystemEntry<string>;

export class MemoryFile
  implements
    File<MemoryFsEntry>,
    Content<MemoryFsEntry>,
    TextContent<MemoryFsEntry> {
  protected inMemData: Uint8Array = new Uint8Array();

  constructor(public readonly fsEntry: MemoryFsEntry) {}

  reader() {
    let offset = 0;
    return {
      // deno-lint-ignore require-await
      read: async (p: Uint8Array) => {
        const bytesRead = this.inMemData.slice(offset, offset + p.length);
        p.set(bytesRead);
        offset += bytesRead.length;
        return bytesRead.length ? bytesRead.length : null;
      },
    };
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

export class MemoryMutableFile extends MemoryFile
  implements MutableFile<MemoryFsEntry> {
  writer() {
    return {
      // deno-lint-ignore require-await
      write: async (p: Uint8Array) => {
        this.inMemData = new Uint8Array([...this.inMemData, ...p]);
        return p.length;
      },
    };
  }
}

export class MemoryDirectory implements Directory<MemoryFsEntry, MemoryFile> {
  protected inMemEntries:
    (MemoryFile | Directory<MemoryFsEntry, MemoryFile>)[] = [];

  constructor(public readonly fsEntry: MemoryFsEntry) {}

  async *files<Content extends MemoryFile>(
    options?: Parameters<Directory<MemoryFsEntry, Content>["files"]>[0],
  ): AsyncGenerator<Content> {
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
  ): AsyncGenerator<Directory<MemoryFsEntry, MemoryFile>> {
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
  ): AsyncGenerator<MemoryFile | Directory<MemoryFsEntry, MemoryFile>> {
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
  implements FileSystem<MemoryFsEntry, MemoryFile, MemoryDirectory> {
  file(path: MemoryFsEntry): MemoryFile {
    return new MemoryFile(path);
  }

  directory(path?: MemoryFsEntry): MemoryDirectory {
    return new MemoryDirectory(path || { canonicalPath: "/" });
  }
}
