import { zod as z } from "../../deps.ts";
import * as safety from "../../lib/universal/safety.ts";
import * as SQLa from "../../render/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any; // make it easier on Deno linting

export interface StateTableDefn<Context extends SQLa.SqlEmitContext> {
  readonly seedDML: string | SQLa.SqlTextSupplier<Context>[];
}

export function isStateTableDefn<Context extends SQLa.SqlEmitContext>(
  o: unknown,
): o is StateTableDefn<Context> {
  const isSTD = safety.typeGuard<StateTableDefn<Context>>(
    "seedDML",
  );
  return isSTD(o);
}
const pkcf = SQLa.primaryKeyColumnFactory<
  SQLa.SqlEmitContext,
  SQLa.SqlDomainQS
>();
export const textPrimaryKey = () => pkcf.primaryKey(z.string());

const createdAt = (omitTimeZone?: boolean) =>
  z.date(
    SQLa.zodSqlDomainRawCreateParams(
      SQLa.sqlDomainZodDateDescr({ isCreatedAt: true, omitTimeZone }),
    ),
  ).default(new Date()).optional();
const updatedAt = (omitTimeZone?: boolean) =>
  z.date(
    SQLa.zodSqlDomainRawCreateParams(
      SQLa.sqlDomainZodDateDescr({ isUpdatedAt: true, omitTimeZone }),
    ),
  ).default(new Date()).optional();
const deletedAt = (omitTimeZone?: boolean) =>
  z.date(
    SQLa.zodSqlDomainRawCreateParams(
      SQLa.sqlDomainZodDateDescr({ isDeletedAt: true, omitTimeZone }),
    ),
  ).default(new Date()).optional();
const sdf = SQLa.sqlDomainsFactory<
  Any,
  SQLa.SqlEmitContext,
  SQLa.SqlDomainQS,
  SQLa.SqlDomainsQS<SQLa.SqlDomainQS>
>();
const createdBySDF = SQLa.declareZodTypeSqlDomainFactoryFromHook(
  "created_by",
  (_zodType, init) => {
    return {
      ...sdf.anySDF.defaults<Any>(
        z.string().default("UNKNOWN").optional(),
        { isOptional: true, ...init },
      ),
      sqlDataType: () => ({ SQL: () => `TEXT` }),
      sqlDefaultValue: () => ({ SQL: () => `'UNKNOWN'` }),
      polygenixDataType: () => `string`,
    };
  },
);
const updatedBySDF = SQLa.declareZodTypeSqlDomainFactoryFromHook(
  "updated_by",
  (_zodType, init) => {
    return {
      ...sdf.anySDF.defaults<Any>(
        z.string().default("UNKNOWN").optional(),
        { isOptional: true, ...init },
      ),
      sqlDataType: () => ({ SQL: () => `TEXT` }),
      polygenixDataType: () => `string`,
    };
  },
);
const deletedBySDF = SQLa.declareZodTypeSqlDomainFactoryFromHook(
  "deleted_by",
  (_zodType, init) => {
    return {
      ...sdf.anySDF.defaults<Any>(
        z.string().default("UNKNOWN").optional(),
        { isOptional: true, ...init },
      ),
      sqlDataType: () => ({ SQL: () => `TEXT` }),
      polygenixDataType: () => `string`,
    };
  },
);

export const commonStateTableColumns = {
  from_state: z.string(),
  to_state: z.string(),
  transition_result: z.string(
    SQLa.zodSqlDomainRawCreateParams(
      SQLa.sqlDomainZodStringDescr({ isJsonText: true }),
    ),
  ),
  transition_reason: z.string(),
  created_at: createdAt(),
  created_by: z.string(SQLa.zodSqlDomainRawCreateParams(createdBySDF))
    .optional(),
  updated_at: updatedAt(),
  updated_by: z.string(SQLa.zodSqlDomainRawCreateParams(updatedBySDF))
    .optional(),
  deleted_at: deletedAt(),
  deleted_by: z.string(SQLa.zodSqlDomainRawCreateParams(deletedBySDF))
    .optional(),
  activity_log: z.string(
    SQLa.zodSqlDomainRawCreateParams(
      SQLa.sqlDomainZodStringDescr({ isJsonText: true }),
    ),
  ).optional(),
};

export function stateTable<
  TableName extends string,
  Context extends SQLa.SqlEmitContext,
  DomainQS extends SQLa.SqlDomainQS,
  DomainsQS extends SQLa.SqlDomainsQS<DomainQS>,
  ColumnsShape extends
    & z.ZodRawShape
    & Record<`${TableName}_id`, ReturnType<typeof textPrimaryKey>>,
