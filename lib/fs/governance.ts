export interface FileSystemEntry<CanonicalPath> {
  readonly canonicalPath: CanonicalPath;
}

export interface FileSystemEntryPathParts<CanonicalPath>
  extends FileSystemEntry<CanonicalPath> {
  readonly root: string; // E.g., '/' or 'c:'
  readonly dir: string; // E.g., '/home/user/dir' or 'c:\path\dir'
  readonly base: string; // E.g., 'index.html'
  readonly ext: string; // E.g., '.html'
  readonly name: string; // E.g., 'index'
}

export interface File<Entry> {
  readonly fsEntry: Entry;
  readonly reader: () => { read: (p: Uint8Array) => Promise<number | null> }; // Returns an object that matches the Deno.Reader interface
}

export interface MutableFile<Entry> extends File<Entry> {
  readonly writer: () => { write: (p: Uint8Array) => Promise<number> }; // Returns an object that matches the Deno.Writer interface
}

export interface Directory<Entry, File> {
  readonly fsEntry: Entry;
  readonly files: <Content extends File>(
    options?: {
      readonly factory?: (file: File) => Content;
      readonly filter?: (encountered: Content) => false | Content;
    },
  ) => AsyncGenerator<Content>;
  readonly subdirectories: (
    options?: {
      readonly factory?: (
        dir: Directory<Entry, File>,
      ) => Directory<Entry, File>;
      readonly filter?: (
        encountered: Directory<Entry, File>,
      ) => false | Directory<Entry, File>;
    },
  ) => AsyncGenerator<Directory<Entry, File>>;
  readonly entries: (
    options?: {
      readonly factory?: (
        entry: File | Directory<Entry, File>,
      ) => File | Directory<Entry, File>;
      readonly filter?: (
        encountered: File | Directory<Entry, File>,
      ) => false | (File | Directory<Entry, File>);
    },
  ) => AsyncGenerator<File | Directory<Entry, File>>;
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

export interface Content<Entry> extends File<Entry> {
  readonly content: () => Promise<Uint8Array>;
}

export interface TextContent<Entry> extends Content<Entry> {
  readonly text: () => Promise<string>;
}
