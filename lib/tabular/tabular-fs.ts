import * as fs from "../fs/governance.ts";

export interface TabularFile {
  readonly source: fs.File<fs.CanonicalPathSupplier<string>, Uint8Array>;
}

export async function* tabularFiles<
  File extends fs.File<fs.CanonicalPathSupplier<string>, Uint8Array>,
>(
  sources: () => AsyncIterable<File>,
  options?: {
    readonly isTabularFile: (f: File) => false | File;
  },
) {
  const isTabularFile = options?.isTabularFile ?? ((f: File) => {
    if (f.fsEntry.canonicalPath.toLowerCase().endsWith(".csv")) {
      return f;
    }
    return false;
  });
  for await (const f of sources()) {
    if (isTabularFile(f)) yield f;
  }
}
