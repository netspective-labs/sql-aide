// import * as r from "../reflect/reflect.ts";

// deno-lint-ignore ban-types
export type UntypedObject = object;
export type UntypedTabularRecordObject = UntypedObject;

export type SnakeToCamelCase<S extends string> = S extends
  `${infer P1}_${infer P2}${infer P3}`
  ? `${Lowercase<P1>}${Uppercase<P2>}${SnakeToCamelCase<P3>}`
  : Lowercase<S>;

export type CamelToSnakeCase<S extends string> = S extends
  `${infer T}${infer U}`
  ? `${T extends Capitalize<T> ? "_" : ""}${Lowercase<T>}${CamelToSnakeCase<U>}`
  : S;

// deep, 1:1 mapping of a SQL table-like object to its camelCase JS counterpart
export type TabularRecordToObject<T> = {
  [K in keyof T as SnakeToCamelCase<string & K>]: T[K] extends Date ? T[K]
    // deno-lint-ignore ban-types
    : (T[K] extends object ? TabularRecordToObject<T[K]> : T[K]);
};

// deep, 1:1 mapping of a camelCase JS object to its snake_case SQL-like counterpart
export type ObjectToTabularRecord<T> = {
  [K in keyof T as CamelToSnakeCase<string & K>]: T[K] extends Date ? T[K]
    // deno-lint-ignore ban-types
    : (T[K] extends object ? ObjectToTabularRecord<T[K]> : T[K]);
};

export type ValueTransformer<Value, Result> = (value: Value) => Result;

export type ObjectTransformer<T extends UntypedObject> = {
  // deno-lint-ignore no-explicit-any
  [K in keyof T]: ValueTransformer<T[K], T[K] | any>;
};

// "CC" is camelCase, "SC" is snakeCase
export type CamelToSnakeCaseObjectTransformer<
  SrcCC extends UntypedObject,
  DestSC extends ObjectToTabularRecord<SrcCC> = ObjectToTabularRecord<SrcCC>,
> = {
  [DestKeySC in keyof DestSC]: ValueTransformer<
    DestKeySC extends keyof DestSC ? DestSC[DestKeySC] : never,
    DestSC[DestKeySC]
  >;
};

// "CC" is camelCase, "SC" is snakeCase
export type SnakeToCamelCaseObjectTransformer<
  SrcSC extends UntypedTabularRecordObject,
  DestCC extends TabularRecordToObject<SrcSC> = TabularRecordToObject<SrcSC>,
> = {
  [DestKeyCC in keyof DestCC]: ValueTransformer<
    DestKeyCC extends keyof SrcSC ? SrcSC[DestKeyCC] : never,
    DestCC[DestKeyCC]
  >;
};

/**
 * TabularRecordID identifies a single row of data within a list of records.
 */
export type TabularRecordID = number | string;

/**
 * TabularRecordIdRef is a reference to another "table"'s TabularRecordID. It
 * is equivalent to a foreign key reference.
 */
export type TabularRecordIdRef = TabularRecordID;

/**
 * TabularRecordsIdentity is a table or view name; it's abstract so that it can
 * serve multiple purposes.
 */
export type TabularRecordsIdentity = string;

export interface TransformTabularRecordsRowState<
  TableRecord extends UntypedTabularRecordObject,
> {
  rowIndex: number;
  rowID: (rowIndex: number) => TabularRecordID;
  readonly records: TableRecord[];
}

export interface TransformTabularRecordsRowStateSupplier<
  TableRecord extends UntypedTabularRecordObject,
> {
  readonly rowState: TransformTabularRecordsRowState<TableRecord>;
}

export type FilterOrTransform<
  TableRecord extends UntypedTabularRecordObject,
  Safe,
  Unsafe,
> = (
  value: Safe,
  rowState?: TransformTabularRecordsRowState<TableRecord>,
) => Unsafe | false;

export type FilterOrTransformText<
  TableRecord extends UntypedTabularRecordObject,
> = FilterOrTransform<TableRecord, string, string>;

