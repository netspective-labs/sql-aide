import { zod as z } from "../../deps.ts";
import * as SQLa from "../../render/mod.ts";
import * as et from "./enum-table.ts";
import * as diaPUML from "../../render/diagram/plantuml-ie-notation.ts";

// for convenience so that deno-lint is not required for use of `any`
// deno-lint-ignore no-explicit-any
type Any = any;

export type TypicalDomainQS = SQLa.SqlDomainQS;
export type TypicalDomainsQS = SQLa.SqlDomainsQS<TypicalDomainQS>;

/**
 * governedDomains is a convenience object which defines aliases of all the
 * domains that we'll be using. We create "aliases" for easier maintenance and
 * extensibility (so if SQLa base domains change, we can diverge easily).
 * @returns the typical domains used by models
 */
export function governedDomains<
  DomainQS extends TypicalDomainQS,
  DomainsQS extends TypicalDomainsQS,
  Context extends SQLa.SqlEmitContext,
>() {
  const sdf = SQLa.sqlDomainsFactory<Any, Context, DomainQS, DomainsQS>();

  // all domains should be functions that can be used directly in Zod objects;
  // these can be direct SqlDomain object or Zod with meta data passed through
  // either ZodBaggage or SQLa.zodSqlDomainRawCreateParams().
  return {
    sdf,
    textArray: z.array(z.string()),
    text: z.string,
    textNullable: () => z.string().optional(),

    varChar: (maxLength: number) =>
      z.string(
        SQLa.zodSqlDomainRawCreateParams(
          SQLa.sqlDomainZodStringDescr({ isVarChar: true }),
        ),
      ).max(maxLength),
    varCharNullable: (maxLength: number) =>
      z.string(
        SQLa.zodSqlDomainRawCreateParams(
          SQLa.sqlDomainZodStringDescr({ isVarChar: true }),
        ),
      ).max(maxLength).optional(),

    integer: () => z.number().int(),
    integerNullable: () => z.number().int().optional(),

    float: () =>
      z.number(
        SQLa.zodSqlDomainRawCreateParams(
          SQLa.sqlDomainZodNumberDescr({
            isFloat: true,
            isBigFloat: false,
            isSerial: false,
          }),
        ),
      ),
    floatNullable: () =>
      z.number(
        SQLa.zodSqlDomainRawCreateParams(
          SQLa.sqlDomainZodNumberDescr({
            isFloat: true,
            isBigFloat: false,
            isSerial: false,
          }),
        ),
      ).optional(),

    bigFloat: () =>
      z.number(
        SQLa.zodSqlDomainRawCreateParams(
          SQLa.sqlDomainZodNumberDescr({
            isFloat: true,
            isBigFloat: true,
            isSerial: false,
          }),
        ),
      ),
    bigFloatNullable: () =>
      z.number(
        SQLa.zodSqlDomainRawCreateParams(
          SQLa.sqlDomainZodNumberDescr({
            isFloat: true,
            isBigFloat: true,
            isSerial: false,
          }),
        ),
      ).optional(),
    serial: () =>
      z.number(
        SQLa.zodSqlDomainRawCreateParams(
          SQLa.sqlDomainZodNumberDescr({
            isFloat: false,
            isBigFloat: false,
            isSerial: true,
          }),
        ),
      ).optional(),
    jsonText: () =>
      z.string(
        SQLa.zodSqlDomainRawCreateParams(
          SQLa.sqlDomainZodStringDescr({ isJsonText: true }),
        ),
      ),
    jsonTextNullable: () =>
      z.string(
        SQLa.zodSqlDomainRawCreateParams(
          SQLa.sqlDomainZodStringDescr({ isJsonText: true }),
        ),
      ).optional(),

    jsonB: SQLa.zodJsonB(),
    jsonbNullable: () => SQLa.zodJsonB().optional(),

    boolean: z.boolean,
    booleanNullable: () => z.boolean().optional(),

    date: z.date,
    dateNullable: () => z.date().optional(),

    dateTime: () =>
      z.date(
        SQLa.zodSqlDomainRawCreateParams(
          SQLa.sqlDomainZodDateDescr({ isDateTime: true }),
        ),
      ),
    dateTimeNullable: () =>
      z.date(
        SQLa.zodSqlDomainRawCreateParams(
          SQLa.sqlDomainZodDateDescr({ isDateTime: true }),
        ),
      ).optional(),

    createdAt: () =>
      z.date(
        SQLa.zodSqlDomainRawCreateParams(
          SQLa.sqlDomainZodDateDescr({ isCreatedAt: true }),
        ),
      ).default(new Date()).optional(),
    updatedAt: () =>
      z.date(
        SQLa.zodSqlDomainRawCreateParams(
          SQLa.sqlDomainZodDateDescr({ isUpdatedAt: true }),
        ),
      ).default(new Date()).optional(),

    deletedAt: () =>
      z.date(
        SQLa.zodSqlDomainRawCreateParams(
          SQLa.sqlDomainZodDateDescr({ isDeletedAt: true }),
        ),
      ).optional(),

    ulid: () => z.string().ulid(),
    ulidNullable: () => z.string().ulid().optional(),

    uuid: () => z.string().uuid(),
    uuidNullable: () => z.string().uuid().optional(),
    // TODO [NL Aide Migration]:
    // unique: SQLa.uniqueContraint,

    selfRef: <ZTA extends z.ZodTypeAny>(zodType: ZTA) =>
      SQLa.selfRef<ZTA, Context, DomainQS, DomainsQS>(zodType, sdf),

    semver: () =>
      z.string(
        SQLa.zodSqlDomainRawCreateParams(
          SQLa.sqlDomainZodStringDescr({ isSemver: true }),
        ),
      ),
  };
}

