export const inMemorySqliteDB = ":memory:" as const;

export type FlexibleSqlText =
  | string
  | { readonly fileSystemPath: string }
  | Iterable<string>
  | ArrayLike<string>
  | Generator<string>;

export type FlexibleSqlTextSupplierSync =
  | FlexibleSqlText
  | (() => FlexibleSqlText);

/**
 * Accept a flexible source of SQL such as a string, a file system path, an
 * array of strings or a TypeScript Generator and convert them to a string
 * array.
 * @param supplier flexible source of SQL text
 * @returns a resolved string array of SQL that should be executed
 */
const sqlTextList = (supplier: FlexibleSqlTextSupplierSync): string[] =>
  typeof supplier === "function"
    ? sqlTextList(supplier())
    : typeof supplier === "string"
    ? [supplier]
    : (typeof supplier === "object" && "fileSystemPath" in supplier
      ? [Deno.readTextFileSync(supplier.fileSystemPath)]
      : Array.from(supplier));

/**
 * Accept a flexible source of SQL such as a string, a file system path, an
 * array of strings or a TypeScript Generator and create a human-friendly
 * message of the supplier type
 * @param supplier flexible source of SQL text
 * @returns a string that explains the type of SQL provided
 */
const sqlTextTypeMessage = (
  sqlSupplier:
    | Parameters<typeof sqlTextList>[0]
    | (() => Parameters<typeof sqlTextList>[0]),
): string =>
  typeof sqlSupplier === "function"
    ? sqlTextTypeMessage(sqlSupplier())
    : typeof sqlSupplier === "string"
    ? `SQL text`
    : (typeof sqlSupplier === "object" && "fileSystemPath" in sqlSupplier
      ? `SQL file ${sqlSupplier.fileSystemPath}`
      : `SQL text array`);

/**
 * Using `sqlite3` or equivalent shell-accessible SQLite command, load SQL into
 * an SQLite database. If it does not already exist, it will be created.
 * @param dbDest the destination of the SQLite database
 * @param sqlSupplier the SQL that should be loaded into SQLite dbDest database
 * @param options.executableFsPath optional location of SQLite executable
 * @returns
 */
export async function executeSqliteCmd(
  dbDest: string,
  sqlSupplier: Uint8Array | FlexibleSqlTextSupplierSync,
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
    for (const SQL of sqlTextList(sqlSupplier)) {
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
 * Using `sqlite3` or equivalent shell-accessible SQLite command, create an
 * in-memory SQLite database, load the first pass for optimal performance then
 * export the in-memory database to the given file; this two phase approach
 * works because the last line in the SQL is '.dump'.
 * @param dbDest the final destination of the SQLite database
 * @param sqlSupplier the SQL that should be loaded into SQLite dbDest database
 * @param options.executableFsPath optional location of SQLite executable
 * @param options.destDbSQL optional SQL to execute in the destination (after in-memory loading)
 * @returns
 */
export async function executeOptimizedSqliteCmd(
  dbDest: string,
  sqlSupplier: FlexibleSqlTextSupplierSync,
  options?: Parameters<typeof executeSqliteCmd>[2] & {
    readonly destDbSQL?: FlexibleSqlTextSupplierSync;
  },
) {
  const inMemory = await executeSqliteCmd(inMemorySqliteDB, function* () {
    for (const SQL of sqlTextList(sqlSupplier)) {
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
        for (const SQL of sqlTextList(options.destDbSQL!)) {
          yield SQL;
        }
      }, options)
      : await executeSqliteCmd(dbDest, inMemory.stdoutRaw, options);
    return { inMemory, dest };
  }
  return { inMemory, dest: undefined };
}

/**
 * All-in-one "User Agent" (`UA`) wrapper convenient for calling from a CLI or
 * other _user agent_ environment where the end user supplies arguments and
 * options.
 * @param dbDest the final destination of the SQLite database
 * @param sqlSupplier the SQL that should be loaded into SQLite dbDest database
 * @param options
 * @returns
 */
export async function executeSqliteUA(
  dbDest: string,
  sqlSupplier: FlexibleSqlTextSupplierSync,
  options?:
    & Parameters<typeof executeSqliteCmd>[2]
    & { readonly destDbSQL?: FlexibleSqlTextSupplierSync }
    & {
      readonly removeDestFirst?: boolean;
      readonly optimization?: boolean;
      readonly dryRun?: boolean;
      // The report property shape is SQLa/lib/flow/cli.ts:Reportable but
      // we rewrite the structure here so we don't have to arbitrarily create
      // a dependency. Since TypeScript supports structured typing the compiler
      // will catch any discrepancies.
      readonly report?: {
        readonly dryRun?: (message: string) => void;
        readonly verbose?: (message: string) => void;
        readonly log?: (message: string) => void;
        readonly error?: (message: string, error?: Error) => void;
      };
    },
) {
  const { removeDestFirst, optimization = true, dryRun, report } = options ??
    {};
  const verbose = report?.verbose;
  const reportDryRun = report?.dryRun ?? report?.log ?? verbose;
  if (removeDestFirst && dbDest != inMemorySqliteDB) {
    verbose?.(`Deno.remove("${dbDest}")`);
    Deno.remove(dbDest, { recursive: true });
  }

  type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
  const reportResults = (
    results: UnwrapPromise<ReturnType<typeof executeSqliteCmd>>,
    subject?: string,
  ) => {
    if (subject) report?.log?.(subject);
    const [stdout, stderr] = [results.stdout(), results.stderr()];
    if (stdout.trim().length > 0) report?.log?.(stdout);
    if (stderr.trim().length > 0) report?.error?.(stderr);
  };

  const sttm = sqlTextTypeMessage(sqlSupplier);
  if (optimization) {
    if (!dryRun) {
      verbose?.(`executeOptimizedSqliteCmd("${dbDest}", "${sttm}")`);
      const result = await executeOptimizedSqliteCmd(
        dbDest,
        sqlSupplier,
        options,
      );
      if (result.inMemory.code !== 0) {
        reportResults(
          result.inMemory,
          `Error executing SQL from ${sttm} in memory: ${result.inMemory.code}`,
        );
      }
      if (result.dest && result.dest.code !== 0) {
        reportResults(
          result.dest,
          `Error executing SQL from ${sttm} in destination: ${result.dest.code}`,
        );
      }
      return { dbDest, sqlSupplier, options, ...result };
    } else {
      reportDryRun?.(`executeOptimizedSqliteCmd("${dbDest}", "${sttm}")`);
    }
  } else {
    if (!dryRun) {
      verbose?.(`executeSqliteCmd("${dbDest}", "${sttm}")`);
      const result = await executeSqliteCmd(dbDest, sqlSupplier, options);
      reportResults(result);
      return { dbDest, sqlSupplier, options, ...result };
    } else {
      reportDryRun?.(`executeSqliteCmd("${dbDest}", "${sttm}")`);
    }
  }
}
