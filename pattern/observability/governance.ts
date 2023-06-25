import { zod as z } from "../../deps.ts";
import * as SQLa from "../../render/mod.ts";
import * as typ from "../typical/typical.ts";

// for convenience so that deno-lint is not required for use of `any`
// deno-lint-ignore no-explicit-any
type Any = any;

export type ObservabilityDomainQS = typ.TypicalDomainQS;
export type ObservabilityDomainsQS = SQLa.SqlDomainsQS<ObservabilityDomainQS>;

/**
 * Convenience object which defines aliases of all the domains that we'll be using.
 * We create "aliases" for easier maintenance and extensibility (so if SQLa base
 * domains change, we can diverge easily).
 * @returns the typical domains used by observability models
 */
export function observabilityDomains<Context extends SQLa.SqlEmitContext>() {
  return typ.governedDomains<
    ObservabilityDomainQS,
    ObservabilityDomainsQS,
    Context
  >();
}

/**
 * A "observability keys governer" builder object.
 * @returns a builder object with helper functions as properties which can be used to build observability keys
 */
export function observabilityKeys<Context extends SQLa.SqlEmitContext>() {
  return typ.governedKeys<
    ObservabilityDomainQS,
    ObservabilityDomainsQS,
    Context
  >();
}

/**
 * A "observability naming strategy governer" builder object.
 * @returns a builder object with helper functions as properties which can be used to name observability objects
 */
export function observabilityNames<Context extends SQLa.SqlEmitContext>() {
  return typ.governedNamingStrategy<Context>();
}

/**
 * Observability models governer builders object for observability models.
 * Instead of aliasing "typical.ts", we duplicate our own functions for easier
 * maintenance and extensibility with fewer dependencies.
 * @param ddlOptions optional DDL string template literal options
 * @returns a single object with helper functions as properties (for building models)
 */
export function observabilityGovn<Context extends SQLa.SqlEmitContext>(
  ddlOptions: SQLa.SqlTextSupplierOptions<Context> & {
    readonly sqlNS?: SQLa.SqlNamespaceSupplier;
  },
) {
  const tcf = SQLa.tableColumnFactory<Any, Any, ObservabilityDomainQS>();
  const names = observabilityNames<Context>();
  const domains = observabilityDomains<Context>();
  const keys = observabilityKeys<Context>();
  const tableLintRules = SQLa.tableLintRules<Context, ObservabilityDomainQS>();

  const housekeeping = {
    columns: {
      created_at: domains.createdAt(),
      created_by: domains.text(),
    },
    insertStmtPrepOptions: <TableName extends string>() => {
      const result: SQLa.InsertStmtPreparerOptions<
        TableName,
        { created_at?: Date; created_by?: string; provenance: string }, // this must match typical.columns so that isColumnEmittable is type-safe
        { created_at?: Date }, // this must match typical.columns so that isColumnEmittable is type-safe
        Context,
        ObservabilityDomainQS
      > = {
        // created_at should be filled in by the database so we don't want
        // to emit it as part of the an insert DML SQL statement
        isColumnEmittable: (name) =>
          name == "created_at" || name == "created_by" || name == "provenance",
      };
      return result as SQLa.InsertStmtPreparerOptions<
        Any,
        Any,
        Any,
        Context,
        ObservabilityDomainQS
      >;
    },
  };

  /**
   * All of our "content" or "transaction" tables will follow a specific format,
   * namely that they will have a single primary key with the same name as the
   * table with _id appended and common "houskeeping" columns like created_at.
   * TODO: figure out how to automatically add ...housekeeping() to the end of
   * each table (it's easy to add at the start of each table, but we want them
   * at the end after all the "content" columns).
   * @param tableName
   * @param columnsShape
   * @returns
   */
  const table = <
    TableName extends string,
    ColumnsShape extends
      & z.ZodRawShape
      & Record<`${TableName}_id`, ReturnType<typeof keys.autoIncPrimaryKey>>
      & typeof housekeeping.columns,
  >(
    tableName: TableName,
    columnsShape: ColumnsShape,
    options?: {
      readonly constraints?: <
        TableName extends string,
      >(
        columnsShape: ColumnsShape,
        tableName: TableName,
      ) => SQLa.TableColumnsConstraint<ColumnsShape, Context>[];
      readonly lint?:
        & SQLa.TableNameConsistencyLintOptions
        & SQLa.FKeyColNameConsistencyLintOptions<
          Context,
          ObservabilityDomainQS,
          ObservabilityDomainsQS
        >;
    },
  ) => {
    const tableDefn = SQLa.tableDefinition<
      TableName,
      ColumnsShape,
      Context,
      ObservabilityDomainQS,
      ObservabilityDomainsQS
    >(
      tableName,
      columnsShape,
      {
        isIdempotent: true,
        sqlNS: ddlOptions?.sqlNS,
        constraints: options?.constraints,
      },
    );
    const defaultIspOptions = housekeeping.insertStmtPrepOptions<
      TableName
    >();
    const result = {
      ...tableDefn,
      ...SQLa.tableColumnsRowFactory<
        TableName,
        ColumnsShape,
        Context,
        ObservabilityDomainQS,
        ObservabilityDomainsQS
      >(
        tableName,
        columnsShape,
        { defaultIspOptions },
      ),
      ...SQLa.tableSelectFactory<
        TableName,
        ColumnsShape,
        Context,
        ObservabilityDomainQS,
        ObservabilityDomainsQS
      >(
        tableName,
        columnsShape,
      ),
      defaultIspOptions, // in case others need to wrap the call
    };

    const rules = tableLintRules.typical(result);
    rules.lint(result, options?.lint);

    return result;
  };

  const obs_service_id = keys.autoIncPrimaryKey();
  const service = table(names.tableName("obs_service"), {
    obs_service_id,
    parent_service_id: domains.selfRef(obs_service_id).optional(),
    service_name: tcf.unique(domains.text()),
    ...housekeeping.columns,
  });

  return {
    names,
    domains,
    keys,
    housekeeping,
    table,
    tableLintRules,
    service,
  };
}
