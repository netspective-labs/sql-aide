// deno-lint-ignore no-explicit-any
type Any = any;

export type IngressEntry<PathID extends string, RootPath extends string> = {
  readonly fsPath: string;
  readonly watchPath: WatchFsPath<PathID, RootPath>;
  readonly draining: boolean;
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
  readonly drain?:
    | ((
      entries: IngressEntry<PathID, RootPath>[],
      path: WatchFsPath<PathID, RootPath>,
    ) => Promise<void> | void)
    | "individual";
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
        const draining = event.kind === "existing";
        await watchPath.onIngress(
          { fsPath, watchPath, draining },
          draining ? undefined : event,
        );
      }
    }
  };

  if (args.drain) {
    for (const watchPath of args.watchPaths) {
      const drained: IngressEntry<PathID, RootPath>[] = [];
      const drainingIndividual = args.drain === "individual";
      for await (const entry of Deno.readDir(watchPath.rootPath)) {
        if (entry.isFile) {
          // Simulate a "create" event for each existing file
          const fsPath = `${watchPath.rootPath}/${entry.name}`;
          if (drainingIndividual) {
            await handleEvent(
              { kind: "existing", paths: [fsPath] },
              watchPath,
            );
          } else {
            drained.push({ fsPath, watchPath, draining: true });
          }
        }
      }
      if (args.drain !== "individual") {
        await args.drain(drained, watchPath);
      }
    }
  }

  if (args.watch) {
    // Start watching each path for new file events (will not return from function)
    for (const watchPath of args.watchPaths) {
      const watcher = Deno.watchFs(watchPath.rootPath);

      for await (const event of watcher) {
        await handleEvent(event, watchPath);
      }
    }
  }
}
