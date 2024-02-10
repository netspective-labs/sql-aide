// deno-lint-ignore no-explicit-any
type Any = any;

// read the following Deno TypeScript code in a file called `ingest-fs.ts` and let me know when you're ready:

export type IngressEntry<PathID extends string, RootPath extends string> = {
  readonly fsPath: string;
  readonly watchPath: WatchFsPath<PathID, RootPath>;
};

export interface WatchFsPath<PathID extends string, RootPath extends string> {
  readonly pathID: PathID;
  readonly rootPath: RootPath;
  readonly onIngress: (
    entry: IngressEntry<PathID, RootPath>,
    event?: Deno.FsEvent,
  ) => Promise<void> | void;
}

export interface IngestFsArgs<PathID extends string, RootPath extends string> {
  /**
   * True to process existing files in paths then start watching or false to
   * only process the existing files and not watch for new files.
   */
  readonly watch: boolean;
  readonly watchPaths: Iterable<WatchFsPath<PathID, RootPath>>;
}

/**
 * Given a list of watchable root paths, call onIngress() every time a new file
 * is encountered.
 * @param args
 */
export async function ingestWatchedFs<
  PathID extends string,
  RootPath extends string,
>(
  args: IngestFsArgs<PathID, RootPath>,
) {
  const handleEvent = async (
    event: Deno.FsEvent | { kind: "existing"; paths: string[] },
    watchPath: WatchFsPath<PathID, RootPath>,
  ) => {
    // Process the event if it's a "create" or if we're initializing from existing files
    if (event.kind === "create" || event.kind === "existing") {
      for (const fsPath of event.paths) {
        await watchPath.onIngress(
          { fsPath, watchPath },
          event.kind !== "existing" ? event : undefined,
        );
      }
    }
  };

  // Process existing files in each watched directory first
  for (const watchPath of args.watchPaths) {
    for await (const entry of Deno.readDir(watchPath.rootPath)) {
      if (entry.isFile) {
        // Simulate a "create" event for each existing file
        const filePath = `${watchPath.rootPath}/${entry.name}`;
        await handleEvent(
          { kind: "existing", paths: [filePath] },
          watchPath,
        );
      }
    }
  }

  if (args.watch) {
    // Then start watching each path for new file events
    for (const watchPath of args.watchPaths) {
      const watcher = Deno.watchFs(watchPath.rootPath);

      for await (const event of watcher) {
        await handleEvent(event, watchPath);
      }
    }
  }
}
