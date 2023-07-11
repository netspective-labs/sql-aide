import { zod as z } from "../../deps.ts";
import * as SQLa from "../../render/mod.ts";
import * as et from "../typical/enum-table.ts";
import * as diaPUML from "../../render/diagram/plantuml-ie-notation.ts";

// for convenience so that deno-lint is not required for use of `any`
// deno-lint-ignore no-explicit-any
type Any = any;

export type GovernedDomainQS = SQLa.SqlDomainQS;
export type GovernedDomainsQS = SQLa.SqlDomainsQS<GovernedDomainQS>;

export interface GovernedEmitContext extends SQLa.SqlEmitContext {
  readonly isGovnEmitContext: true;
}

export class GovernedDomains<
  DomainQS extends GovernedDomainQS,
  DomainsQS extends GovernedDomainsQS,
  Context extends SQLa.SqlEmitContext,
> {
  constructor(
    readonly sdf = SQLa.sqlDomainsFactory<Any, Context, DomainQS, DomainsQS>(),
  ) {
  }

  textArray() {
    return z.array(z.string());
  }

  text() {
    return z.string();
  }

  textNullable() {
    return z.string().optional();
  }

  varChar(maxLength: number) {
    return z.string(
      SQLa.zodSqlDomainRawCreateParams(
        SQLa.sqlDomainZodStringDescr({ isVarChar: true }),
      ),
    ).max(maxLength);
  }

  varCharNullable(maxLength: number) {
    return z.string(
      SQLa.zodSqlDomainRawCreateParams(
        SQLa.sqlDomainZodStringDescr({ isVarChar: true }),
      ),
    ).max(maxLength).optional();
  }

  integer() {
    return z.number().int();
  }

  integerNullable() {
    return z.number().int().optional();
  }

  float() {
    return z.number(
      SQLa.zodSqlDomainRawCreateParams(
        SQLa.sqlDomainZodNumberDescr({ isFloat: true, isBigFloat: false }),
      ),
    );
  }

  floatNullable() {
    return z.number(
      SQLa.zodSqlDomainRawCreateParams(
        SQLa.sqlDomainZodNumberDescr({ isFloat: true, isBigFloat: false }),
      ),
    ).optional();
  }

  bigFloat() {
    return z.number(
      SQLa.zodSqlDomainRawCreateParams(
        SQLa.sqlDomainZodNumberDescr({ isFloat: true, isBigFloat: true }),
      ),
    );
  }

  bigFloatNullable() {
    return z.number(
      SQLa.zodSqlDomainRawCreateParams(
        SQLa.sqlDomainZodNumberDescr({ isFloat: true, isBigFloat: true }),
      ),
    ).optional();
  }

  jsonText() {
    return z.string(
      SQLa.zodSqlDomainRawCreateParams(
        SQLa.sqlDomainZodStringDescr({ isJsonText: true }),
      ),
    );
  }

  jsonTextNullable() {
    return z.string(
      SQLa.zodSqlDomainRawCreateParams(
        SQLa.sqlDomainZodStringDescr({ isJsonText: true }),
      ),
    ).optional();
  }

  jsonB() {
    return SQLa.zodJsonB();
  }

  jsonbNullable() {
    return SQLa.zodJsonB().optional();
  }

  boolean() {
    return z.boolean();
  }

  booleanNullable() {
    return z.boolean().optional();
  }

  date() {
    return z.date();
  }

  dateNullable() {
    return z.date().optional();
  }

  dateTime() {
    return z.date(
      SQLa.zodSqlDomainRawCreateParams(
        SQLa.sqlDomainZodDateDescr({ isDateTime: true }),
      ),
    );
  }

  dateTimeNullable() {
    return z.date(
      SQLa.zodSqlDomainRawCreateParams(
        SQLa.sqlDomainZodDateDescr({ isDateTime: true }),
      ),
    ).optional();
  }

  createdAt() {
    return z.date(
      SQLa.zodSqlDomainRawCreateParams(
        SQLa.sqlDomainZodDateDescr({ isCreatedAt: true }),
      ),
    ).default(new Date()).optional();
  }

  updatedAt() {
    return z.date(
      SQLa.zodSqlDomainRawCreateParams(
        SQLa.sqlDomainZodDateDescr({ isUpdatedAt: true }),
      ),
    ).default(new Date()).optional();
  }

  deletedAt() {
    return z.date(
      SQLa.zodSqlDomainRawCreateParams(
        SQLa.sqlDomainZodDateDescr({ isDeletedAt: true }),
      ),
    ).optional();
  }

  ulid() {
    return z.string().ulid();
  }

  ulidNullable() {
    return z.string().ulid().optional();
  }

  uuid() {
    return z.string().uuid();
  }

  uuidNullable() {
    return z.string().uuid().optional();
  }

  selfRef<ZTA extends z.ZodTypeAny>(zodType: ZTA) {
    return SQLa.selfRef<ZTA, Context, DomainQS, DomainsQS>(zodType, this.sdf);
  }
}

