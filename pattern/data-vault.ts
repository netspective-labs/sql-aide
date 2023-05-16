import { zod as z } from "../deps.ts";
import * as SQLa from "../render/mod.ts";
import * as typ from "./typical.ts";

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

export type DataVaultDomainGovn = typ.GovernedDomain;

/**
 * dataVaultDomains is a convenience object which defines aliases of all the
 * domains that we'll be using. We create "aliases" for easier maintenance and
 * extensibility (so if SQLa base domains change, we can diverge easily).
 * @returns the typical domains used by Data Vault models
 */
export function dataVaultDomains<Context extends SQLa.SqlEmitContext>() {
  return typ.governedDomains<DataVaultDomainGovn, Context>();
}

/**
 * dataVaultKeys is a "data vault keys governer" builder object.
 * @returns a builder object with helper functions as properties which can be used to build DV keys
 */
export function dataVaultKeys<Context extends SQLa.SqlEmitContext>() {
  return typ.governedKeys<DataVaultDomainGovn, Context>();
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
  const tableLintRules = SQLa.tableLintRules<Context>();

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
        Context
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
        Context
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
      readonly constraints?: <
        TableName extends string,
      >(
        columnsShape: ColumnsShape,
        tableName: TableName,
      ) => SQLa.TableColumnsConstraint<ColumnsShape, Context>[];
      readonly lint?:
        & SQLa.TableNameConsistencyLintOptions
        & SQLa.FKeyColNameConsistencyLintOptions<Context>;
    },
  ) => {
    const tableDefn = SQLa.tableDefinition<TableName, ColumnsShape, Context>(
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
      ...SQLa.tableColumnsRowFactory<TableName, ColumnsShape, Context>(
        tableName,
        columnsShape,
        { defaultIspOptions },
      ),
      ...SQLa.tableSelectFactory<TableName, ColumnsShape, Context>(
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
  >(hubName: HubName, props: ColumnsShape) => {
    const hubTableName = names.hubTableName(hubName);
    const hubTableDefn = table(hubTableName, {
      ...props,
      ...housekeeping.columns,
    });

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
        ),
        hubTable: hubTableDefn,
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
  >(linkName: LinkName, props: ColumnsShape) => {
    const linkTableName = names.linkTableName(linkName);
    const linkTableDefn = table(linkTableName, {
      ...props,
      ...housekeeping.columns,
    });

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

  return {
    names,
    domains,
    keys,
    housekeeping,
    table,
    tableLintRules,
    hubTable,
    linkTable,
  };
}

/**
 * dataVaultTemplateState is a "typical schema" emitter object for data vault models.
 * @returns a single object with helper functions as properties (for executing SQL templates)
 */
export function dataVaultTemplateState<Context extends SQLa.SqlEmitContext>() {
  return typ.governedTemplateState<DataVaultDomainGovn, Context>();
}
