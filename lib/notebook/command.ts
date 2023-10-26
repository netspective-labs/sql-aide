import { stdLog as l } from "./deps.ts";
import {
  flexibleTextList,
  FlexibleTextSupplierSync,
} from "../universal/flexible-text.ts";
// deno-lint-ignore no-explicit-any
type Any = any;

/**
 * Represents an object capable of being "executed" in order to product a result.
 * Executables should be idempotency-aware and should only execute once if their
 * results are not idempotent unless force? is used.
 */
export type ExecutableCell<
  ExecuteResult,
  ExecuteState,
> = {
  readonly execute: (
    options?: {
      readonly force?: boolean;
      readonly onSuccess?: (er: ExecuteResult) => Promise<ExecuteResult>;
      readonly onError?: (err: Error) => Promise<ExecuteResult>;
    },
  ) => Promise<ExecuteResult>;
  readonly executionState: () => ExecuteState;
  readonly executedResult: () => ExecuteResult;
};

export function isExecutableCell<
  ExecuteResult,
  State,
>(
  cell: unknown,
): cell is ExecutableCell<ExecuteResult, State> {
  if (cell && typeof cell === "object" && "execute" in cell) return true;
  return false;
}

/**
 * Represents an object capable of writing unstructured data, possibly
 * asynchronously. The writer can write chunks of data of type `W`,
 * which can be any type but is typically a Uint8Array.
 *
 * @template W - The type of data chunk that the writer can handle.
 */
export type PipeInRawWriter<W = Any> = {
  write(chunk: W): Promise<void>;
};

/**
 * A supplier function that provides a `PipeInRawWriter` instance to handle
 * input (often for piping purposes). It is expected to complete a side
 * effect, such as writing data, and may do so asynchronously.
 *
 * @template W - The type of data chunk that the corresponding `PipeInRawWriter` can handle.
 */
export type PipeInRawWriterSupplier<W = Any> = (
  stdin: PipeInRawWriter<W>,
) => Promise<void> | void;

/**
 * Represents an object capable of receiving a `PipeInRawWriterSupplier` and
 * using it to supply data. This is typically part of a piping operation
 * where data flows from one command to another. The method `pipeInRaw` is
 * used to connect the supplier in the pipeline.
 *
 * @template ToCell - The type of the next step or stage in the pipeline
 * following the current operation, allowing for chaining of operations.
 */
export type PipeInRawSupplier<
  FromCell extends ExecutableCell<Any, Any>,
  ToCell,
> = {
  pipeInRaw(pirws: PipeInRawWriterSupplier<Uint8Array>, from: FromCell): ToCell;
};

/**
 * Factory function to create a supplier capable of writing both piped data
 * and direct content to a standard input stream (`stdin`). It handles the
 * data from previous commands in the pipeline and the immediate content
 * provided to the current command. This supplier supports logging and
 * uniquely identifying the stream for debugging purposes.
 *
 * @param content - List of content items,
 * each can be a Uint8Array or synchronous text supplier, representing the data to write to `stdin`.
 * @param options - Optional parameters to control logging and identify the operation.
 * @param options.identity - Identifier for the logging source, default is "stdinSupplier".
 * @param options.pipeInRawSuppliers - Suppliers for data that comes
 * from the output of previous commands in the pipeline.
 * @param options.logger - Logger instance for logging debug information.
 * @returns ssynchronous function that takes a `PipeInRawWriter` for `stdin` and handles the writing operation,
 * including both piped data and direct content.
 */
export const pipeInRawSupplierFactory = (
  content: (Uint8Array | FlexibleTextSupplierSync)[],
  options?: {
    readonly identity?: string;
    readonly pipeInRawSuppliers?: PipeInRawWriterSupplier<Uint8Array>[];
    readonly logger?: l.Logger;
  },
) => {
  return async (stdin: PipeInRawWriter<Uint8Array>) => {
    // this is usually the result of a pipe from a previous command so grab
    // that output first
    if (options?.pipeInRawSuppliers) {
      for (const pi of options.pipeInRawSuppliers) {
        await pi(stdin);
      }
    }

    // now, the rest of the stdin comes from what was supplied in this instance
    const logger = options?.logger;
    for (const c of content) {
      if (c instanceof Uint8Array) {
        await stdin.write(c);
        if (logger?.level == l.LogLevels.DEBUG) {
          const te = new TextDecoder();
          logger?.debug(
            options?.identity ?? "stdinSupplier",
            te.decode(c),
          );
        }
      } else {
        const te = new TextEncoder();
        for (const text of flexibleTextList(c)) {
          await stdin.write(te.encode(text));
          if (logger?.level == l.LogLevels.DEBUG) {
            logger?.debug(
              options?.identity ?? "stdinSupplier",
              text,
            );
          }
        }
      }
    }
  };
};

