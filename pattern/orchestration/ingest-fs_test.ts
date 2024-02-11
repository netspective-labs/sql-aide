import { path } from "../../deps.ts";
import { testingAsserts as ta } from "../../deps-test.ts";
import { ingestWatchedFs, IngressEntry, WatchFsPath } from "./ingest-fs.ts";

// Utility function to create a temporary directory with test files
async function setupTestDirectory() {
  const tempDir = await Deno.makeTempDir();
  // Create single (ungrouped) files
  await Deno.writeTextFile(path.join(tempDir, `single_file_1.csv`), "data");
  await Deno.writeTextFile(path.join(tempDir, `single_file_2.csv`), "data");

  // Create grouped files (for example, when 3 files are related and should be
  // processed only when they are seen together).
  for (let i = 1; i <= 3; i++) {
    await Deno.writeTextFile(
      path.join(tempDir, `synthetic_group_1_${i}.csv`),
      `data${i}`,
    );
    await Deno.writeTextFile(
      path.join(tempDir, `synthetic_group_2_${i}.csv`),
      `data${i}`,
    );
  }

  return tempDir;
}

Deno.test("ingestWatchedFs only single files", async () => {
  const tempDir = await setupTestDirectory();
  try {
    let singleFileIngressCount = 0;
    let drainingCount = 0;

    const watchPaths: WatchFsPath<string, string>[] = [{
      pathID: "testPath",
      rootPath: tempDir,
      onIngress: (entry) => {
        singleFileIngressCount++;
        if (entry.draining) drainingCount++;
      },
    }];

    await ingestWatchedFs({ drain: "individual", watch: false, watchPaths });

    ta.assertEquals(singleFileIngressCount, 8, "8 single files expected");
    ta.assertEquals(drainingCount, 8, "8 drained files expected");
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("ingestWatchedFs grouped files", async () => {
  type SyntheticGroup = {
    readonly prefix: string;
    readonly entries: IngressEntry<string, string>[];
  };

  const tempDir = await setupTestDirectory();
  try {
    const groups = new Map<string, SyntheticGroup>();
    let groupTriggers = 0;

    const watchPaths: WatchFsPath<string, string>[] = [{
      pathID: "testPath",
      rootPath: tempDir,
      onIngress: (entry) => {
        const groupMatch = entry.fsPath.match(/(synthetic_group_\d+_)/);
        if (groupMatch) {
          const [, prefix] = groupMatch;
          let group = groups.get(prefix);
          if (!group) {
            group = { prefix, entries: [entry] };
            groups.set(prefix, group);
          } else {
            group.entries.push(entry);
          }
          // you can check if all files have arrived and do something specific
          if (group.entries.length == 3) groupTriggers++;
        }
      },
    }];

    await ingestWatchedFs({ drain: "individual", watch: false, watchPaths });

    ta.assertEquals(groups.size, 2, "2 files groups expected");
    ta.assertEquals(groupTriggers, 2, "2 groups triggers expected");
    groups.forEach((ig) =>
      ta.assertEquals(ig.entries.length, 3, "Each group should have 3 files")
    );
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("ingestWatchedFs mixed single and grouped files", async () => {
  type SyntheticGroup = {
    readonly prefix: string;
    readonly entries: IngressEntry<string, string>[];
  };

  const tempDir = await setupTestDirectory();
  try {
    let singleFileIngressCount = 0;

    const unprocessedGroups = new Map<string, SyntheticGroup>();
    let groupTriggers = 0;

    const watchPaths: WatchFsPath<string, string>[] = [{
      pathID: "testPath",
      rootPath: tempDir,
      onIngress: (entry) => {
        const groupMatch = entry.fsPath.match(/(synthetic_group_\d+_)/);
        if (groupMatch) {
          const [, prefix] = groupMatch;
          let group = unprocessedGroups.get(prefix);
          if (!group) {
            group = { prefix, entries: [entry] };
            unprocessedGroups.set(prefix, group);
          } else {
            group.entries.push(entry);
          }
          if (group.entries.length == 3) {
            // we want to do process the group then remove it from the list
            // so that anything that's left have "dangling" files
            groupTriggers++;
            unprocessedGroups.delete(group.prefix);
          }
        } else {
          singleFileIngressCount++;
        }
      },
    }];

    await ingestWatchedFs({ drain: "individual", watch: false, watchPaths });

    ta.assertEquals(singleFileIngressCount, 2, "2 single files expected");
    ta.assertEquals(groupTriggers, 2, "2 groups expected");
    ta.assertEquals(unprocessedGroups.size, 0, "0 unprocessed groups expected");

    unprocessedGroups.forEach((ig) =>
      ta.assertEquals(ig.entries.length, 3, "Each group should have 3 files")
    );
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});
