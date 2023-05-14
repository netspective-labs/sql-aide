import { zod as z } from "../deps.ts";
import * as safety from "../lib/universal/safety.ts";
import * as SQLa from "../render/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any; // make it easier on Deno linting

export interface EnumTableDefn {
  readonly enumTableNature: "text" | "numeric";
}

export const isEnumTableDefn = safety.typeGuard<EnumTableDefn>(
  "enumTableNature",
);

/**
 * Some of our tables will just have fixed ("seeded") values and act as
 * enumerations (lookup) with foreign key relationships.
 * See https://github.com/microsoft/TypeScript/issues/30611 for how to create
 * and use type-safe enums
 * @param tableName the name of the enumeration table
 * @param seedEnum is enum whose list of values become the seed values of the lookup table
 * @returns a SQLa table with seed rows as insertDML and original typed enum for reference
 */
export function ordinalEnumTable<
  EnumCode extends string,
  EnumValue extends number,
  TableName extends string,
  Context extends SQLa.SqlEmitContext,
  ColumnsShape extends z.ZodRawShape = {
    readonly code:
      & z.ZodNumber
      & SQLa.SqlDomainSupplier<z.ZodNumber, "code", Context>;
    readonly value:
      // "value" is the actual text, but in an enum the "code" contains the value
      & z.ZodEnum<[EnumCode, ...(readonly EnumCode[])]>
      & SQLa.SqlDomainSupplier<
        z.ZodEnum<[EnumCode, ...(readonly EnumCode[])]>,
        "value",
        Context
      >;
    readonly created_at:
      & z.ZodOptional<z.ZodDefault<z.ZodDate>>
      & SQLa.SqlDomainSupplier<
        z.ZodOptional<z.ZodDefault<z.ZodDate>>,
        "created_at",
        Context
      >;
  },
>(
  tableName: TableName,
  seedEnum: { [key in EnumCode]: EnumValue },
  tdOptions?: SQLa.TableDefnOptions<ColumnsShape, Context>,
) {
  type ValueZodEnum = [EnumCode, ...(readonly EnumCode[])];
  const enumValues = Object.keys(seedEnum) as unknown as ValueZodEnum;

  const seedRows: {
    readonly code: Array<typeof seedEnum[keyof typeof seedEnum]>[number];
    readonly value: ValueZodEnum[number];
  }[] = [];
  type EnumRecord = typeof seedRows[number];
  type FilterableColumnName = keyof EnumRecord;
  for (const e of Object.entries(seedEnum)) {
    const [key, value] = e;
    if (typeof value === "number") {
      // enums have numeric ids and reverse-mapped values as their keys
      // and we care only about the text keys ids, they point to codes
      const value = e[1] as EnumValue;
      const er: EnumRecord = {
        code: value as unknown as Array<
          typeof seedEnum[keyof typeof seedEnum]
        >[number],
        value: key as unknown as ValueZodEnum[number],
      };
      seedRows.push(er);
    }
  }

  // "value" is the actual text, but in an enum the "code" contains the value
  const tcf = SQLa.tableColumnFactory<TableName, Context>();
  const pkf = SQLa.primaryKeyColumnFactory<Context>();

  const valueSD: SQLa.SqlDomain<z.ZodEnum<ValueZodEnum>, Context, "value"> = {
    ...tcf.enumSDF.zodText<EnumCode, ValueZodEnum, "value">(enumValues),
    identity: "value",
  };
  const valueZodDomain = tcf.zodTypeBaggageProxy<z.ZodEnum<ValueZodEnum>>(
    z.enum(enumValues),
    valueSD,
  ) as unknown as z.ZodString & { sqlDomain: typeof valueSD };

  const createdAtSD = tcf.dateSDF.createdAt();
  const createdAtZodDomain = tcf.zodTypeBaggageProxy(
    z.date().default(new Date()).optional(),
    createdAtSD,
  ) as unknown as z.ZodString & { sqlDomain: typeof createdAtSD };

  const columnsShape: ColumnsShape = {
    // our seedEnum type is a subset of z.EnumLike so it's safe
    code: pkf.primaryKey(z.nativeEnum(seedEnum as unknown as z.EnumLike)),
    value: valueZodDomain,
    created_at: createdAtZodDomain,
  } as unknown as ColumnsShape;
  const tdrf = SQLa.tableColumnsRowFactory(tableName, columnsShape, {
    // "created_at" is considered "housekeeping" with a default so don't
    // emit it as part of the insert DML statement
    defaultIspOptions: {
      isColumnEmittable: (name) => name == "created_at" ? false : true,
    },
  });
  const etn: EnumTableDefn = { enumTableNature: "numeric" };
  const td = SQLa.tableDefinition(tableName, columnsShape, tdOptions);
  return {
    ...etn,
    ...td,
    ...tdrf,
    seedRows,
    // seed will be used in SQL interpolation template literal, which accepts
    // either a string, SqlTextSupplier, or array of SqlTextSuppliers; in our
    // case, if seed data is provided we'll prepare the insert DMLs as an
    // array of SqlTextSuppliers
    seedDML: seedRows && seedRows.length > 0
      ? seedRows.map((s) => tdrf.insertDML(s as Any))
      : `-- no ${tableName} seed rows`,
    seedEnum,
    select: SQLa.entitySelectStmtPreparer<
      TableName,
      EnumRecord,
      EnumRecord,
      Context
    >(
      tableName,
      SQLa.filterCriteriaPreparer((group) => {
        if (group === "primary-keys") {
          return td.domains.filter((d) =>
            SQLa.isTablePrimaryKeyColumnDefn(d) ? true : false
          ).map((d) => d.identity) as FilterableColumnName[];
        }
        return td.domains.filter((d) =>
          SQLa.isTableColumnFilterCriteriaDqlExclusionSupplier(d) &&
            d.isExcludedFromFilterCriteriaDql
            ? false
            : true
        ).map((d) => d.identity) as FilterableColumnName[];
      }),
    ),
  };
}

