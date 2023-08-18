export interface FileSystemEntry<CanonicalPath> {
  readonly canonicalPath: CanonicalPath;
}

export interface File<Entry, StreamContent> {
  readonly fsEntry: Entry;
  readonly readable: () => Promise<ReadableStream<StreamContent>>;
}

export interface MutableFile<Entry, StreamContent>
  extends File<Entry, StreamContent> {
  readonly writable: () => Promise<WritableStream<StreamContent>>;
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

export interface FileSystem<Entry, File, Directory> {
  readonly file: (path: Entry) => File;
  readonly directory: (path?: Entry) => Directory;
}
