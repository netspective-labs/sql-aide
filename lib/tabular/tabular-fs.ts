import { csvPS } from "./deps.ts";
import * as fs from "../fs/governance.ts";
import * as d from "./delimited.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export interface TabularFile<Row>
  extends fs.File<fs.CanonicalPathSupplier<string>, string[]> {
  readonly source: fs.File<fs.CanonicalPathSupplier<string>, Uint8Array>;
  readonly readable: () => Promise<ReadableStream<string[]>>;
  readonly rows: () => Promise<Row[]>;
  // TODO: add rowsStream: () => AsyncIterable<Row>?
}

export function tabularFile<
  File extends fs.File<fs.CanonicalPathSupplier<string>, Uint8Array>,
  Row,
  Strategy extends d.TabularContentStrategy<Row>,
>(
  source: File,
  options?: {
    readonly strategy?: () => Strategy;
  },
) {
  const strategySupplier = options?.strategy ??
    (() => {
      const strategy: d.TabularContentStrategy<Row> = {
        factory: (cells) => cells as Row,
      };
      return strategy as Strategy;
    });

  const readable = async () => {
    return (await source.readable())
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new csvPS.CsvParseStream());
  };

  const rows = async () => {
    const strategy = strategySupplier();
    const result: Row[] = [];
    for await (const untypedRow of (await readable()).values()) {
      const cells: string[] = [];
      for await (const cell of untypedRow) {
        cells.push(cell);
      }
      let row = strategy.factory(cells);
      let encResult = strategy.encountered?.(
        { value: row, done: false },
        cells,
        false,
      );
      if (encResult == "reprocess") {
        row = strategy.factory(cells);
        encResult = strategy.encountered?.(
          { value: row, done: false },
          cells,
          true,
        );
      }
      if (encResult !== "skip") {
        result.push(row);
      }
    }
    strategy.done?.();
    return result;
  };

  const tf: TabularFile<Any> = {
    fsEntry: source.fsEntry,
    source,
    readable,
    rows,
  };
  return tf;
}

export async function* tabularFiles<
  File extends fs.File<fs.CanonicalPathSupplier<string>, Uint8Array>,
>(
  sources: () => AsyncIterable<File>,
  options?: {
    readonly isTabularFile: (f: File) => false | {
      readonly file: File;
      readonly strategy: d.TabularContentStrategy<Any>;
    };
  },
) {
  const isTabularFile = options?.isTabularFile ?? ((f: File) => {
    if (f.fsEntry.canonicalPath.toLowerCase().endsWith(".csv")) {
      return {
        file: f,
        strategy: d.tcObjectStrategy(),
      };
    }
    return false;
  });
  for await (const f of sources()) {
    const instructions = isTabularFile(f);
    if (instructions) {
      yield tabularFile(f, { strategy: () => instructions.strategy });
    }
  }
}