export interface TransformTabularRecordOptions<
  TableRecord extends UntypedTabularRecordObject,
  TableObject extends TabularRecordToObject<TableRecord> =
    TabularRecordToObject<
      TableRecord
    >,
  PropertyName extends keyof TableObject = keyof TableObject,
  ColumnName extends keyof TableRecord = keyof TableRecord,
> {
  readonly defaultValues?: (
    o: TableObject,
    rowState?: TransformTabularRecordsRowState<TableRecord>,
  ) => TableRecord;
  readonly filterPropUnsafe?: FilterOrTransform<
    TableRecord,
    PropertyName | string,
    string
  >;
  readonly filterProp?: FilterOrTransform<TableRecord, PropertyName, string>;
  readonly filterColumn?: FilterOrTransform<TableRecord, ColumnName, string>;
  readonly transformColumn?: Partial<ObjectTransformer<TableRecord>>;
  readonly transformRecord?: (constructed: TableRecord) => TableRecord;
}

export const snakeToCamelCase = (str: string) =>
  str.replace(/([-_]\w)/g, (g) => g[1].toUpperCase());

export const camelToSnakeCase = (str: string) =>
  str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

/**
 * transformTabularRecord transforms an object to its "tabular" representation,
 * basically converting each camelCase name to snake_case and copying the
 * data over for requested snake_cased column names with flexible per-property
 * transformation options.
 * @param o the object to convert to a table-like structure
 * @param options in case defaults should be provided or denormalization is required
 * @returns a clone of o with property names converted to snake case
 */
export function transformTabularRecord<
  TableRecord extends UntypedTabularRecordObject,
  TableObject extends TabularRecordToObject<TableRecord> =
    TabularRecordToObject<
      TableRecord
    >,
>(
  o: TableObject,
  rowState?: TransformTabularRecordsRowState<TableRecord>,
  options?: TransformTabularRecordOptions<TableRecord>,
): TableRecord {
  const {
    filterColumn,
    filterProp,
    filterPropUnsafe,
    transformColumn,
  } = options ?? {};
  const filterPropertyName =
    (filterProp || filterPropUnsafe) as FilterOrTransformText<TableRecord>;
  const columnTV = transformColumn
    ? (transformColumn as {
      [key: string]: (value: unknown) => unknown;
    })
    : undefined;
  const result = Object.entries(o).reduce(
    (row, kv) => {
      const propName = filterPropertyName
        ? (filterPropertyName(kv[0], rowState))
        : kv[0];
      if (propName) {
        const snakeCasePropName = camelToSnakeCase(propName);
        const colName = filterColumn
          ? ((filterColumn as FilterOrTransformText<TableRecord>)(
            snakeCasePropName,
          ))
          : snakeCasePropName;
        if (colName) {
          const value = kv[1];
          if (columnTV && colName in columnTV) {
            row[colName] = columnTV[colName](value);
          } else {
            row[colName] = value;
          }
        }
      }
      return row;
    },
    (options?.defaultValues?.(o, rowState) ?? {}) as Record<
      string,
      unknown
    >,
  ) as TableRecord;
  return options?.transformRecord ? options?.transformRecord(result) : result;
}

/**
 * transformTabularRecords transforms a list of object to its "tabular" representation,
 * converting each camelCase name to snake_case and copying the data over for
 * requested camelCase property names.
 * @param records the object instances to convert to a table-like structure
 * @param options in case defaults should be provided or denormalization is required
 * @returns a clone of objects with property names converted to snake case
 */
export function transformTabularRecords<
  // deno-lint-ignore ban-types
  TableRecord extends object,
  TableObject extends TabularRecordToObject<TableRecord> =
    TabularRecordToObject<
      TableRecord
    >,
>(
  records: Iterable<TableObject>,
  options?: TransformTabularRecordOptions<TableRecord>,
): TableRecord[] {
  const result: TableRecord[] = [];
  const rowState: TransformTabularRecordsRowState<TableRecord> = {
    rowID: (rowIndex) => rowIndex,
    rowIndex: 0,
    records: result,
  };
  for (const r of records) {
    result.push(transformTabularRecord(r, rowState, options));
    rowState.rowIndex++;
  }
  return result;
}
