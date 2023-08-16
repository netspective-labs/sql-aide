import { path } from "./deps.ts";
import { FileSystemEntry } from "./governance.ts";

export interface FileSystemEntryPathParts<CanonicalPath>
  extends FileSystemEntry<CanonicalPath> {
  readonly root: string; // E.g., '/' or 'c:'
  readonly dir: string; // E.g., '/home/user/dir' or 'c:\path\dir'
  readonly base: string; // E.g., 'index.html'
  readonly ext: string; // E.g., '.html'
  readonly name: string; // E.g., 'index'
}

export function fsEntryPathParts<
  CanonicalPath extends string,
  Entry extends FileSystemEntry<CanonicalPath>,
>(entry: Entry): FileSystemEntryPathParts<CanonicalPath> {
  return {
    ...entry,
    ...path.parse(entry.canonicalPath),
  };
}