>(
  tableName: TableName,
  userColumns: ColumnsShape,
  uniqueColumns?: string[],
  tdOptions?: SQLa.TableDefnOptions<ColumnsShape, Context, DomainQS, DomainsQS>,
) {
  const columnsShape = {
    ...userColumns,
    ...commonStateTableColumns,
  };
  const insertStmtPreparerOptions = <TableName extends string>() => {
    const result: SQLa.InsertStmtPreparerOptions<
      TableName,
      {
        created_at?: Date;
        created_by?: string;
        updated_at?: Date;
        updated_by?: string;
        deleted_at?: Date;
        deleted_by?: string;
        activity_log?: JSON;
      }, // this must match typical.columns so that isColumnEmittable is type-safe
      {
        created_at?: Date;
        created_by?: string;
        updated_at?: Date;
        updated_by?: string;
        deleted_at?: Date;
        deleted_by?: string;
        activity_log?: JSON;
      }, // this must match typical.columns so that isColumnEmittable is type-safe
      Context,
      DomainQS
    > = {
      // created_at should be filled in by the database so we don't want
      // to emit it as part of the an insert DML SQL statement
      isColumnEmittable: (name) => name == "created_at" ? false : true,
    };
    return result as SQLa.InsertStmtPreparerOptions<
      Any,
      Any,
      Any,
      Context,
      DomainQS
    >;
  };
  const defaultIspOptions = insertStmtPreparerOptions<
    TableName
  >();
  const tdrf = SQLa.tableColumnsRowFactory<
    TableName,
    typeof columnsShape,
    Context,
    DomainQS,
    DomainsQS
  >(tableName, columnsShape, {
    defaultIspOptions,
  });

  const std: StateTableDefn<Context> = {
    // seed will be used in SQL interpolation template literal, which accepts
    // either a string, SqlTextSupplier, or array of SqlTextSuppliers; in our
    // case, if seed data is provided we'll prepare the insert DMLs as an
    // array of SqlTextSuppliers
    seedDML: `-- no ${tableName} seed rows`,
  };

  // const td = SQLa.tableDefinition(tableName, columnsShape, tdOptions);
  const params = {
    ...tdOptions,
    isIdempotent: true,
    sqlNS: tdOptions?.sqlNS ?? tdOptions?.sqlNS,
  };
  if (uniqueColumns) {
    params.constraints = (props, tableName) => {
      const c = SQLa.tableConstraints(tableName, props);
      const unCol = uniqueColumns.map((column) => `${column}`);
      return [
        c.unique(
          ...unCol,
        ),
      ];
    };
  }

  const td = SQLa.tableDefinition<
    TableName,
    ColumnsShape,
    Context,
    DomainQS,
    DomainsQS
  >(
    tableName,
    columnsShape,
    params,
  );

  return {
    ...std,
    ...td,
    ...tdrf,
    select: SQLa.entitySelectStmtPreparer<
      TableName,
      ColumnsShape,
      ColumnsShape,
      Context
    >(
      tableName,
      SQLa.filterCriteriaPreparer((group) => {
        if (group === "primary-keys") {
          return td.domains.filter((d) =>
            SQLa.isTablePrimaryKeyColumnDefn(d) ? true : false
          ).map((d) => d.identity) as (keyof ColumnsShape)[];
        }
        return td.domains.filter((d) =>
          SQLa.isTableColumnFilterCriteriaDqlExclusionSupplier(d) &&
            d.isExcludedFromFilterCriteriaDql
            ? false
            : true
        ).map((d) => d.identity) as (keyof ColumnsShape)[];
      }),
    ),
  };
}
export function stateTablesFactory<
  Context extends SQLa.SqlEmitContext,
  DomainQS extends SQLa.SqlDomainQS,
  DomainsQS extends SQLa.SqlDomainsQS<DomainQS>,
>(
  defaultTdOptions?: SQLa.TableDefnOptions<Any, Context, DomainQS, DomainsQS>,
) {
  function createStateTable<
    TableName extends string,
    ColumnShape extends
      & z.ZodRawShape
      & Record<`${TableName}_id`, ReturnType<typeof textPrimaryKey>>,
    defaultTdOptions,
  >(
    tableName: TableName,
    userColumns: ColumnShape,
    uniqueColumns?: string[],
    tdOptions?: defaultTdOptions,
  ) {
    return stateTable<
      TableName,
      Context,
      DomainQS,
      DomainsQS,
      ColumnShape
    >(
      tableName,
      userColumns,
      uniqueColumns,
      tdOptions ?? defaultTdOptions,
    );
  }

  return {
    createStateTable,
    commonStateTableColumns,
    // Add other helper functions or configurations if needed
    // ...
  };
}
// You can add more utility functions or modify as needed.