/**
 * Some of our tables will just have fixed ("seeded") values and act as
 * enumerations (lookup) with foreign key relationships.
 * See https://github.com/microsoft/TypeScript/issues/30611 for how to create
 * and use type-safe enums
 * @param tableName the name of the enumeration table
 * @param seedEnum is enum whose list of values become the seed values of the lookup table
 * @returns a SQLa table with seed rows as insertDML and original typed enum for reference
 */
export function textEnumTable<
  EnumCode extends string,
  EnumValue extends string,
  TableName extends string,
  Context extends SQLa.SqlEmitContext,
  ColumnsShape extends z.ZodRawShape = {
    readonly code:
      & z.ZodEnum<[EnumCode, ...(readonly EnumCode[])]>
      & SQLa.SqlDomainSupplier<
        z.ZodEnum<[EnumCode, ...(readonly EnumCode[])]>,
        "code",
        Context
      >;
    readonly value:
      & z.ZodEnum<[EnumValue, ...(readonly EnumValue[])]>
      & SQLa.SqlDomainSupplier<
        z.ZodEnum<[EnumValue, ...(readonly EnumValue[])]>,
        "value",
        Context
      >;
    readonly created_at:
      & z.ZodOptional<z.ZodDefault<z.ZodDate>>
      & SQLa.SqlDomainSupplier<
        z.ZodOptional<z.ZodDefault<z.ZodDate>>,
        "created_at",
        Context
      >;
  },
>(
  tableName: TableName,
  seedEnum: { [key in EnumCode]: EnumValue },
  tdOptions?: SQLa.TableDefnOptions<ColumnsShape, Context>,
) {
  const seedRows: {
    readonly code: [EnumCode, ...(readonly EnumCode[])][number];
    readonly value: [EnumValue, ...(readonly EnumValue[])][number];
  }[] = [];
  type EnumRecord = typeof seedRows[number];
  type FilterableColumnName = keyof (EnumRecord);
  for (const e of Object.entries(seedEnum)) {
    const code = e[0] as EnumCode;
    const value = e[1] as EnumValue;
    seedRows.push({ code, value } as Any);
  }

  type CodeZodEnum = [EnumCode, ...(readonly EnumCode[])];
  type ValueZodEnum = [EnumValue, ...(readonly EnumValue[])];
  const enumCodes = Object.keys(seedEnum) as unknown as CodeZodEnum;
  const enumValues = Object.values(seedEnum) as unknown as ValueZodEnum;
  const tcf = SQLa.tableColumnFactory<TableName, Context>();
  const pkf = SQLa.primaryKeyColumnFactory<Context>();
  const codeSD: SQLa.SqlDomain<z.ZodEnum<CodeZodEnum>, Context, "code"> = {
    ...tcf.enumSDF.zodText<EnumCode, CodeZodEnum, "code">(enumCodes),
    identity: "code",
  };
  const codeZodDomain = tcf.zodTypeBaggageProxy<z.ZodEnum<CodeZodEnum>>(
    z.enum(enumCodes),
    codeSD,
  ) as unknown as z.ZodString & { sqlDomain: typeof codeSD };

  const valueSD: SQLa.SqlDomain<z.ZodEnum<ValueZodEnum>, Context, "value"> = {
    ...tcf.enumSDF.zodText<EnumValue, ValueZodEnum, "value">(enumValues),
    identity: "value",
  };
  const valueZodDomain = tcf.zodTypeBaggageProxy<z.ZodEnum<ValueZodEnum>>(
    z.enum(enumValues),
    valueSD,
  ) as unknown as z.ZodString & { sqlDomain: typeof valueSD };

  const createdAtSD = tcf.dateSDF.createdAt();
  const createdAtZodDomain = tcf.zodTypeBaggageProxy(
    z.date().default(new Date()).optional(),
    createdAtSD,
  ) as unknown as z.ZodString & { sqlDomain: typeof createdAtSD };

  const columnsShape: ColumnsShape = {
    code: pkf.primaryKey(codeZodDomain),
    value: valueZodDomain,
    created_at: createdAtZodDomain,
  } as unknown as ColumnsShape;
  const tdrf = SQLa.tableColumnsRowFactory(tableName, columnsShape, {
    // "created_at" is considered "housekeeping" with a default so don't
    // emit it as part of the insert DML statement
    defaultIspOptions: {
      isColumnEmittable: (name) => name == "created_at" ? false : true,
    },
  });
  const etn: EnumTableDefn = { enumTableNature: "text" };
  const td = SQLa.tableDefinition(tableName, columnsShape, tdOptions);
  return {
    ...etn,
    ...td,
    ...tdrf,
    seedRows,
    // seed will be used in SQL interpolation template literal, which accepts
    // either a string, SqlTextSupplier, or array of SqlTextSuppliers; in our
    // case, if seed data is provided we'll prepare the insert DMLs as an
    // array of SqlTextSuppliers
    seedDML: seedRows && seedRows.length > 0
      ? seedRows.map((s) => tdrf.insertDML(s as Any))
      : `-- no ${tableName} seed rows`,
    seedEnum,
    select: SQLa.entitySelectStmtPreparer<
      TableName,
      EnumRecord,
      EnumRecord,
      Context
    >(
      tableName,
      SQLa.filterCriteriaPreparer((group) => {
        if (group === "primary-keys") {
          return td.domains.filter((d) =>
            SQLa.isTablePrimaryKeyColumnDefn(d) ? true : false
          ).map((d) => d.identity) as FilterableColumnName[];
        }
        return td.domains.filter((d) =>
          SQLa.isTableColumnFilterCriteriaDqlExclusionSupplier(d) &&
            d.isExcludedFromFilterCriteriaDql
            ? false
            : true
        ).map((d) => d.identity) as FilterableColumnName[];
      }),
    ),
  };
}