/**
 * Convert a set of PipeInRawWriterSupplier<Uint8Array>[] instances to a single
 * string.
 * @param pirs the function that will generate incoming pipe data
 * @returns string representation of all the items in pirs
 */
export async function pipeInRawSuppliersText(
  pirs: ReturnType<typeof pipeInRawSupplierFactory>,
) {
  const buffer: Uint8Array[] = [];
  await pirs({
    // deno-lint-ignore require-await
    write: async (content) => {
      buffer.push(content);
    },
  });
  const td = new TextDecoder();
  const strings = buffer.map((b) => td.decode(b));
  return strings.join();
}

/**
 * Creates a `spawn` function capable of executing a command or process.
 * The command to run can be specified as a string, URL, or a supplier function.
 * The resulting `spawn` function is used to execute the command with specific arguments,
 * handle the process's input stream, and log various execution details.
 *
 * @param cmdSupplier - The command to be executed. This can be:
 *   1. A string specifying the command.
 *   2. A URL object pointing to the location of a resource (e.g., script file).
 *   3. A function returning a string or URL, which allows dynamic determination of the command.
 *      The function receives a purpose argument ("spawn") and the arguments for the process.
 * @returns an async `spawn` function with the following parameters:
 *   1. `argsSupplier`: Function or an array supplying the arguments for the command; processed by `flexibleTextList`.
 *   2. `stdinSupplier` (optional): A function to handle the input stream of the spawned process.
 *      This function, if provided, receives a writable stream and is expected to handle the writing of input data.
 *   3. `logger` (optional): A logging utility object used for logging information about the process execution.
 *      It's assumed to have methods like `info` and `debug` for logging, and properties like `level` to determine the log level.
 *
 * The `spawn` function executes the command with the supplied arguments, pipes the standard streams (stdin, stdout, stderr),
 * and, if provided, logs execution details (like the command, arguments, and exit code) and debug information
 * (including the entire Deno.Command object and streams).
 * It waits for the process to complete and returns an object containing details about the command's execution,
 * including the command object, exit code, stdout, and stderr contents.
 *
 * @example
 * const execute = spawnable('ls');
 * const result = await execute(['-l'], undefined, customLogger);
 * // The `result` would contain details about the 'ls -l' command execution.
 */
export function spawnable(
  cmdSupplier:
    | string
    | URL
    | ((purpose: "spawn", ...args: string[]) => string | URL),
) {
  return async function spawn(
    argsSupplier: FlexibleTextSupplierSync,
    stdinSupplier?: PipeInRawWriterSupplier<Uint8Array>,
    logger?: l.Logger,
  ) {
    const args = flexibleTextList(argsSupplier);
    const command = typeof cmdSupplier === "function"
      ? cmdSupplier("spawn", ...args)
      : cmdSupplier;
    const cmd = new Deno.Command(command, {
      args: flexibleTextList(argsSupplier),
      stdin: "piped",
      stdout: "piped",
      stderr: "piped",
    });
    const child = cmd.spawn();

    if (stdinSupplier) {
      const stdInWriter = child.stdin.getWriter();
      await stdinSupplier(stdInWriter);
      await stdInWriter.ready;
      stdInWriter.close();
    }

    const { code, stdout, stderr } = await child.output();
    if (
      logger?.level == l.LogLevels.INFO || logger?.level == l.LogLevels.DEBUG
    ) {
      logger.info("spawnable", { command, args, stdinSupplier, code });
    }
    if (logger?.level == l.LogLevels.DEBUG) {
      logger.debug("spawnable", {
        "Deno.Command": cmd,
        stdinSupplier,
        stdout,
        stderr,
      });
    }
    // Ensure that the status of the child process does not block the Deno process from exiting.
    child.unref();
    return { command: cmd, code, stdout, stderr };
  };
}

