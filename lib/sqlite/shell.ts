const sqlTextDetected = (
  supplier:
    | string
    | Iterable<string>
    | ArrayLike<string>
    | Generator<string>,
) => typeof supplier === "string" ? [supplier] : Array.from(supplier);

const sqlText = (
  sqlSupplier:
    | Parameters<typeof sqlTextDetected>[0]
    | (() => Parameters<typeof sqlTextDetected>[0]),
) => {
  const result = typeof sqlSupplier === "function"
    ? sqlTextDetected(sqlSupplier())
    : sqlTextDetected(sqlSupplier);
  return result;
};

/**
 * Load SQL into an SQLite database. If it does not already exist, it will be
 * created.
 * @param dbDest the destination of the SQLite database
 * @param sqlSupplier the SQL that should be loaded into SQLite dbDest database
 * @param options.executableFsPath optional location of SQLite executable
 * @returns
 */
export async function executeSqliteCmd(
  dbDest: string,
  sqlSupplier: Uint8Array | Parameters<typeof sqlText>[0],
  options?: {
    readonly executableFsPath?: (dbFsPath: string) => string | Promise<string>;
  },
) {
  const sqliteCmdFsPath = await options?.executableFsPath?.(dbDest) ??
    `sqlite3`;
  const cmd = new Deno.Command(sqliteCmdFsPath, {
    args: [dbDest],
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
  });
  const child = cmd.spawn();

  const sqlPipe = child.stdin.getWriter();
  if (sqlSupplier instanceof Uint8Array) {
    sqlPipe.write(sqlSupplier);
  } else {
    const te = new TextEncoder();
    for (const SQL of sqlText(sqlSupplier)) {
      sqlPipe.write(te.encode(SQL));
    }
  }
  sqlPipe.close();

  const { code, stdout: stdoutRaw, stderr: stderrRaw } = await child.output();

  return {
    sqliteCmdFsPath,
    code,
    stdoutRaw,
    stderrRaw,
    stdout: () => new TextDecoder().decode(stdoutRaw),
    stderr: () => new TextDecoder().decode(stderrRaw),
  };
}

/**
 * Create an in-memory SQLite database, load the first pass for optimal
 * performance then export the in-memory database to the given file; this
 * two phase approach works because the last line in the SQL is '.dump'.
 * @param dbDest the final destination of the SQLite database
 * @param sqlSupplier the SQL that should be loaded into SQLite dbDest database
 * @param options.executableFsPath optional location of SQLite executable
 * @param options.destDbSQL optional SQL to execute in the destination (after in-memory loading)
 * @returns
 */
export async function executeOptimizedSqliteCmd(
  dbDest: string,
  sqlSupplier: Parameters<typeof sqlText>[0],
  options?: Parameters<typeof executeSqliteCmd>[2] & {
    readonly destDbSQL?: Parameters<typeof sqlText>[0];
  },
) {
  const inMemory = await executeSqliteCmd(":memory:", function* () {
    for (const SQL of sqlText(sqlSupplier)) {
      yield SQL;
    }

    yield "\n";
    yield "-- the .dump in the last line is necessary because we load into :memory:\n";
    yield "-- first because performance is better and then emit all the SQL for saving\n";
    yield "-- into the destination file, e.g. when insert DML uses (select x from y where a = b))\n";
    yield ".dump\n";
  }, options);

  if (inMemory.code == 0) {
    const dest = options?.destDbSQL
      ? await executeSqliteCmd(dbDest, function* () {
        yield inMemory.stdout();
        for (const SQL of sqlText(options.destDbSQL!)) {
          yield SQL;
        }
      }, options)
      : await executeSqliteCmd(dbDest, inMemory.stdoutRaw, options);
    return { inMemory, dest };
  }
  return { inMemory, dest: undefined };
}

export async function executeSqliteCLI(
  { dest, sqlSrc, removeSqlSrcFirst, optimization, report }: {
    dest: string;
    sqlSrc: string;
    removeSqlSrcFirst?: boolean;
    optimization?: boolean;
    report?: (message: string) => void;
  },
) {
  if (removeSqlSrcFirst) {
    report?.(`Deno.remove("${dest}")`);
    Deno.remove(dest, { recursive: true });
  }

  const SQL = Deno.readTextFileSync(sqlSrc);
  if (optimization) {
    report?.(`executeOptimizedSqliteCmd("${dest}", "${SQL}")`);
    const result = await executeOptimizedSqliteCmd(dest, SQL);
    if (result.inMemory.code !== 0) {
      console.error(
        `Error executing SQL from ${sqlSrc} in memory: ${result.inMemory.code}`,
      );
      const [stdout, stderr] = [
        result.inMemory.stdout(),
        result.inMemory.stderr(),
      ];
      if (stdout.trim().length > 0) console.log(stdout);
      if (stderr.trim().length > 0) console.error(stderr);
    }
    if (result.dest && result.dest.code !== 0) {
      console.error(
        `Error executing SQL from ${sqlSrc}: ${result.dest.code}`,
      );
      const [stdout, stderr] = [result.dest.stdout(), result.dest.stderr()];
      if (stdout.trim().length > 0) console.log(stdout);
      if (stderr.trim().length > 0) console.error(stderr);
    }
  } else {
    report?.(`executeSqliteCmd("${dest}", "${SQL}")`);
    const result = await executeSqliteCmd(dest, SQL);
    if (result.code !== 0) {
      const [stdout, stderr] = [result.stdout(), result.stderr()];
      if (stdout.trim().length > 0) console.log(stdout);
      if (stderr.trim().length > 0) console.error(stderr);
    }
  }
}
