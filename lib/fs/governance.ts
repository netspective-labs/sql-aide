export interface CanonicalPathSupplier<CanonicalPath> {
  readonly canonicalPath: CanonicalPath;
}

export function isCanonicalPathSupplier<CanonicalPath>(
  o: unknown,
  isCP?: (cp: unknown) => cp is CanonicalPath,
): o is CanonicalPathSupplier<CanonicalPath> {
  if (o && typeof o === "object" && "canonicalPath" in o) {
    if (isCP) return isCP(o.canonicalPath);
    return true;
  }
  return false;
}

export function isCanonicalPathTextSupplier(
  o: unknown,
): o is CanonicalPathSupplier<string> {
  return isCanonicalPathSupplier<string>(
    o,
    (cp): cp is string => typeof cp === "string" ? true : false,
  );
}

export interface FileSystemEntry<CanonicalPath, Descriptor>
  extends CanonicalPathSupplier<CanonicalPath> {
  readonly descriptor?: () => Promise<Descriptor>;
  readonly descriptorSync?: () => Descriptor;
}

export interface File<Entry, StreamContent> {
  readonly fsEntry: Entry;
  readonly readable: () => Promise<ReadableStream<StreamContent>>;
  readonly readableSync: () => ReadableStream<StreamContent>;
}

export interface MutableFile<Entry, StreamContent>
  extends File<Entry, StreamContent> {
  readonly writable: () => Promise<WritableStream<StreamContent>>;
  readonly writableSync: () => WritableStream<StreamContent>;
}

export interface Directory<Entry, File> {
  readonly fsEntry: Entry;
  readonly files: <Content extends File>(
    options?: {
      readonly factory?: (file: File) => Content;
      readonly filter?: (encountered: Content) => false | Content;
    },
  ) => AsyncIterable<Content>;
  readonly subdirectories: (
    options?: {
      readonly factory?: (
        dir: Directory<Entry, File>,
      ) => Directory<Entry, File>;
      readonly filter?: (
        encountered: Directory<Entry, File>,
      ) => false | Directory<Entry, File>;
    },
  ) => AsyncIterable<Directory<Entry, File>>;
  readonly entries: (
    options?: {
      readonly factory?: (
        entry: File | Directory<Entry, File>,
      ) => File | Directory<Entry, File>;
      readonly filter?: (
        encountered: File | Directory<Entry, File>,
      ) => false | (File | Directory<Entry, File>);
    },
  ) => AsyncIterable<File | Directory<Entry, File>>;
}

export interface MutableDirectory<Entry, File> extends Directory<Entry, File> {
  readonly add: (
    entry: File | Directory<Entry, File>,
  ) => Promise<boolean | number>;
}

export interface FlatFileSystem<Entry, File> {
  readonly file: (path: Entry) => File;
}

export interface HierarchicalFileSystem<Entry, File, Directory> {
  readonly file: (path: Entry) => File;
  readonly directory: (path?: Entry) => Directory;
}