export type Spawnable = ReturnType<typeof spawnable>;
export type SpawnableResult = Awaited<ReturnType<Spawnable>>;

export function spawnedContent(sr: SpawnableResult) {
  const td = new TextDecoder();
  return {
    ...sr,
    text: () => td.decode(sr.stdout),
    errText: () => td.decode(sr.stderr),
    json: <Shape>() => JSON.parse(td.decode(sr.stdout)) as Shape,
    array: <Shape>() => JSON.parse(td.decode(sr.stdout)) as Shape[],
  };
}

export type SpawnedResultPipeInWriter = (
  sr: SpawnableResult,
  writer: PipeInRawWriter<Uint8Array>,
) => Promise<void>;

/**
 * Represents a single content cell in a command pipeline, managing internal content
 * and supporting data piping with configurable logging. This class allows for content
 * accumulation and transformation, suitable for operations in a command pattern, particularly
 * resembling a UNIX-style pipeline.
 *
 * Instances of `ContentCell` can carry content, transform it to text, pipe it to other
 * content cells or commands, and perform these actions with optional logging.
 */
export class ContentCell {
  #logger?: l.Logger;
  #content: (Uint8Array | FlexibleTextSupplierSync)[] = [];
  #pipeInRawSuppliers?: PipeInRawWriterSupplier<Uint8Array>[];

  constructor(
    readonly options?: {
      readonly identity?: string;
      readonly content?: (Uint8Array | FlexibleTextSupplierSync)[];
      readonly stdinLogger?: l.Logger;
      readonly processLogger?: l.Logger;
    },
  ) {
    if (options?.stdinLogger) this.logger(options.stdinLogger);
    if (options?.content) this.content(...options.content);
  }

  logger(logger: l.Logger) {
    this.#logger = logger;
    return this;
  }

  content(...content: (Uint8Array | FlexibleTextSupplierSync)[]) {
    this.#content.push(...content);
    return this;
  }

  async text() {
    return await pipeInRawSuppliersText(
      pipeInRawSupplierFactory(this.#content, {
        identity: this.options?.identity,
        pipeInRawSuppliers: this.#pipeInRawSuppliers,
        logger: this.#logger,
      }),
    );
  }

  pipe<NextAction extends PipeInRawSupplier<Any, NextAction>>(
    action: NextAction,
  ) {
    const sis = pipeInRawSupplierFactory(this.#content, {
      identity: this.options?.identity,
      pipeInRawSuppliers: this.#pipeInRawSuppliers,
      logger: this.#logger,
    });
    return action.pipeInRaw(sis, this);
  }

  static content(options?: ConstructorParameters<typeof ContentCell>[0]) {
    return new ContentCell(options);
  }
}

export class SpawnableProcessCellError<Cell extends SpawnableProcessCell>
  extends Error {
  constructor(
    readonly cause: Error,
    readonly cell: Cell,
    readonly spawnResult?: Awaited<
      ReturnType<ReturnType<typeof spawnable>>
    >,
  ) {
    super(cause.message);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SpawnableProcessCellError<Cell>);
    }

    this.name = "SpawnableProcessCellError";
  }
}

/**
 * Handler which can be passed into pipe options.stdIn to automatically
 * wrap the spawn results into spawn content for convenient access to
 * strongly typed data from previous command's execution result.
 * @param handler function which accepts spawned content and writes to STDIN for next command
 * @returns a handler function to pass into pipe options.stdIn
 */
export function pipeInSpawnedContent(
  handler: (
    sc: ReturnType<typeof spawnedContent>,
    writer: PipeInRawWriter<Uint8Array>,
  ) => Promise<void>,
): SpawnedResultPipeInWriter {
  return async (sr, writer) => await handler(spawnedContent(sr), writer);
}

/**
 * Represents a notebook cell (manageable unit) for a spawnable process within
 * a larger command orchestration system. It's designed to create, configure,
 * and manage the lifecycle of a child process, including its standard input,
 * command-line arguments, and output handling. The class supports chaining and
 * composition paradigms, allowing the construction of complex command
 * pipelines and process workflows using the Builder pattern.
 *
 * This is an idempotent cell and will only be executed once, memoize its
 * results, and return the memoized value if execute is called more than once
 * unless force is supplied.
 */
