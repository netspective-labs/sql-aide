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

export interface LocalFsEntry extends FileSystemEntry<string, Deno.FileInfo> {
  readonly descriptor: () => Promise<Deno.FileInfo>;
  readonly descriptorSync: () => Deno.FileInfo;
}

export function localFsEntry(
  canonicalPath: string | Pick<LocalFsEntry, "canonicalPath">,
) {
  const defaults: Pick<LocalFsEntry, "canonicalPath"> =
    typeof canonicalPath === "string" ? { canonicalPath } : canonicalPath;
  const result: LocalFsEntry = {
    ...defaults,
    descriptor: async () => await Deno.stat(defaults.canonicalPath),
    descriptorSync: () => Deno.statSync(defaults.canonicalPath),
  };
  return result;
}

export class LocalFile
  implements
    File<LocalFsEntry, Uint8Array>,
    Content<LocalFsEntry>,
    TextContent<LocalFsEntry> {
  constructor(readonly fsEntry: LocalFsEntry) {
  }

  async readable() {
    const fsFile = await Deno.open(this.fsEntry.canonicalPath, {
      read: true,
    });
    return fsFile.readable;
  }

  readableSync() {
    return Deno.openSync(this.fsEntry.canonicalPath, {
      read: true,
    }).readable;
  }

  async content(): Promise<Uint8Array> {
    return await Deno.readFile(this.fsEntry.canonicalPath);
  }

  async text(): Promise<string> {
    return await Deno.readTextFile(this.fsEntry.canonicalPath);
  }
}

export class LocalMutableFile extends LocalFile
  implements MutableFile<LocalFsEntry, Uint8Array> {
  async writable() {
    const fsFile = await Deno.open(this.fsEntry.canonicalPath, {
      write: true,
      create: true,
    });
    return fsFile.writable;
  }

  writableSync() {
    const fsFile = Deno.openSync(this.fsEntry.canonicalPath, {
      write: true,
      create: true,
    });
    return fsFile.writable;
  }
}

export class LocalDirectory implements Directory<LocalFsEntry, LocalFile> {
  constructor(readonly fsEntry: LocalFsEntry) {
  }

  async *files<Content extends LocalFile>(
    options?: Parameters<Directory<LocalFsEntry, Content>["files"]>[0],
  ): AsyncIterable<Content> {
    for await (const dirEntry of Deno.readDir(this.fsEntry.canonicalPath)) {
      if (dirEntry.isFile) {
        let file = new LocalFile(localFsEntry(dirEntry.name)) as Content;
        if (options?.factory) {
          file = options.factory(file as Content);
        }
        if (!options?.filter) {
          yield file;
        } else {
          const result = options.filter(file);
          if (result !== false) yield result;
        }
      }
    }
  }

  async *subdirectories(
    options?: Parameters<
      Directory<LocalFsEntry, LocalFile>["subdirectories"]
    >[0],
  ): AsyncIterable<LocalDirectory> {
    for await (const dirEntry of Deno.readDir(this.fsEntry.canonicalPath)) {
      if (dirEntry.isDirectory) {
        let dir = new LocalDirectory(localFsEntry(dirEntry.name));
        if (options?.factory) dir = options.factory(dir);
        if (!options?.filter) {
          yield dir;
        } else {
          const result = options.filter(dir);
          if (result !== false) yield result;
        }
      }
    }
  }

  async *entries(
    options?: Parameters<Directory<LocalFsEntry, LocalFile>["entries"]>[0],
  ): AsyncIterable<LocalFile | LocalDirectory> {
    for await (const dirEntry of Deno.readDir(this.fsEntry.canonicalPath)) {
      const fsEntry = localFsEntry(dirEntry.name);
      let entry: LocalFile | LocalDirectory;
      if (dirEntry.isFile) {
        entry = new LocalFile(fsEntry);
      } else {
        entry = new LocalDirectory(fsEntry);
      }
      const instance = options?.factory ? options.factory(entry) : entry;
      if (!options?.filter) {
        yield instance;
      } else {
        const result = options.filter(instance);
        if (result !== false) yield result;
      }
    }
  }
}

export class LocalMutableDirectory extends LocalDirectory
  implements MutableDirectory<LocalFsEntry, LocalFile> {
  constructor(fsEntry: LocalFsEntry) {
    super(fsEntry);
  }

  async add(
    entry: LocalFile | LocalDirectory,
  ): Promise<boolean | number> {
    if (entry instanceof LocalFile) {
      try {
        // Check if the file already exists
        await Deno.stat(entry.fsEntry.canonicalPath);
        return false; // File already exists
      } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
          // Create the file using streaming
          const destFile = await Deno.open(entry.fsEntry.canonicalPath, {
            write: true,
            create: true,
          });
          const srcStream = await entry.readable();
          srcStream.pipeTo(destFile.writable);
          destFile.close();

          return true; // File created and written to successfully
        }
        throw error; // Rethrow other errors
      }
    } else if (entry instanceof LocalDirectory) {
      try {
        // Check if the directory already exists
        await Deno.stat(entry.fsEntry.canonicalPath);
        return false; // Directory already exists
      } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
          // Create the directory if it doesn't exist
          await Deno.mkdir(entry.fsEntry.canonicalPath);
          return true; // Directory created successfully
        }
        throw error; // Rethrow other errors
      }
    } else {
      throw new Error("Unsupported entry type");
    }
  }
}

export class LocalFileSystem
  implements
    FlatFileSystem<LocalFsEntry, LocalFile>,
    HierarchicalFileSystem<LocalFsEntry, LocalFile, LocalDirectory> {
  file(path: LocalFsEntry): LocalFile {
    return new LocalFile(path);
  }

  directory(
    path: LocalFsEntry = localFsEntry(Deno.cwd()),
  ): LocalDirectory {
    return new LocalDirectory(path);
  }
}
