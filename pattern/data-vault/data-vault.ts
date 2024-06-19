import { zod as z } from "../../deps.ts";
import * as SQLa from "../../render/mod.ts";
import * as typ from "../typical/typical.ts";

// for convenience so that deno-lint is not required for use of `any`
// deno-lint-ignore no-explicit-any
type Any = any;

// TODO Check out [dbtvault](https://dbtvault.readthedocs.io/en/latest/tutorial/tut_hubs/)
//      for implementations of Transactional Links, Effectivity Satellites,
//      Multi-Active Satellites, Extended Tracking Satellites, As of Date Tables,
//      Point In Time (PIT) tables, and Bridge Tables.
// TODO follow [best practices](https://dbtvault.readthedocs.io/en/latest/best_practices/)
// TODO see if it makes sense to use Typescript as the source to just generate
//      `dbt` artifacts for transformations as a potential augment to PostgreSQL stored
//      procedures and `pgSQL`.

export type DataVaultDomainQS = typ.TypicalDomainQS;
export type DataVaultDomainsQS = SQLa.SqlDomainsQS<DataVaultDomainQS>;

/**
 * dataVaultDomains is a convenience object which defines aliases of all the
 * domains that we'll be using. We create "aliases" for easier maintenance and
 * extensibility (so if SQLa base domains change, we can diverge easily).
 * @returns the typical domains used by Data Vault models
 */
export function dataVaultDomains<Context extends SQLa.SqlEmitContext>() {
  return typ.governedDomains<DataVaultDomainQS, DataVaultDomainsQS, Context>();
}

/**
 * dataVaultKeys is a "data vault keys governer" builder object.
 * @returns a builder object with helper functions as properties which can be used to build DV keys
 */
export function dataVaultKeys<Context extends SQLa.SqlEmitContext>() {
  return typ.governedKeys<DataVaultDomainQS, DataVaultDomainsQS, Context>();
}

/**
 * dataVaultNames is a "data vault naming strategy governer" builder object.
 * @returns a builder object with helper functions as properties which can be used to name DV objects
 */
export function dataVaultNames<Context extends SQLa.SqlEmitContext>() {
  /**
   * All our table names should be strongly typed and consistent. Generics are
   * used so that they are passed into Zod, SQLa domain, etc. properly typed.
   * @param name the name of the table
   * @returns the transformed table name (e.g. in case prefixes should be added)
   */
  const tableName = <Name extends string, Qualified extends string = Name>(
    name: Name,
  ): Qualified => {
    // for now we're not doing anything special but that could change in future
    return name as unknown as Qualified;
  };

  const hubTableName = <
    HubName extends string,
    TableName extends `hub_${HubName}` = `hub_${HubName}`,
    Qualified extends string = TableName,
  >(name: HubName) =>
    tableName<TableName, Qualified>(`hub_${name}` as TableName);

  const hubSatelliteTableName = <
    HubName extends string,
    SatelliteName extends string,
    TableName extends `sat_${HubName}_${SatelliteName}` =
      `sat_${HubName}_${SatelliteName}`,
    Qualified extends string = TableName,
  >(hubName: HubName, satelliteName: SatelliteName) =>
    tableName<TableName, Qualified>(
      `sat_${hubName}_${satelliteName}` as TableName,
    );

  const linkTableName = <
    LinkName extends string,
    TableName extends `link_${LinkName}` = `link_${LinkName}`,
  >(linkName: LinkName) =>
    tableName<TableName>(`link_${linkName}` as TableName);

  const linkSatelliteTableName = <
    LinkName extends string,
    SatelliteName extends string,
    TableName extends `sat_${LinkName}_${SatelliteName}` =
      `sat_${LinkName}_${SatelliteName}`,
    Qualified extends string = TableName,
  >(linkName: LinkName, satelliteName: SatelliteName) =>
    tableName<TableName, Qualified>(
      `sat_${linkName}_${satelliteName}` as TableName,
    );

  return {
    tableName,
    hubTableName,
    hubSatelliteTableName,
    linkTableName,
    linkSatelliteTableName,
  };
}

/**
 * dataVaultGovn is a "data vault governer" builders object for data vault models.
 * @param ddlOptions optional DDL string template literal options
 * @returns a single object with helper functions as properties (for building models)
 */
