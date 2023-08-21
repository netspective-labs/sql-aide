import * as csvPS from "https://deno.land/std@0.198.0/csv/csv_parse_stream.ts";
import * as fsg from "./governance.ts";
import * as v from "../reflect/value.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export interface TabularFileRaw<Entry, Row extends string[]>
  extends fsg.File<Entry, Row> {
  readonly source: fsg.File<Entry, Uint8Array>;
  readonly toArray: (
    iterable: AsyncIterable<Row>,
    transform?: (row: Row) => Row,
  ) => Promise<Row[]>;
}

export function tabularFileRaw<
  Entry,
  File extends fsg.File<Entry, Uint8Array>,
>(source: File) {
  const tfu: TabularFileRaw<Entry, string[]> = {
    fsEntry: source.fsEntry,
    source,
    readable: async () =>
      (await source.readable())
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new csvPS.CsvParseStream()),
    readableSync: () =>
      source.readableSync()
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new csvPS.CsvParseStream()),
    toArray: async (iterable, transform) => {
      const arr: string[][] = [];
      if (transform) {
        for await (const item of iterable) arr.push(transform(item));
      } else {
        for await (const item of iterable) arr.push(item);
      }
      return arr;
    },
  };
  return tfu;
}

export interface TabularFileUntyped<
  Entry,
  Row extends string[] | Record<string, string | unknown>,
> extends fsg.File<Entry, Row> {
  readonly source: fsg.File<Entry, Uint8Array>;
  readonly toArray: (
    iterable: AsyncIterable<Row>,
    transform?: (row: Row) => Row,
  ) => Promise<Row[]>;
}

export function tabularFileUntyped<
  Entry,
  File extends fsg.File<Entry, Uint8Array>,
>(source: File, options: csvPS.CsvParseStreamOptions = { skipFirstRow: true }) {
  const tfu: TabularFileUntyped<
    Entry,
    string[] | Record<string, string | unknown>
  > = {
    fsEntry: source.fsEntry,
    source,
    readable: async () =>
      (await source.readable())
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new csvPS.CsvParseStream(options)),
    readableSync: () =>
      source.readableSync()
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new csvPS.CsvParseStream(options)),
    toArray: async (iterable, transform) => {
      const arr: (string[] | Record<string, string | unknown>)[] = [];
      if (transform) {
        for await (const item of iterable) arr.push(transform(item));
      } else {
        for await (const item of iterable) arr.push(item);
      }
      return arr;
    },
  };
  return tfu;
}

export interface TabularFile<
  Entry,
  Row extends Record<string, Any>,
> extends fsg.File<Entry, Row> {
  readonly source: fsg.File<Entry, Uint8Array>;
  readonly toArray: (
    iterable: AsyncIterable<Row>,
    transform?: (row: Row) => Row,
  ) => Promise<Row[]>;
}

export function tabularFile<
  Entry,
  File extends fsg.File<Any, Uint8Array>,
  Row extends Record<string, Any>,
>(source: File, transform?: (row: Row) => Row) {
  const tfu: TabularFileUntyped<Entry, Row> = {
    fsEntry: source.fsEntry,
    source,
    readable: async () =>
      (await source.readable())
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new csvPS.CsvParseStream({ skipFirstRow: true }))
        .pipeThrough(
          new v.TransformObjectValuesStream({ finalize: transform }),
        ),
    readableSync: () =>
      source.readableSync()
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new csvPS.CsvParseStream({ skipFirstRow: true }))
        .pipeThrough(
          new v.TransformObjectValuesStream({ finalize: transform }),
        ),
    toArray: async (iterable, transform) => {
      const arr: Row[] = [];
      if (transform) {
        for await (const item of iterable) arr.push(transform(item));
      } else {
        for await (const item of iterable) arr.push(item);
      }
      return arr;
    },
  };
  return tfu;
}