export class SpawnableProcessCell
  implements ExecutableCell<SpawnableResult, "not-executed" | "executed"> {
  #suppliedArgs: string[] = [];
  #stdinLogger?: l.Logger;
  #processLogger?: l.Logger;
  #stdinSuppliers: (Uint8Array | FlexibleTextSupplierSync)[] = [];
  #pipeInFrom?: ExecutableCell<Any, Any>[];
  #pipeInRawSuppliers?: PipeInRawWriterSupplier<Uint8Array>[];

  #executeState: "not-executed" | "executed" = "not-executed";
  #executedResult?: SpawnableResult;

  constructor(
    readonly process: ReturnType<typeof spawnable>,
    readonly options?: {
      readonly identity?: string;
      readonly stdinLogger?: l.Logger;
      readonly processLogger?: l.Logger;
      readonly onError?: (error?: Error) => Promise<SpawnableResult>;
    },
  ) {
    if (options?.stdinLogger) this.stdinLogger(options.stdinLogger);
    if (options?.processLogger) this.processLogger(options.processLogger);
  }

  stdinLogger(logger: l.Logger) {
    this.#stdinLogger = logger;
    return this;
  }

  processLogger(logger: l.Logger) {
    this.#processLogger = logger;
    return this;
  }

  // add arguments to the command that will be executed by execute()
  args(...args: string[]) {
    this.#suppliedArgs.push(...args);
    return this;
  }

  // allows subclasses to organize and provide the "final" commands when execute() is called
  executeArgs() {
    // remove duplicates and maintain insertion order
    return [...new Set(this.#suppliedArgs)];
  }

  // add content that will be passed in via stdin when execute() is called
  stdin(sqlSupplier: Uint8Array | FlexibleTextSupplierSync) {
    this.#stdinSuppliers.push(sqlSupplier);
    return this;
  }

  // called by pipe() command as a way of informing the next cell about the
  // previous cell's output (meaning stdout from previous cell becomes stdin for
  // this cell)
  pipeInRaw(
    pirws: PipeInRawWriterSupplier<Uint8Array>,
    from: ExecutableCell<Any, Any>,
  ) {
    if (isExecutableCell(this.#pipeInFrom)) {
      if (this.#pipeInFrom === undefined) this.#pipeInFrom = [];
      this.#pipeInFrom.push(from);
    }

    if (this.#pipeInRawSuppliers === undefined) this.#pipeInRawSuppliers = [];
    this.#pipeInRawSuppliers.push(pirws);
    return this;
  }

  executionState() {
    return this.#executeState;
  }

  executedResult() {
    if (this.#executeState !== "executed") {
      throw Error(
        "Only call SpawnableProcessCell.executedResult if executionState() is 'executed'",
      );
    }
    return this.#executedResult!;
  }

  async execute(
    options?: Parameters<ExecutableCell<Any, Any>["execute"]>[0],
  ): Promise<SpawnableResult> {
    // we're idempotent so don't re-execute unless forced to
    if (!options?.force && this.executionState() == "executed") {
      if (options?.onSuccess) return options.onSuccess(this.executedResult());
      return this.executedResult();
    }

    // if we have some "from" pipes that have not run yet, do so now
    if (this.#pipeInFrom && this.#pipeInFrom.length > 0) {
      for (const from of this.#pipeInFrom) {
        await from.execute(options);
      }
    }

    // if we get to here we're "forcing" (overriding idempotency)
    try {
      this.#executedResult = await this.process(
        this.executeArgs(),
        pipeInRawSupplierFactory(this.#stdinSuppliers, {
          identity: this.options?.identity,
          pipeInRawSuppliers: this.#pipeInRawSuppliers,
          logger: this.#stdinLogger,
        }),
        this.#processLogger,
      );
      this.#executeState = "executed";
      if (options?.onSuccess) return options.onSuccess(this.#executedResult!);
      return this.#executedResult!;
    } catch (err) {
      if (options?.onError) return options.onError(err);
      if (this.options?.onError) return this.options.onError(err);
      throw new SpawnableProcessCellError(err, this, undefined);
    }
  }

  async text() {
    return new TextDecoder().decode((await this.execute()).stdout);
  }

  async json<Shape>() {
    return JSON.parse(await this.text()) as Shape;
  }

  /**
   * Accept a "next action" which will take the content from this cell's STDOUT
   * and send it as STDIN for the next action. If
   * @param action the next action cell instance
   * @param options optional configuration
   * @returns next action instance with pipe flows setup
   */
  pipe<NextAction extends PipeInRawSupplier<Any, NextAction>>(
    action: NextAction,
    options?: { readonly stdIn?: SpawnedResultPipeInWriter },
  ) {
    return action.pipeInRaw(async (writer) => {
      const er = await this.execute();
      if (options?.stdIn) {
        await options.stdIn(er, writer);
      } else {
        await writer.write(er.stdout);
      }
    }, this);
  }

  static process(
    process: ConstructorParameters<typeof SpawnableProcessCell>[0],
    options?: ConstructorParameters<typeof SpawnableProcessCell>[1],
  ) {
    return new SpawnableProcessCell(process, options);
  }
}

/**
 * A convenience class which wraps SpawnableProcessCell for any type of CLI
 * shell that can accept SQL and emit text or JSON output. Examples include
 * SQLite shell, PostgreSQL psql, and DuckDB.
 *
 * This class encapsulates the functionality for constructing, executing, and
 * managing SQL shell commands, leveraging the capabilities provided by the
 * `SpawnableProcessCell` for process management. It allows direct interactions
 * with the database, including executing SQL commands, changing database files,
 * and parsing responses, while abstracting away the lower-level details of
 * process management and I/O handling.
 */
export class SqlShellCell extends SpawnableProcessCell {
  constructor(
    readonly process: ReturnType<typeof spawnable>,
    options?: {
      readonly identity?: string;
      readonly sqlSupplier?: Uint8Array | FlexibleTextSupplierSync;
      readonly sqlLogger?: l.Logger;
      readonly processLogger?: l.Logger;
    },
  ) {
    super(process, {
      identity: options?.identity,
      stdinLogger: options?.sqlLogger,
      processLogger: options?.processLogger,
    });
    if (options?.sqlSupplier) this.SQL(options.sqlSupplier);
  }

  sqlLogger(logger: l.Logger) {
    this.stdinLogger(logger);
    return this;
  }

  SQL(sqlSupplier: Uint8Array | FlexibleTextSupplierSync) {
    this.stdin(sqlSupplier);
    return this;
  }
}

/**
 * A convenience class which wraps SqlShellCell for the `sqlite3` or any other
 * SQLite shell.
 */
export class SqliteCell extends SqlShellCell {
  static readonly COMMAND = "sqlite3";
  static readonly sqliteSP = spawnable(SqliteCell.COMMAND);

  #filename = ":memory:";

  constructor(
    options?: {
      readonly identity?: string;
      readonly process?: ReturnType<typeof spawnable>;
      readonly filename?: string;
      readonly sqlSupplier?: Uint8Array | FlexibleTextSupplierSync;
      readonly sqlLogger?: l.Logger;
      readonly processLogger?: l.Logger;
      readonly outputJSON?: boolean;
    },
  ) {
    super(options?.process ?? SqliteCell.sqliteSP, {
      identity: options?.identity ?? SqliteCell.COMMAND,
      sqlLogger: options?.sqlLogger,
      processLogger: options?.processLogger,
    });
    if (options?.filename) this.#filename = options.filename;
    if (options?.sqlSupplier) this.SQL(options.sqlSupplier);
    if (options?.outputJSON) this.outputJSON();
  }

  filename(filename: string) {
    this.#filename = filename;
    return this;
  }

  outputJSON() {
    this.args("--json");
    return this;
  }

  pragma(supplier: string | { dump: true }) {
    if (typeof supplier == "string") {
      this.SQL(supplier);
    } else {
      if (supplier.dump) {
        this.SQL("\n.dump");
      }
    }
    return this;
  }

  executeArgs() {
    return [this.#filename, ...super.executeArgs()];
  }

  async json<Shape>() {
    this.outputJSON(); // make sure to pass in "--json" to SQLite arguments
    return await super.json<Shape>();
  }

  static sqlite3(options?: ConstructorParameters<typeof SqliteCell>[0]) {
    return new SqliteCell(options);
  }
}

export const content = ContentCell.content;
export const process = SpawnableProcessCell.process;
export const sqlite3 = SqliteCell.sqlite3;
