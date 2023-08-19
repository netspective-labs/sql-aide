import JSZip from "npm:jszip";
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

// deno-lint-ignore no-explicit-any
type Any = any;

export class ZipFileSystemEntry
  implements FileSystemEntry<string, JSZip.JSZipObject | null> {
  readonly canonicalPath: string;

  constructor(readonly jso: JSZip.JSZipObject | null, canonicalPath: string) {
    this.canonicalPath = jso?.name ?? canonicalPath;
  }

  // deno-lint-ignore require-await
  async descriptor() {
    return this.jso;
  }

  descriptorSync() {
    return this.jso;
  }

  exists() {
    return this.jso ? true : false;
  }
}

export class ZipFile
  implements
    File<ZipFileSystemEntry, Uint8Array>,
    Content<ZipFileSystemEntry>,
    TextContent<ZipFileSystemEntry> {
  readonly fsEntry: ZipFileSystemEntry;

  constructor(protected fsZipFile: JSZip, path: string) {
    const fileInFsZip = this.fsZipFile.file(path);
    this.fsEntry = new ZipFileSystemEntry(fileInFsZip, path);
  }

  // deno-lint-ignore require-await
  async readable() {
    return this.readableSync();
  }

  readableSync() {
    if (!this.fsEntry.jso) {
      throw new Error(`File not found: ${this.fsEntry.canonicalPath} in ZIP`);
    }
    return new ReadableStream<Uint8Array>({
      pull: async (controller) => {
        // TODO: instead of feeding the entire thing at once, properly stream the data
        try {
          const data = await this.fsEntry.jso!.async("uint8array");
          controller.enqueue(data);
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });
  }

  async content(): Promise<Uint8Array> {
    if (!this.fsEntry.jso) {
      throw new Error(`File not found: ${this.fsEntry.canonicalPath} in ZIP`);
    }
    return await this.fsEntry.jso.async("uint8array");
  }

  async text(): Promise<string> {
    if (!this.fsEntry.jso) {
      throw new Error(`File not found: ${this.fsEntry.canonicalPath} in ZIP`);
    }
    return await this.fsEntry.jso.async("text");
  }
}

export class ZipMutableFile extends ZipFile
  implements MutableFile<ZipFileSystemEntry, Uint8Array> {
  // deno-lint-ignore require-await
  async writable() {
    return this.writableSync();
  }

  writableSync() {
    let chunks = new Uint8Array(0);

    return new WritableStream<Uint8Array>({
      write(chunk) {
        chunks = new Uint8Array([...chunks, ...chunk]);
      },
      close: () => {
        this.fsZipFile.file(this.fsEntry.canonicalPath, chunks);
      },
    });
  }
}

export class ZipDirectory implements Directory<ZipFileSystemEntry, ZipFile> {
  readonly fsEntry: ZipFileSystemEntry;

  constructor(protected zip: JSZip, path: string) {
    this.fsEntry = new ZipFileSystemEntry(null, path);
  }

  async *files<Content extends ZipFile>(
    options?: Parameters<Directory<ZipFileSystemEntry, Content>["files"]>[0],
  ) {
    for (const filename in this.zip.files) {
      if (
        filename.startsWith(this.fsEntry.canonicalPath) &&
        !filename.endsWith("/")
      ) {
        let file = new ZipFile(this.zip, filename);
        if (options?.factory) {
          file = options.factory(file as Content);
        }
        if (options?.filter) {
          const filtered = options.filter(file as Content);
          if (filtered) yield filtered as Content;
        } else {
          yield file as Content;
        }
      }
    }
  }

  async *subdirectories(
    options?: Parameters<
      Directory<ZipFileSystemEntry, ZipFile>["subdirectories"]
    >[0],
  ) {
    const seenDirs = new Set<string>();
    for (const dirName in this.zip.files) {
      if (!dirName.endsWith("/")) continue;
      if (dirName.startsWith(this.fsEntry.canonicalPath)) {
        if (!seenDirs.has(dirName)) {
          seenDirs.add(dirName);
          let dir = new ZipDirectory(this.zip, dirName) as Directory<
            ZipFileSystemEntry,
            ZipFile
          >;
          if (options?.factory) {
            dir = options.factory(dir);
          }
          if (options?.filter) {
            const filtered = options.filter(dir);
            if (filtered) yield filtered;
          } else {
            yield dir;
          }
        }
      }
    }
  }

  async *entries(
    options?: Parameters<Directory<ZipFileSystemEntry, ZipFile>["entries"]>[0],
  ) {
    for await (
      const file of this.files(
        options as Parameters<Directory<ZipFileSystemEntry, Any>["files"]>[0],
      )
    ) {
      yield file;
    }
    for await (
      const dir of this.subdirectories(
        options as Parameters<
          Directory<ZipFileSystemEntry, ZipFile>["subdirectories"]
        >[0],
      )
    ) {
      yield dir;
    }
  }
}

export class ZipMutableDirectory extends ZipDirectory
  implements MutableDirectory<ZipFileSystemEntry, ZipFile> {
  async add(
    entry: ZipFile | Directory<ZipFileSystemEntry, ZipFile>,
  ): Promise<boolean | number> {
    if (entry instanceof ZipFile) {
      const content = await entry.content();
      this.zip.file(entry.fsEntry.canonicalPath, content);
      return true;
    } else if (entry instanceof ZipDirectory) {
      this.zip.file(entry.fsEntry.canonicalPath + "/", null);
      return true;
    }
    return false;
  }
}

export class ZipFS
  implements
    FlatFileSystem<ZipFileSystemEntry, ZipFile>,
    HierarchicalFileSystem<ZipFileSystemEntry, ZipFile, ZipDirectory> {
  constructor(readonly jsZip: JSZip) {}

  zipFsFileEntry(path: string) {
    return new ZipFileSystemEntry(this.jsZip.file(path), path);
  }

  zipFsDirEntry(path: string) {
    return new ZipFileSystemEntry(null, path);
  }

  file(path: ZipFileSystemEntry): ZipFile {
    return new ZipFile(this.jsZip, path.canonicalPath);
  }

  directory(path?: ZipFileSystemEntry): ZipDirectory {
    return new ZipDirectory(this.jsZip, path?.canonicalPath || "");
  }

  static async fromPath(path: string): Promise<ZipFS> {
    const zipData = await Deno.readFile(path);
    const zip = await new JSZip().loadAsync(zipData);
    return new ZipFS(zip);
  }
}