/**
 * governedKeys is a "typical keys governer" builder object.
 * @returns a builder object with helper functions as properties which can be used to build model keys
 */
export function governedKeys<
  DomainQS extends TypicalDomainQS,
  DomainsQS extends TypicalDomainsQS,
  Context extends SQLa.SqlEmitContext,
>() {
  // we create our aliases in a function and use the function instead of passing
  // in governedDomains as an argument because deep-generics type-safe objects
  // will be available through inference.
  const pkcf = SQLa.primaryKeyColumnFactory<Context, DomainQS>();
  const { ulid } = governedDomains<DomainQS, DomainsQS, Context>();

  const textPrimaryKey = () => pkcf.primaryKey(z.string());
  const ulidPrimaryKey = () => pkcf.primaryKey(ulid());
  const autoIncPrimaryKey = pkcf.autoIncPrimaryKey;

  return {
    textPrimaryKey,
    ulidPrimaryKey,
    autoIncPrimaryKey,
  };
}

/**
 * governedNamingStrategy is a "typical naming strategy governer" builder object.
 * @returns a builder object with helper functions as properties which can be used to name DV objects
 */
export function governedNamingStrategy<Context extends SQLa.SqlEmitContext>() {
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

  return {
    tableName,
  };
}

/**
 * governedSchema is a "typical schema" builders object for database models.
 * @param ddlOptions optional DDL string template literal options
 * @returns a single object with helper functions as properties (for building models)
 */
export function governedModel<
  DomainQS extends TypicalDomainQS,
  DomainsQS extends TypicalDomainsQS,
  Context extends SQLa.SqlEmitContext,
