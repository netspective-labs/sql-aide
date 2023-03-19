import { zod as z } from "../../deps.ts";
import * as r from "../../lib/universal/record.ts";
import * as tmpl from "../../emit/mod.ts";
import * as cr from "../../dql/criteria.ts";
import * as s from "../../dql/select.ts";
import * as c from "./column.ts";
import * as pk from "./primary-key.ts";
import * as t from "./table.ts";

// deno-lint-ignore no-explicit-any
type Any = any; // make it easy on linter

export function tableSelectFactory<
  TableName extends string,
  ColumnsShape extends z.ZodRawShape,
  Context extends tmpl.SqlEmitContext,
>(
  tableName: TableName,
  props: ColumnsShape,
  tdrfOptions?: t.TableDefnOptions<ColumnsShape, Context> & {
    defaultFcpOptions?: cr.FilterCriteriaPreparerOptions<Any, Context>;
    defaultSspOptions?: s.SelectStmtPreparerOptions<
      TableName,
      Any,
      Any,
      Context
    >;
  },
) {
  const td = t.tableDefinition(tableName, props, tdrfOptions);
  const columns = Array.from(Object.values(td.columns)) as c.TableColumnDefn<
    TableName,
    Any,
    Any,
    Context
  >[];

  type OptionalInInsertableRecord = {
    [
      Property in keyof ColumnsShape as Extract<
        Property,
        ColumnsShape[Property] extends { isOptionalInInsertableRecord: true }
          ? Property
          : never
      >
    ]: true;
  };
  type OptionalKeysInInsertableRecord = Extract<
    keyof EntireRecord,
    keyof OptionalInInsertableRecord
  >;

  // deno-lint-ignore ban-types
  type requiredKeys<T extends object> = {
    [k in keyof T]: undefined extends T[k] ? never : k;
  }[keyof T];

  type addQuestionMarks<
    // deno-lint-ignore ban-types
    T extends object,
    R extends keyof T = requiredKeys<T>,
  > // O extends keyof T = optionalKeys<T>
   = Pick<Required<T>, R> & Partial<T>;

  type EntireRecord = addQuestionMarks<
    {
      [Property in keyof ColumnsShape]: ColumnsShape[Property] extends
        z.ZodType<infer T, infer D, infer I>
        ? z.infer<z.ZodType<T, D, I>> | tmpl.SqlTextSupplier<Context>
        : never;
    }
  >;

  type FilterableRecord =
    & Omit<EntireRecord, OptionalKeysInInsertableRecord>
    & Partial<Pick<EntireRecord, OptionalKeysInInsertableRecord>>;
  type FilterableColumnName = keyof FilterableRecord & string;
  type FilterableObject = r.TabularRecordToObject<FilterableRecord>;

  // we let Typescript infer function return to allow generics in sqlDomains to
  // be more effective but we want other parts of the `result` to be as strongly
  // typed as possible
  return {
    prepareFilterable: (
      o: FilterableObject,
      rowState?: r.TransformTabularRecordsRowState<FilterableRecord>,
      options?: r.TransformTabularRecordOptions<FilterableRecord>,
    ) => r.transformTabularRecord(o, rowState, options),
    select: s.entitySelectStmtPreparer<
      TableName,
      FilterableRecord,
      EntireRecord,
      Context
    >(
      tableName,
      cr.filterCriteriaPreparer((group) => {
        if (group === "primary-keys") {
          return columns.filter((tc) =>
            pk.isTablePrimaryKeyColumnDefn(tc) ? true : false
          ).map((d) => d.identity) as FilterableColumnName[];
        }
        return columns.filter((tc) =>
          c.isTableColumnFilterCriteriaDqlExclusionSupplier(tc) &&
            tc.isExcludedFromFilterCriteriaDql
            ? false
            : true
        ).map((d) => d.identity) as FilterableColumnName[];
      }, tdrfOptions?.defaultFcpOptions),
      tdrfOptions?.defaultSspOptions,
    ),
  };
}