export function housekeepingMinimal<
  Domains extends GovernedDomains<DomainQS, DomainsQS, Context>,
  Context extends GovernedEmitContext,
  DomainQS extends GovernedDomainQS,
  DomainsQS extends GovernedDomainsQS,
>(domains: Domains) {
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

  const columns = {
    created_at: domains.createdAt(),
    created_by: z.string(SQLa.zodSqlDomainRawCreateParams(createdBySDF))
      .optional(),
  };

  const insertStmtPrepOptions = <TableName extends string>() => {
    const result: SQLa.InsertStmtPreparerOptions<
      TableName,
      { created_at?: Date; created_by?: string }, // this must match typical.columns so that isColumnEmittable is type-safe
      { created_at?: Date; created_by?: string }, // this must match typical.columns so that isColumnEmittable is type-safe
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

  return {
    createdBySDF,
    columns,
    insertStmtPrepOptions,
  };
}

export function housekeepingAuditable<
  Domains extends GovernedDomains<DomainQS, DomainsQS, Context>,
  Context extends GovernedEmitContext,
  DomainQS extends GovernedDomainQS,
  DomainsQS extends GovernedDomainsQS,
>(domains: Domains) {
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

  const columns = {
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
  };

  const insertStmtPrepOptions = <TableName extends string>() => {
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

  return {
    createdBySDF,
    columns,
    insertStmtPrepOptions,
  };
}

export class GovernedKeys<
  Domains extends GovernedDomains<DomainQS, DomainsQS, Context>,
  Context extends GovernedEmitContext,
  DomainQS extends GovernedDomainQS,
  DomainsQS extends GovernedDomainsQS,
> {
  constructor(
    readonly domains: Domains,
    readonly pkcf = SQLa.primaryKeyColumnFactory<Context, DomainQS>(),
  ) {
  }

  textPrimaryKey() {
    return this.pkcf.primaryKey(z.string());
  }

  ulidPrimaryKey() {
    return this.pkcf.primaryKey(this.domains.ulid());
  }

  autoIncPrimaryKey() {
    return this.pkcf.autoIncPrimaryKey();
  }
}

export class GovernedTemplateState<
  Context extends SQLa.SqlEmitContext,
  DomainQS extends GovernedDomainQS,
> {
  constructor(readonly sqlNS?: SQLa.SqlNamespaceSupplier) {
  }

  public tablesDeclared = new Set<
    SQLa.TableDefinition<Any, Context, DomainQS>
  >();
  public viewsDeclared = new Set<SQLa.ViewDefinition<Any, Context, DomainQS>>();

  public context(inherit?: Partial<Context>) {
    return SQLa.typicalSqlEmitContext(inherit) as Context;
  }

  public ddlOptions = SQLa.typicalSqlTextSupplierOptions<Context>({
    prepareEvents: (spEE) => {
      spEE.on("sqlEmitted", (_, sts) => this.catalog(sts));
      spEE.on(
        "sqlPersisted",
        (_ctx, _destPath, psts) => this.catalog(psts.sqlTextSupplier),
      );
      return spEE;
    },
  });

  persistSQL(sts: SQLa.SqlTextSupplier<Context>, basename: string) {
    const result: SQLa.PersistableSqlText<Context> = {
      sqlTextSupplier: sts,
      persistDest: (_, index) => `${index}_${basename}`,
    };
    return result;
  }

  catalog(sts: SQLa.SqlTextSupplier<Context>) {
    if (SQLa.isTableDefinition<Any, Context, DomainQS>(sts)) {
      this.tablesDeclared.add(sts);
    }
    if (SQLa.isViewDefinition<Any, Context, DomainQS>(sts)) {
      this.viewsDeclared.add(sts);
    }
  }

  qualitySystemContent() {
    return SQLa.typicalSqlQualitySystemContent(
      this.ddlOptions.sqlQualitySystemState,
    );
  }

  pumlERD(ctx: Context) {
    const tables = this.tablesDeclared;
    return diaPUML.plantUmlIE(ctx, function* () {
      for (const table of tables) {
        if (SQLa.isGraphEntityDefinitionSupplier(table)) {
          yield table.graphEntityDefn();
        }
      }
    }, diaPUML.typicalPlantUmlIeOptions());
  }
}

export class GovernedIM<
  Domains extends GovernedDomains<DomainQS, DomainsQS, Context>,
  Keys extends GovernedKeys<Domains, Context, DomainQS, DomainsQS>,
  HousekeepingShape extends z.ZodRawShape,
  TemplateState extends GovernedTemplateState<Context, DomainQS>,
  Context extends GovernedEmitContext,
  DomainQS extends GovernedDomainQS,
  DomainsQS extends GovernedDomainsQS,
> {
  readonly tableLintRules = SQLa.tableLintRules<Context, DomainQS>();
  readonly tcFactory = SQLa.tableColumnFactory<Any, Context, DomainQS>();
  readonly enumTablesFactory: ReturnType<
    typeof et.enumTablesFactory<Context, DomainQS, DomainsQS>
  >;

  constructor(
    readonly domains: Domains,
    readonly keys: Keys,
    readonly housekeeping: {
      readonly columns: HousekeepingShape;
      readonly insertStmtPrepOptions: <TableName extends string>() =>
        SQLa.InsertStmtPreparerOptions<
          TableName,
          Any,
          Any,
          Context,
          DomainQS
        >;
    },
    readonly templateState: TemplateState,
  ) {
    this.enumTablesFactory = et.enumTablesFactory<Context, DomainQS, DomainsQS>(
      {
        isIdempotent: true,
        sqlNS: templateState.sqlNS,
      },
    );
  }

  /**
   * All our table names should be strongly typed and consistent. Generics are
   * used so that they are passed into Zod, SQLa domain, etc. properly typed.
   * @param name the name of the table
   * @returns the transformed table name (e.g. in case prefixes should be added)
   */
  tableName<Name extends string, Qualified extends string = Name>(
    name: Name,
  ): Qualified {
    // for now we're not doing anything special but that could change in future
    return name as unknown as Qualified;
  }

  /**
   * All of our "content" or "transaction" tables will follow a specific format,
   * namely that they will have a single primary key with the same name as the
   * table with _id appended and common "housekeeping" columns like created_at.
   * @param tableName the name of table
   * @param coreColumnsShape all the columns except primary key and housekeeping
   * @returns
   */
  textPkTable<
    TableName extends string,
    ColumnsShape extends
      & z.ZodRawShape
      & Record<`${TableName}_id`, ReturnType<typeof this.keys.textPrimaryKey>>
      & HousekeepingShape,
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
        & SQLa.FKeyColNameConsistencyLintOptions<Context, DomainQS, DomainsQS>;
    },
  ) {
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
        isIdempotent: true,
        sqlNS: this.templateState.sqlNS,
        constraints: options?.constraints,
      },
    );
    const defaultIspOptions = this.housekeeping.insertStmtPrepOptions<
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

    const rules = this.tableLintRules.typical(result);
    rules.lint(result, options?.lint);

    return result;
  }

  /**
   * All of our "content" or "transaction" tables will follow a specific format,
   * namely that they will have a single primary key with the same name as the
   * table with _id appended and common "housekeeping" columns like created_at.
   * @param tableName the name of table
   * @param coreColumnsShape all the columns except primary key and housekeeping
   * @returns
   */
  autoIncPkTable<
    TableName extends string,
    ColumnsShape extends
      & z.ZodRawShape
      & Record<
        `${TableName}_id`,
        ReturnType<typeof this.keys.autoIncPrimaryKey>
      >
      & HousekeepingShape,
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
        & SQLa.FKeyColNameConsistencyLintOptions<Context, DomainQS, DomainsQS>;
    },
  ) {
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
        isIdempotent: true,
        sqlNS: this.templateState.sqlNS,
        constraints: options?.constraints,
      },
    );
    const defaultIspOptions = this.housekeeping.insertStmtPrepOptions<
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

    const rules = this.tableLintRules.typical(result);
    rules.lint(result, options?.lint);

    return result;
  }

  view<ViewName extends string>(
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

  safeView<
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

  get ordinalEnumTable() {
    return this.enumTablesFactory.ordinalTable;
  }

  get textEnumTable() {
    return this.enumTablesFactory.textTable;
  }

  get varCharEnumTable() {
    return this.enumTablesFactory.varCharTable;
  }

  static typical<
    DomainQS extends GovernedDomainQS,
    DomainsQS extends GovernedDomainsQS,
    Context extends GovernedEmitContext,
  >(sqlNS?: SQLa.SqlNamespaceSupplier) {
    type Domains = GovernedDomains<DomainQS, DomainsQS, Context>;
    type Keys = GovernedKeys<Domains, Context, DomainQS, DomainsQS>;

    const gts = new GovernedTemplateState<Context, DomainQS>(sqlNS);
    const domains = new GovernedDomains<DomainQS, DomainsQS, Context>();
    const housekeeping = housekeepingMinimal<
      Domains,
      Context,
      DomainQS,
      DomainsQS
    >(domains);
    return new GovernedIM<
      Domains,
      Keys,
      typeof housekeeping.columns,
      typeof gts,
      Context,
      DomainQS,
      DomainsQS
    >(domains, new GovernedKeys(domains), housekeeping, gts);
  }

  static auditable<
    DomainQS extends GovernedDomainQS,
    DomainsQS extends GovernedDomainsQS,
    Context extends GovernedEmitContext,
  >(sqlNS?: SQLa.SqlNamespaceSupplier) {
    type Domains = GovernedDomains<DomainQS, DomainsQS, Context>;
    type Keys = GovernedKeys<Domains, Context, DomainQS, DomainsQS>;

    const gts = new GovernedTemplateState<Context, DomainQS>(sqlNS);
    const domains = new GovernedDomains<DomainQS, DomainsQS, Context>();
    const housekeeping = housekeepingAuditable<
      Domains,
      Context,
      DomainQS,
      DomainsQS
    >(
      domains,
    );
    return new GovernedIM<
      Domains,
      Keys,
      typeof housekeeping.columns,
      typeof gts,
      Context,
      DomainQS,
      DomainsQS
    >(
      domains,
      new GovernedKeys(domains),
      housekeeping,
      gts,
    );
  }
}
