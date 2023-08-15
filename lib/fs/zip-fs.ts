import JSZip from "npm:jszip";
import {
  Directory,
  File,
  FileSystem,
  FileSystemEntry,
  MutableDirectory,
  MutableFile,
} from "./governance.ts";
import { Content, TextContent } from "./content.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export class ZipFileSystemEntry implements FileSystemEntry<string> {
  readonly canonicalPath: string;

  constructor(path: string) {
    this.canonicalPath = path;
  }
}

export class ZipFile
  implements
    File<ZipFileSystemEntry>,
    Content<ZipFileSystemEntry>,
    TextContent<ZipFileSystemEntry> {
  readonly fsEntry: ZipFileSystemEntry;

  constructor(protected zip: JSZip, path: string) {
    this.fsEntry = new ZipFileSystemEntry(path);
  }

  reader(): { read: (p: Uint8Array) => Promise<number | null> } {
    const file = this.zip.file(this.fsEntry.canonicalPath);
    if (!file) throw new Error("File not found");

    const nodeStream = file.nodeStream();
    let streamEnded = false;

    return {
      read: (p: Uint8Array) => {
        return new Promise((resolve, reject) => {
          if (streamEnded) return null;

          nodeStream.once("data", (chunk: Uint8Array) => {
            const bytesRead = Math.min(chunk.length, p.length);
            p.set(chunk.slice(0, bytesRead));
            if (bytesRead < chunk.length) {
              nodeStream.unshift(chunk.slice(bytesRead));
            }
            resolve(bytesRead);
          });

          nodeStream.once("end", () => {
            streamEnded = true;
            resolve(null);
          });

          nodeStream.once("error", (err: Error) => {
            reject(err);
          });
        });
      },
    };
  }

  async content(): Promise<Uint8Array> {
    const file = this.zip.file(this.fsEntry.canonicalPath);
    if (!file) throw new Error("File not found");
    return await file.async("uint8array");
  }

  async text(): Promise<string> {
    const file = this.zip.file(this.fsEntry.canonicalPath);
    if (!file) throw new Error("File not found");
    return await file.async("text");
  }
}

export class ZipMutableFile extends ZipFile
  implements MutableFile<ZipFileSystemEntry> {
  writer(): { write: (p: Uint8Array) => Promise<number> } {
    return {
      // deno-lint-ignore require-await
      write: async (p: Uint8Array) => {
        this.zip.file(this.fsEntry.canonicalPath, p);
        return p.length;
      },
    };
  }
}

export class ZipDirectory implements Directory<ZipFileSystemEntry, ZipFile> {
  readonly fsEntry: ZipFileSystemEntry;

  constructor(protected zip: JSZip, path: string) {
    this.fsEntry = new ZipFileSystemEntry(path);
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
  implements FileSystem<ZipFileSystemEntry, ZipFile, ZipDirectory> {
  constructor(readonly jsZip: JSZip) {}

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
