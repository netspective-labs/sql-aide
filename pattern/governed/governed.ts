import { zod as z } from "../../deps.ts";
import * as za from "../../lib/universal/zod-aide.ts";
import * as SQLa from "../../render/mod.ts";
import * as et from "../typical/enum-table.ts";
import * as diaPUML from "../../render/diagram/plantuml-ie-notation.ts";

// for convenience so that deno-lint is not required for use of `any`
// deno-lint-ignore no-explicit-any
type Any = any;

// TODO: domain governance is for meta-data and documentation, optionally part of emitted tables
//       create a govn_* set of tables that would contain business logic, assurance, presentation, and other details
//       * govn_entity would be a table that stores table meta data (descriptions, immutability, presentation, migration instructions, etc.)
//       * govn_entity_property would be a table that stores table column meta data (descriptions, immutability, presentation, migration instructions, etc.)
//       * govn_entity_relationship would be a table that stores entity/property relationships (1:N, 1:M, etc.) for literate programming documentation, etc.
//       * govn_entity_activity would be a table that stores governance history and activity data in JSON format for documentation, migration status, etc.
export type GovernedDomain = {
  readonly isDigestPrimaryKeyMember?: boolean;
  readonly isSurrogateKey?: boolean;
  readonly isDenormalized?: boolean;
  readonly isUniqueConstraintMember?: string[];
};

export type GovernedDomainSupplier<GD extends GovernedDomain> = {
  readonly govnDomain: GD;
};

export interface GovernedEmitContext extends SQLa.SqlEmitContext {
  readonly isGovnEmitContext: true;
}

export class GovernedDomains<
  Domain extends GovernedDomain,
  Context extends SQLa.SqlEmitContext,
> {
  constructor(
    readonly sdf = SQLa.sqlDomainsFactory<Any, Context>(),
    readonly govnZB = za.zodBaggage<Domain, { readonly govnDomain: Domain }>(
      "govnDomain",
    ),
  ) {
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
    return SQLa.selfRef<ZTA, Context>(zodType, this.sdf);
  }
}

export function housekeepingMinimal<
  Domain extends GovernedDomain,
  Domains extends GovernedDomains<Domain, Context>,
  Context extends GovernedEmitContext,
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
      Context
    > = {
      // created_at should be filled in by the database so we don't want
      // to emit it as part of the an insert DML SQL statement
      isColumnEmittable: (name) => name == "created_at" ? false : true,
    };
    return result as SQLa.InsertStmtPreparerOptions<
      Any,
      Any,
      Any,
      Context
    >;
  };

  return {
    createdBySDF,
    columns,
    insertStmtPrepOptions,
  };
}

export class GovernedKeys<
  Domain extends GovernedDomain,
  Domains extends GovernedDomains<Domain, Context>,
  Context extends GovernedEmitContext,
> {
  constructor(
    readonly domains: Domains,
    readonly pkcf = SQLa.primaryKeyColumnFactory<Context>(),
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

export class GovernedTemplateState<Context extends SQLa.SqlEmitContext> {
  constructor(readonly sqlNS?: SQLa.SqlNamespaceSupplier) {
  }

  public tablesDeclared = new Set<SQLa.TableDefinition<Any, Context>>();
  public viewsDeclared = new Set<SQLa.ViewDefinition<Any, Context>>();

  public context() {
    return SQLa.typicalSqlEmitContext() as Context;
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
    if (SQLa.isTableDefinition<Any, Context>(sts)) {
      this.tablesDeclared.add(sts);
    }
    if (SQLa.isViewDefinition<Any, Context>(sts)) {
      this.viewsDeclared.add(sts);
    }
  }

  lintState() {
    return SQLa.typicalSqlLintSummaries(this.ddlOptions.sqlTextLintState);
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
  Domain extends GovernedDomain,
  Domains extends GovernedDomains<Domain, Context>,
  Keys extends GovernedKeys<Domain, Domains, Context>,
  HousekeepingShape extends z.ZodRawShape,
  TemplateState extends GovernedTemplateState<Context>,
  Context extends GovernedEmitContext,
> {
  readonly tableLintRules = SQLa.tableLintRules<Context>();
  readonly tcFactory = SQLa.tableColumnFactory<Any, Context>();
  readonly enumTablesFactory: ReturnType<typeof et.enumTablesFactory<Context>>;

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
          Context
        >;
    },
    readonly templateState: TemplateState,
  ) {
    this.enumTablesFactory = et.enumTablesFactory<Context>({
      isIdempotent: true,
      sqlNS: templateState.sqlNS,
    });
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
        & SQLa.FKeyColNameConsistencyLintOptions<Context>;
    },
  ) {
    const tableDefn = SQLa.tableDefinition<TableName, ColumnsShape, Context>(
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
        & SQLa.FKeyColNameConsistencyLintOptions<Context>;
    },
  ) {
    const tableDefn = SQLa.tableDefinition<TableName, ColumnsShape, Context>(
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
    return SQLa.viewDefinition<ViewName, Context>(viewName, vdOptions);
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
    return SQLa.safeViewDefinition<ViewName, ColumnsShape, Context>(
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
    Domain extends GovernedDomain,
    Context extends GovernedEmitContext,
  >(sqlNS?: SQLa.SqlNamespaceSupplier) {
    type Domains = GovernedDomains<Domain, Context>;
    type Keys = GovernedKeys<Domain, Domains, Context>;
    type HousekeepingShape = typeof housekeeping.columns;

    const gts = new GovernedTemplateState<Context>(sqlNS);
    const domains = new GovernedDomains<Domain, Context>();
    const housekeeping = housekeepingMinimal<Domain, Domains, Context>(domains);
    return new GovernedIM<
      Domain,
      Domains,
      Keys,
      HousekeepingShape,
      typeof gts,
      Context
    >(
      domains,
      new GovernedKeys(domains),
      housekeepingMinimal<Domain, Domains, Context>(domains),
      gts,
    );
  }
}