/**
 * enumTablesFactory is a "typical enums" builders object for database models.
 * @returns a single object with helper functions as properties (for building models)
 */
export function enumTablesFactory<Context extends SQLa.SqlEmitContext>(
  defaultTdOptions?: SQLa.TableDefnOptions<Any, Context>,
) {
  function ordinalTable<
    EnumCode extends string,
    EnumValue extends number,
    TableName extends string,
    ColumnsShape extends z.ZodRawShape = {
      readonly code:
        & z.ZodNumber
        & SQLa.SqlDomainSupplier<z.ZodNumber, "code", Context>;
      readonly value:
        // "value" is the actual text, but in an enum the "code" contains the value
        & z.ZodEnum<[EnumCode, ...(readonly EnumCode[])]>
        & SQLa.SqlDomainSupplier<
          z.ZodEnum<[EnumCode, ...(readonly EnumCode[])]>,
          "value",
          Context
        >;
      readonly created_at:
        & z.ZodOptional<z.ZodDefault<z.ZodDate>>
        & SQLa.SqlDomainSupplier<
          z.ZodOptional<z.ZodDefault<z.ZodDate>>,
          "created_at",
          Context
        >;
    },
  >(
    tableName: TableName,
    seedEnum: { [key in EnumCode]: EnumValue },
    tdOptions?: SQLa.TableDefnOptions<ColumnsShape, Context>,
  ) {
    return ordinalEnumTable<
      EnumCode,
      EnumValue,
      TableName,
      Context,
      ColumnsShape
    >(tableName, seedEnum, tdOptions ?? defaultTdOptions);
  }

  function textTable<
    EnumCode extends string,
    EnumValue extends string,
    TableName extends string,
    ColumnsShape extends z.ZodRawShape = {
      readonly code:
        & z.ZodEnum<[EnumCode, ...(readonly EnumCode[])]>
        & SQLa.SqlDomainSupplier<
          z.ZodEnum<[EnumCode, ...(readonly EnumCode[])]>,
          "code",
          Context
        >;
      readonly value:
        & z.ZodEnum<[EnumValue, ...(readonly EnumValue[])]>
        & SQLa.SqlDomainSupplier<
          z.ZodEnum<[EnumValue, ...(readonly EnumValue[])]>,
          "value",
          Context
        >;
      readonly created_at:
        & z.ZodOptional<z.ZodDefault<z.ZodDate>>
        & SQLa.SqlDomainSupplier<
          z.ZodOptional<z.ZodDefault<z.ZodDate>>,
          "created_at",
          Context
        >;
    },
  >(
    tableName: TableName,
    seedEnum: { [key in EnumCode]: EnumValue },
    tdOptions?: SQLa.TableDefnOptions<ColumnsShape, Context>,
  ) {
    return textEnumTable<
      EnumCode,
      EnumValue,
      TableName,
      Context,
      ColumnsShape
    >(tableName, seedEnum, tdOptions ?? defaultTdOptions);
  }

  return {
    ordinalTable,
    textTable,
  };
}
