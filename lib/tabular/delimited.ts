import { streamingCSV as t } from "./deps.ts";
import { ValueNature } from "./value.ts";

export interface TabularContent<Row> {
  readonly rowsStream: () => {
    readonly stream: AsyncIterable<Row>;
    readonly close?: () => void;
  };
  readonly rows: () => Promise<Row[]>;
}

export interface TabularContentBuilderContext<Row> {
  factory: (cells: string[]) => Row;
  encountered?: (
    ir: IteratorResult<Row>,
    cells: string[],
    isReprocessing: boolean,
  ) => "skip" | "reprocess" | void;
  done?: () => void;
}

/**
 * Transforms an asynchronous iterable of asynchronous iterables using a factory function.
 *
 * For each outer iterable, it collects all the values from the inner iterable,
 * then applies the factory function to produce an output value. The function
 * then returns these output values as an asynchronous iterable.
 *
 * @template Input - The type of the inner iterable values.
 * @template Output - The type of the output values after transformation.
 *
 * @param iterator - The outer asynchronous iterable of inner asynchronous iterables.
 * @param factory - The factory function to transform collected inner values to an output value.
 *
 * @returns An asynchronous iterable of transformed values.
 */
function transformIterable<
  Output,
  Context extends TabularContentBuilderContext<Output>,
>(
  iterator: AsyncIterable<AsyncIterable<string>>,
  ctx: Context,
): AsyncIterable<Output> {
  return {
    [Symbol.asyncIterator]() {
      const outerIterator = iterator[Symbol.asyncIterator]();

      return {
        next: async () => {
          async function recursableNext(): Promise<IteratorResult<Output>> {
            const outerResult = await outerIterator.next();
            if (outerResult.done) {
              ctx.done?.();
              return { value: undefined, done: true };
            }

            const innerValues: string[] = [];
            const innerIterator = outerResult.value[Symbol.asyncIterator]();
            const innerIterable = {
              [Symbol.asyncIterator]: () => innerIterator,
            };

            for await (const value of innerIterable) {
              innerValues.push(value);
            }

            let ir = { value: ctx.factory(innerValues), done: false };
            let encResult = ctx.encountered?.(ir, innerValues, false);

            // sometimes the ctx factory might change and require reprocessing
            if (encResult === "reprocess") {
              ir = { value: ctx.factory(innerValues), done: false };
              encResult = ctx.encountered?.(ir, innerValues, true);
            }

            // if we need to skip this record then go to the next one (the usual
            // reason to skip a row is because it's a header row)
            if (encResult === "skip") {
              return await recursableNext();
            }

            return ir;
          }

          return await recursableNext();
        },
      };
    },
  };
}

export interface TabularContentObjBuilderContext<Row>
  extends TabularContentBuilderContext<Row> {
  propNames: string[];
  valueNatures?: ValueNature[];
  encountered: (
    ir: IteratorResult<Row>,
    cells: string[],
    isReprocessing: boolean,
  ) => "skip" | "reprocess" | void;
  done?: () => void;
}

/**
 * delimitedText Context instance which transforms each row from a text array
 * to an object whose props are the column names from the first row and value
 * is either a string or a typed `ValueNature` transformed value
 * @param options property names and value transformation suppliers
 * @returns a Context instance that can be passed into delimitedText options `context` parameter
 */
export function toObjectContext<Row>(
  options?: {
    propNames?: (headerRow: string[]) => string[];
    valueNatures?: (sampleRow: string[]) => ValueNature[];
  },
) {
  // (hr) => hr
  let headerRow: string[];
  let propNames: string[] = [];
  let valueNatures: ValueNature[] | undefined;
  let rowIndex = 0;
  const ctx: TabularContentObjBuilderContext<Row> = {
    propNames,
    factory: (cells) => cells as Row,
    encountered: (ir, cells, isReprocessing) => {
      // we assume the first row is the headers row
      if (rowIndex == 0) {
        headerRow = ir.value;
        propNames = options?.propNames?.(headerRow) ?? headerRow;
        ctx.propNames = propNames;
        ctx.factory = (cells) => {
          const instance: Record<string, unknown> = {};
          for (let hc = 0; hc < headerRow.length; hc++) {
            const name = propNames[hc];
            const value = cells[hc];
            instance[name] = value;
          }
          return instance as Row;
        };

        rowIndex++;
        return "skip"; // skip this row in results
      }

      // we assume the second row is the sample of data we should use to
      // detect the value types
      if (rowIndex == 1 && !isReprocessing) {
        valueNatures = options?.valueNatures?.(cells);
        ctx.valueNatures = valueNatures;
        if (valueNatures) {
          ctx.factory = (cells) => {
            const instance: Record<string, unknown> = {};
            for (let hc = 0; hc < headerRow.length; hc++) {
              const name = propNames[hc];
              const detectedVN = valueNatures![hc];
              instance[name] = detectedVN.transform(cells[hc], detectedVN);
            }
            return instance as Row;
          };
          return "reprocess"; // we changed the factory, reprocess it
        }
      }
      rowIndex++;
    },
  };
  return ctx;
}

export function delimitedText<
  Row,
  Context extends TabularContentBuilderContext<Row>,
>(
  source: Deno.Reader & Partial<Deno.Closer>,
  options?: Partial<t.CommonCSVReaderOptions> & {
    readonly context?: () => Context;
  },
): TabularContent<Row> {
  const context = options?.context ??
    (() => {
      const ctx: TabularContentBuilderContext<Row> = {
        factory: (cells) => cells as Row,
      };
      return ctx as Context;
    });

  const rowsStream = () => {
    return {
      stream: transformIterable<Row, Context>(
        t.readCSV(source, options),
        context(),
      ),
      close: source.close,
    };
  };

  const rows = async () => {
    const ctx = context();
    const result: Row[] = [];
    for await (const untypedRow of t.readCSV(source, options)) {
      const cells: string[] = [];
      for await (const cell of untypedRow) {
        cells.push(cell);
      }
      let row = ctx.factory(cells);
      let encResult = ctx.encountered?.(
        { value: row, done: false },
        cells,
        false,
      );
      if (encResult == "reprocess") {
        row = ctx.factory(cells);
        encResult = ctx.encountered?.({ value: row, done: false }, cells, true);
      }
      if (encResult !== "skip") {
        result.push(row);
      }
    }
    ctx.done?.();
    source.close?.();
    return result;
  };

  return {
    rowsStream,
    rows,
  };
}
