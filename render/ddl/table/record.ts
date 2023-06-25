import { zod as z } from "../../deps.ts";
import * as r from "../../../lib/universal/record.ts";
import * as d from "../../domain/mod.ts";
import * as tmpl from "../../emit/mod.ts";
import * as i from "../../dml/insert.ts";
import * as c from "./column.ts";
import * as pk from "./primary-key.ts";
import * as t from "./table.ts";

// deno-lint-ignore no-explicit-any
type Any = any; // make it easy on linter

export function tableColumnsRowFactory<
  TableName extends string,
  ColumnsShape extends z.ZodRawShape,
  Context extends tmpl.SqlEmitContext,
  DomainQS extends d.SqlDomainQS,
  DomainsQS extends d.SqlDomainsQS<DomainQS>,
>(
  tableName: TableName,
  props: ColumnsShape,
  tdrfOptions?:
    & t.TableDefnOptions<ColumnsShape, Context, DomainQS, DomainsQS>
    & {
      defaultIspOptions?: i.InsertStmtPreparerOptions<
        TableName,
        Any,
        Any,
        Context,
        DomainQS
      >;
    },
) {
  // we compute the tableDefn here instead of having it passed in because
  // Typescript cannot carry all the proper types if we don't generate it here
  const td = t.tableDefinition(tableName, props, tdrfOptions);
  const columns = Array.from(Object.values(td.columns));

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
  type ExcludeFromInsertDML = {
    [
      Property in keyof ColumnsShape as Extract<
        Property,
        ColumnsShape[Property] extends
          { sqlDomain: { isExcludedFromInsertDML: true } } ? Property
          : never
      >
    ]: true;
  };
  type ExcludeKeysFromFromInsertDML = Extract<
    keyof EntireRecord,
    keyof ExcludeFromInsertDML
  >;

  type OptionalInInsertableRecord = {
    [
      Property in keyof ColumnsShape as Extract<
        Property,
        ColumnsShape[Property] extends
          { sqlDomain: { isOptionalInInsertableRecord: true } } ? Property
          : never
      >
    ]: true;
  };
  type OptionalKeysInInsertableRecord = Extract<
    keyof EntireRecord,
    keyof OptionalInInsertableRecord
  >;

  type AllButExcludedAndOptional = Omit<
    Omit<EntireRecord, ExcludeKeysFromFromInsertDML>,
    OptionalKeysInInsertableRecord
  >;
  type InsertableRecord =
    & AllButExcludedAndOptional
    & Partial<Pick<EntireRecord, OptionalKeysInInsertableRecord>>;
  type InsertableObject = r.TabularRecordToObject<InsertableRecord>;

  // we let Typescript infer function return to allow generics in sqlDomains to
  // be more effective but we want other parts of the `result` to be as strongly
  // typed as possible
  const result = {
    prepareInsertable: (
      o: InsertableObject,
      rowState?: r.TransformTabularRecordsRowState<InsertableRecord>,
      options?: r.TransformTabularRecordOptions<InsertableRecord>,
    ) => r.transformTabularRecord(o, rowState, options),
    insertRawDML: i.typicalInsertStmtPreparerSync<
      TableName,
      InsertableRecord,
      EntireRecord,
      Context,
      DomainQS
    >(
      tableName,
      (group) => {
        if (group === "primary-keys") {
          return columns.filter((d) =>
            pk.isTablePrimaryKeyColumnDefn(d) ? true : false
          );
        }
        return columns.filter((d) =>
          c.isTableColumnInsertDmlExclusionSupplier(d) &&
            d.isExcludedFromInsertDML
            ? false
            : true
        );
      },
      undefined,
      tdrfOptions?.defaultIspOptions,
    ),
    insertDML: i.typicalInsertStmtPreparerSync<
      TableName,
      InsertableRecord,
      EntireRecord,
      Context,
      DomainQS
    >(
      tableName,
      (group) => {
        if (group === "primary-keys") {
          return columns.filter((d) =>
            pk.isTablePrimaryKeyColumnDefn(d) ? true : false
          );
        }
        return columns.filter((d) =>
          c.isTableColumnInsertDmlExclusionSupplier(d) &&
            d.isExcludedFromInsertDML
            ? false
            : true
        );
      },
      (ir) => {
        const parsed = td.zoSchema.safeParse(ir);
        if (parsed.success) return parsed.data as InsertableRecord;

        const nonSqlTextSupplierErrors = parsed.error.errors.filter((err) => {
          if (
            err.code === "invalid_type" && err.received === "object" &&
            typeof err.path === "string"
          ) {
            if (tmpl.isSqlTextSupplier(ir[err.path])) return false;
            return true;
          }
        });

        if (nonSqlTextSupplierErrors.length == 0) return ir as InsertableRecord;
        throw parsed.error;
      },
      tdrfOptions?.defaultIspOptions,
    ),
  };
  return result;
}