export function dataVaultGovn<Context extends SQLa.SqlEmitContext>(
  ddlOptions: SQLa.SqlTextSupplierOptions<Context> & {
    readonly sqlNS?: SQLa.SqlNamespaceSupplier;
  },
) {
  const names = dataVaultNames<Context>();
  const domains = dataVaultDomains<Context>();
  const keys = dataVaultKeys<Context>();
  const tableLintRules = SQLa.tableLintRules<Context, DataVaultDomainQS>();

  const housekeeping = {
    columns: {
      created_at: domains.createdAt(),
      created_by: domains.text(),
      provenance: domains.text(),
    },
    insertStmtPrepOptions: <TableName extends string>() => {
      const result: SQLa.InsertStmtPreparerOptions<
        TableName,
        { created_at?: Date; created_by?: string; provenance: string }, // this must match typical.columns so that isColumnEmittable is type-safe
        { created_at?: Date }, // this must match typical.columns so that isColumnEmittable is type-safe
        Context,
        DataVaultDomainQS
      > = {
        // created_at should be filled in by the database so we don't want
        // to emit it as part of the an insert DML SQL statement
        isColumnEmittable: (name) =>
          name == "created_at" || name == "created_by" || name == "provenance",
        sqlNS: ddlOptions?.sqlNS,
      };
      return result as SQLa.InsertStmtPreparerOptions<
        Any,
        Any,
        Any,
        Context,
        DataVaultDomainQS
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
      & Record<`${TableName}_id`, ReturnType<typeof keys.ulidPrimaryKey>>
      & typeof housekeeping.columns,
  >(
    tableName: TableName,
    columnsShape: ColumnsShape,
    options?: {
      readonly sqlNS?: SQLa.SqlNamespaceSupplier;
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
          DataVaultDomainQS,
          DataVaultDomainsQS
        >;
    },
  ) => {
    const tableDefn = SQLa.tableDefinition<
      TableName,
      ColumnsShape,
      Context,
      DataVaultDomainQS,
      DataVaultDomainsQS
    >(
      tableName,
      columnsShape,
      {
        isIdempotent: true,
        sqlNS: options?.sqlNS ?? ddlOptions?.sqlNS,
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
        DataVaultDomainQS,
        DataVaultDomainsQS
      >(
        tableName,
        columnsShape,
        { defaultIspOptions },
      ),
      ...SQLa.tableSelectFactory<
        TableName,
        ColumnsShape,
        Context,
        DataVaultDomainQS,
        DataVaultDomainsQS
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

  const hubTable = <
    HubName extends string,
    ColumnsShape extends
      & z.ZodRawShape
      & Record<
        `hub_${HubName}_id`,
        ReturnType<typeof keys.ulidPrimaryKey>
      >
      & typeof housekeeping.columns,
  >(
    hubName: HubName,
    props: ColumnsShape,
    tdOptions?: SQLa.TableDefnOptions<
      ColumnsShape,
      Context,
      DataVaultDomainQS,
      DataVaultDomainsQS
    >,
  ) => {
    const hubTableName = names.hubTableName(hubName);
    const hubTableDefn = table(hubTableName, {
      ...props,
      ...housekeeping.columns,
    }, tdOptions);

    const satelliteTable = <
      SatelliteName extends string,
      ColumnsShape extends
        & z.ZodRawShape
        & Record<`hub_${HubName}_id`, ReturnType<typeof keys.ulidPrimaryKey>>
        & Record<
          `sat_${HubName}_${SatelliteName}_id`,
          ReturnType<typeof keys.ulidPrimaryKey>
        >,
    >(
      satelliteName: SatelliteName,
      columnsShape: ColumnsShape,
      tdOptions?: SQLa.TableDefnOptions<
        ColumnsShape,
        Context,
        DataVaultDomainQS,
        DataVaultDomainsQS
      >,
    ) => {
      const satTableName = names.linkSatelliteTableName(hubName, satelliteName);
      // TODO: add lint rule for checking if key or group of keys is unique
      return {
        satelliteName,
        ...table(
          satTableName,
          {
            ...columnsShape,
            ...housekeeping.columns,
          },
          { sqlNS: tdOptions?.sqlNS ?? hubTableDefn.sqlNS },
        ),
        hubTable: hubTableDefn,
        tdOptions,
      };
    };

    // TODO: add lint rule for checking if hub business key or group of keys is unique
    return {
      hubName,
      ...hubTableDefn,
      satelliteTable,
    };
  };

  const linkTable = <
    LinkName extends string,
    ColumnsShape extends
      & z.ZodRawShape
      & Record<
        `link_${LinkName}_id`,
        ReturnType<typeof keys.ulidPrimaryKey>
      >
      & typeof housekeeping.columns,
  >(
    linkName: LinkName,
    props: ColumnsShape,
    tdOptions?: SQLa.TableDefnOptions<
      ColumnsShape,
      Context,
      DataVaultDomainQS,
      DataVaultDomainsQS
    >,
  ) => {
    const linkTableName = names.linkTableName(linkName);
    const linkTableDefn = table(linkTableName, {
      ...props,
      ...housekeeping.columns,
    }, tdOptions);

    const satelliteTable = <
      SatelliteName extends string,
      ColumnsShape extends
        & z.ZodRawShape
        & Record<`link_${LinkName}_id`, ReturnType<typeof keys.ulidPrimaryKey>>
        & Record<
          `sat_${LinkName}_${SatelliteName}_id`,
          ReturnType<typeof keys.ulidPrimaryKey>
        >,
    >(
      satelliteName: SatelliteName,
      columnsShape: ColumnsShape,
    ) => {
      const satTableName = names.linkSatelliteTableName(
        linkName,
        satelliteName,
      );
      // TODO: add lint rule for checking if key or group of keys is unique
      return {
        satelliteName,
        ...table(
          satTableName,
          {
            ...columnsShape,
            ...housekeeping.columns,
          },
          { sqlNS: tdOptions?.sqlNS ?? linkTableDefn.sqlNS },
        ),
        linkTable: linkTableDefn,
      };
    };

    // TODO: add lint rule for checking if hub business key or group of keys is unique
    return {
      linkName,
      ...linkTableDefn,
      satelliteTable,
    };
  };

  const exceptionHubTable = (() => {
    const tableName = "hub_exception";
    const columns = {
      hub_exception_id: keys.ulidPrimaryKey(),
      exception_hub_key: domains.text(),
      ...housekeeping.columns,
    };
    return table(tableName, columns);
  })();

  const hubExceptionDiagnosticSatTable = (() => {
    const tableName = "sat_exception_diagnostic";
    const columns = {
      sat_exception_diagnostic_id: keys.ulidPrimaryKey(),
      hub_exception_id: exceptionHubTable.references
        .hub_exception_id(),
      hub_exception_id_ref: domains.text(),
      message: domains.text(),
      err_returned_sqlstate: domains.text(),
      err_pg_exception_detail: domains.text(),
      err_pg_exception_hint: domains.text(),
      err_pg_exception_context: domains.text(),
      ...housekeeping.columns,
    };
    return table(tableName, columns);
  })();

  const hubExceptionHttpClientSatTable = (() => {
    const tableName = "sat_exception_http_client";
    const columns = {
      sat_exception_http_client_id: keys.ulidPrimaryKey(),
      hub_exception_id: exceptionHubTable.references
        .hub_exception_id(),
      http_req: domains.jsonTextNullable(),
      http_resp: domains.jsonTextNullable(),
      ...housekeeping.columns,
    };
    return table(tableName, columns);
  })();

  return {
    names,
    domains,
    keys,
    housekeeping,
    table,
    tableLintRules,
    hubTable,
    linkTable,
    exceptionHubTable,
    hubExceptionDiagnosticSatTable,
    hubExceptionHttpClientSatTable,
  };
}

/**
 * dataVaultTemplateState is a "typical schema" emitter object for data vault models.
 * @returns a single object with helper functions as properties (for executing SQL templates)
 */
export function dataVaultTemplateState<Context extends SQLa.SqlEmitContext>(
  ddlOptions?: {
    readonly defaultNS?: SQLa.SqlNamespaceSupplier;
  },
) {
  const gts = typ.governedTemplateState<
    DataVaultDomainQS,
    DataVaultDomainsQS,
    Context
  >();
  return {
    ...gts,
    ...dataVaultGovn<Context>({
      ...gts.ddlOptions,
      sqlNS: ddlOptions?.defaultNS,
    }),
  };
}