>(
  ddlOptions: SQLa.SqlTextSupplierOptions<Context> & {
    readonly sqlNS?: SQLa.SqlNamespaceSupplier;
  },
) {
  const names = governedNamingStrategy<Context>();
  const domains = governedDomains<DomainQS, DomainsQS, Context>();
  const keys = governedKeys<DomainQS, DomainsQS, Context>();
  const tableLintRules = SQLa.tableLintRules<Context, DomainQS>();
  const tcFactory = SQLa.tableColumnFactory<Any, Context, DomainQS>();
  const createdBySDF = SQLa.declareZodTypeSqlDomainFactoryFromHook(
    "created_by",
    (_zodType, init) => {
      return {
        ...domains.sdf.anySDF.defaults<Any>(
          z.string().default("UNKNOWN").optional(),
          { isOptional: true, ...init },
        ),
        sqlDataType: () => ({ SQL: () => `TEXT` }),
        sqlDefaultValue: () => ({ SQL: () => `'UNKNOWN'` }),
      };
    },
  );
  const updatedBySDF = SQLa.declareZodTypeSqlDomainFactoryFromHook(
    "updated_by",
    (_zodType, init) => {
      return {
        ...domains.sdf.anySDF.defaults<Any>(
          z.string().default("UNKNOWN").optional(),
          { isOptional: true, ...init },
        ),
        sqlDataType: () => ({ SQL: () => `TEXT` }),
      };
    },
  );
  const deletedBySDF = SQLa.declareZodTypeSqlDomainFactoryFromHook(
    "deleted_by",
    (_zodType, init) => {
      return {
        ...domains.sdf.anySDF.defaults<Any>(
          z.string().default("UNKNOWN").optional(),
          { isOptional: true, ...init },
        ),
        sqlDataType: () => ({ SQL: () => `TEXT` }),
      };
    },
  );

  const housekeeping = {
    columns: {
      created_at: domains.createdAt(),
      created_by: z.string(SQLa.zodSqlDomainRawCreateParams(createdBySDF))
        .optional(),
      updated_at: domains.updatedAt(),
      updated_by: z.string(SQLa.zodSqlDomainRawCreateParams(updatedBySDF))
        .optional(),
      deleted_at: domains.deletedAt(),
      deleted_by: z.string(SQLa.zodSqlDomainRawCreateParams(deletedBySDF))
        .optional(),
      activity_log: domains.jsonbNullable(),
    },
    insertStmtPrepOptions: <TableName extends string>() => {
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
    },
  };

  /**
   * All of our "content" or "transaction" tables will follow a specific format,
   * namely that they will have a single primary key with the same name as the
   * table with _id appended and common "housekeeping" columns like created_at.
   * @param tableName the name of table
   * @param coreColumnsShape all the columns except primary key and housekeeping
   * @returns
   */
  const textPkTable = <
    TableName extends string,
    ColumnsShape extends
      & z.ZodRawShape
      & Record<`${TableName}_id`, ReturnType<typeof keys.textPrimaryKey>>
      & typeof housekeeping.columns,
  >(
    tableName: TableName,
    columnsShape: ColumnsShape,
    options?:
      & SQLa.TableDefnOptions<ColumnsShape, Context, DomainQS, DomainsQS>
      & {
        readonly lint?:
          & SQLa.TableNameConsistencyLintOptions
          & SQLa.FKeyColNameConsistencyLintOptions<
            Context,
            DomainQS,
            DomainsQS
          >;
      },
  ) => {
    const tableDefn = SQLa.tableDefinition<
      TableName,
      ColumnsShape,
      Context,
      DomainQS,
      DomainsQS
    >(
      tableName,
      columnsShape,
      {
        ...options,
        isIdempotent: true,
        sqlNS: options?.sqlNS ?? ddlOptions?.sqlNS,
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
        DomainQS,
        DomainsQS
      >(
        tableName,
        columnsShape,
        { defaultIspOptions },
      ),
      ...SQLa.tableSelectFactory<
        TableName,
        ColumnsShape,
        Context,
        DomainQS,
        DomainsQS
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

  /**
   * All of our "content" or "transaction" tables will follow a specific format,
   * namely that they will have a single primary key with the same name as the
   * table with _id appended and common "housekeeping" columns like created_at.
   * @param tableName the name of table
   * @param coreColumnsShape all the columns except primary key and housekeeping
   * @returns
   */
  const autoIncPkTable = <
    TableName extends string,
    ColumnsShape extends
      & z.ZodRawShape
      & Record<`${TableName}_id`, ReturnType<typeof keys.autoIncPrimaryKey>>
      & typeof housekeeping.columns,
  >(
    tableName: TableName,
    columnsShape: ColumnsShape,
    options?:
      & SQLa.TableDefnOptions<ColumnsShape, Context, DomainQS, DomainsQS>
      & {
        readonly lint?:
          & SQLa.TableNameConsistencyLintOptions
          & SQLa.FKeyColNameConsistencyLintOptions<
            Context,
            DomainQS,
            DomainsQS
          >;
      },
  ) => {
    const tableDefn = SQLa.tableDefinition<
      TableName,
      ColumnsShape,
      Context,
      DomainQS,
      DomainsQS
    >(
      tableName,
      columnsShape,
      {
        ...options,
        isIdempotent: true,
        sqlNS: options?.sqlNS ?? ddlOptions?.sqlNS,
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
        DomainQS,
        DomainsQS
      >(
        tableName,
        columnsShape,
        { defaultIspOptions },
      ),
      ...SQLa.tableSelectFactory<
        TableName,
        ColumnsShape,
        Context,
        DomainQS,
        DomainsQS
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

  function view<ViewName extends string>(
    viewName: ViewName,
    vdOptions?:
      & SQLa.ViewDefnOptions<ViewName, Any, Any, Context>
      & Partial<SQLa.EmbeddedSqlSupplier>,
  ) {
    return SQLa.viewDefinition<ViewName, Context, DomainQS>(
      viewName,
      vdOptions,
    );
  }

  function safeView<
    ViewName extends string,
    ColumnsShape extends z.ZodRawShape,
    ColumnName extends keyof ColumnsShape & string =
      & keyof ColumnsShape
      & string,
  >(
    viewName: ViewName,
    columnsShape: ColumnsShape,
    vdOptions?:
      & SQLa.ViewDefnOptions<ViewName, ColumnName, ColumnsShape, Context>
      & Partial<SQLa.EmbeddedSqlSupplier>,
  ) {
    return SQLa.safeViewDefinition<
      ViewName,
      ColumnsShape,
      Context,
      DomainQS,
      DomainsQS
    >(
      viewName,
      columnsShape,
      vdOptions,
    );
  }

  const etf = et.enumTablesFactory<Context, DomainQS, DomainsQS>({
    isIdempotent: true,
    sqlNS: ddlOptions?.sqlNS,
  });

  return {
    names,
    domains,
    keys,
    housekeeping,
    tcFactory,
    autoIncPkTable,
    textPkTable,
    tableLintRules,
    view,
    safeView,
    ordinalEnumTable: etf.ordinalTable,
    textEnumTable: etf.textTable,
    varCharEnumTable: etf.varCharTable,
  };
}

/**
 * governedTemplateState is a "typical schema" emitter object for database
 * models. It provides a convenient consolidation of SQL output, persistence,
 * catalogging, and ERD generation.
 * @returns a single object with helper functions as properties (for executing SQL templates)
 */
export function governedTemplateState<
  DomainQS extends TypicalDomainQS,
  DomainsQS extends TypicalDomainsQS,
  Context extends SQLa.SqlEmitContext,
>() {
  const persistSQL = (
    sts: SQLa.SqlTextSupplier<Context>,
    basename: string,
  ) => {
    const result: SQLa.PersistableSqlText<Context> = {
      sqlTextSupplier: sts,
      persistDest: (_, index) => `${index}_${basename}`,
    };
    return result;
  };

  const tablesDeclared = new Set<
    SQLa.TableDefinition<Any, Context, DomainQS>
  >();
  const viewsDeclared = new Set<
    SQLa.ViewDefinition<Any, Context, DomainQS>
  >();

  // deno-fmt-ignore
  const catalog = (sts: SQLa.SqlTextSupplier<Context>) => {
    if (SQLa.isTableDefinition<Any, Context, DomainQS>(sts)) {
      tablesDeclared.add(sts);
    }
    if (SQLa.isViewDefinition<Any, Context, DomainQS>(sts)) {
      viewsDeclared.add(sts);
    }
  }

  const ddlOptions = SQLa.typicalSqlTextSupplierOptions<Context>({
    prepareEvents: (spEE) => {
      spEE.on("sqlEmitted", (_, sts) => catalog(sts));
      spEE.on(
        "sqlPersisted",
        (_ctx, _destPath, psts) => catalog(psts.sqlTextSupplier),
      );
      return spEE;
    },
  });

  const qualitySystemContent = SQLa.typicalSqlQualitySystemContent(
    ddlOptions.sqlQualitySystemState,
  );

  const pumlERD = (ctx: Context) =>
    diaPUML.plantUmlIE(ctx, function* () {
      for (const table of tablesDeclared) {
        if (SQLa.isGraphEntityDefinitionSupplier(table)) {
          yield table.graphEntityDefn();
        }
      }
    }, diaPUML.typicalPlantUmlIeOptions());

  return {
    persistSQL,
    tablesDeclared,
    viewsDeclared,
    catalog,
    qualitySystemContent,
    ddlOptions,
    pumlERD,
  };
}
