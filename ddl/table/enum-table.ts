import { zod as z } from "../../deps.ts";
import * as safety from "../../lib/universal/safety.ts";
import * as emit from "../../emit/mod.ts";
import * as d from "../../domain/mod.ts";
import * as c from "./column.ts";
import * as tbl from "./table.ts";
import * as r from "./record.ts";
import * as ss from "../../dql/select.ts";
import * as cr from "../../dql/criteria.ts";
import * as pk from "./primary-key.ts";

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
export function enumTable<
  EnumCode extends string,
  EnumValue extends number,
  TableName extends string,
  Context extends emit.SqlEmitContext,
  ColumnsShape extends z.ZodRawShape = {
    readonly code:
      & z.ZodNumber
      & d.SqlDomainSupplier<z.ZodNumber, "code", Context>;
    readonly value:
      & z.ZodString
      & d.SqlDomainSupplier<z.ZodString, "value", Context>;
    readonly created_at:
      & z.ZodOptional<z.ZodDefault<z.ZodDate>>
      & d.SqlDomainSupplier<
        z.ZodOptional<z.ZodDefault<z.ZodDate>>,
        "created_at",
        Context
      >;
  },
>(
  tableName: TableName,
  seedEnum: { [key in EnumCode]: EnumValue },
  tdOptions?: tbl.TableDefnOptions<ColumnsShape, Context>,
) {
  const seedRows: {
    readonly code: number;
    readonly value: string;
  }[] = [];
  type EnumRecord = typeof seedRows;
  type FilterableColumnName = keyof (EnumRecord);
  for (const e of Object.entries(seedEnum)) {
    const [key, value] = e;
    if (typeof value === "number") {
      // enums have numeric ids and reverse-mapped values as their keys
      // and we care only about the text keys ids, they point to codes
      const value = e[1] as EnumValue;
      seedRows.push({ code: value, value: key });
    }
  }

  const tcf = c.tableColumnFactory<TableName, Context>();
  const pkf = pk.primaryKeyColumnFactory<Context>();

  const createdAtSD = tcf.dateSDF.createdAt();
  const createdAtZodDomain = tcf.zodTypeBaggageProxy(
    z.date().default(new Date()).optional(),
    createdAtSD,
  ) as unknown as z.ZodString & { sqlDomain: typeof createdAtSD };

  const columnsShape: ColumnsShape = {
    code: pkf.primaryKey(z.number()),
    value: z.string(),
    created_at: createdAtZodDomain,
  } as unknown as ColumnsShape;
  const tdrf = r.tableColumnsRowFactory(tableName, columnsShape, {
    // "created_at" is considered "housekeeping" with a default so don't
    // emit it as part of the insert DML statement
    defaultIspOptions: {
      isColumnEmittable: (name) => name == "created_at" ? false : true,
    },
  });
  const etn: EnumTableDefn = { enumTableNature: "numeric" };
  const td = tbl.tableDefinition(tableName, columnsShape, tdOptions);
  return {
    ...etn,
    ...td,
    ...tdrf,
    // seed will be used in SQL interpolation template literal, which accepts
    // either a string, SqlTextSupplier, or array of SqlTextSuppliers; in our
    // case, if seed data is provided we'll prepare the insert DMLs as an
    // array of SqlTextSuppliers
    seedDML: seedRows && seedRows.length > 0
      ? seedRows.map((s) => tdrf.insertDML(s as Any))
      : `-- no ${tableName} seed rows`,
    seedEnum,
    select: ss.entitySelectStmtPreparer<
      TableName,
      EnumRecord,
      EnumRecord,
      Context
    >(
      tableName,
      cr.filterCriteriaPreparer((group) => {
        if (group === "primary-keys") {
          return td.domains.filter((d) =>
            pk.isTablePrimaryKeyColumnDefn(d) ? true : false
          ).map((d) => d.identity) as FilterableColumnName[];
        }
        return td.domains.filter((d) =>
          c.isTableColumnFilterCriteriaDqlExclusionSupplier(d) &&
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
export function enumTextTable<
  EnumCode extends string,
  EnumValue extends string,
  TableName extends string,
  Context extends emit.SqlEmitContext,
  ColumnsShape extends z.ZodRawShape = {
    readonly code:
      & z.ZodString
      & d.SqlDomainSupplier<z.ZodString, "code", Context>;
    readonly value:
      & z.ZodString
      & d.SqlDomainSupplier<z.ZodString, "value", Context>;
    readonly created_at:
      & z.ZodOptional<z.ZodDefault<z.ZodDate>>
      & d.SqlDomainSupplier<
        z.ZodOptional<z.ZodDefault<z.ZodDate>>,
        "created_at",
        Context
      >;
  },
>(
  tableName: TableName,
  seedEnum: { [key in EnumCode]: EnumValue },
  tdOptions?: tbl.TableDefnOptions<ColumnsShape, Context>,
) {
  const seedRows: {
    readonly code: string;
    readonly value: string;
  }[] = [];
  type EnumRecord = typeof seedRows;
  type FilterableColumnName = keyof (EnumRecord);
  for (const e of Object.entries(seedEnum)) {
    const code = e[0] as EnumCode;
    const value = e[1] as EnumValue;
    seedRows.push({ code, value });
  }

  const tcf = c.tableColumnFactory<TableName, Context>();
  const pkf = pk.primaryKeyColumnFactory<Context>();
  const codeSD: d.SqlDomain<z.ZodString, Context, "code"> = {
    ...tcf.stringSDF.string<"code">(z.string()),
    identity: "code",
  };
  const codeZodDomain = tcf.zodTypeBaggageProxy<z.ZodString>(
    z.string(),
    codeSD,
  ) as unknown as z.ZodString & { sqlDomain: typeof codeSD };

  const valueSD: d.SqlDomain<z.ZodString, Context, "value"> = {
    ...tcf.stringSDF.string<"value">(z.string()),
  };
  const valueZodDomain = tcf.zodTypeBaggageProxy<z.ZodString>(
    z.string(),
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
  const tdrf = r.tableColumnsRowFactory(tableName, columnsShape, {
    // "created_at" is considered "housekeeping" with a default so don't
    // emit it as part of the insert DML statement
    defaultIspOptions: {
      isColumnEmittable: (name) => name == "created_at" ? false : true,
    },
  });
  const etn: EnumTableDefn = { enumTableNature: "text" };
  const td = tbl.tableDefinition(tableName, columnsShape, tdOptions);
  return {
    ...etn,
    ...td,
    ...tdrf,
    // seed will be used in SQL interpolation template literal, which accepts
    // either a string, SqlTextSupplier, or array of SqlTextSuppliers; in our
    // case, if seed data is provided we'll prepare the insert DMLs as an
    // array of SqlTextSuppliers
    seedDML: seedRows && seedRows.length > 0
      ? seedRows.map((s) => tdrf.insertDML(s as Any))
      : `-- no ${tableName} seed rows`,
    seedEnum,
    select: ss.entitySelectStmtPreparer<
      TableName,
      EnumRecord,
      EnumRecord,
      Context
    >(
      tableName,
      cr.filterCriteriaPreparer((group) => {
        if (group === "primary-keys") {
          return td.domains.filter((d) =>
            pk.isTablePrimaryKeyColumnDefn(d) ? true : false
          ).map((d) => d.identity) as FilterableColumnName[];
        }
        return td.domains.filter((d) =>
          c.isTableColumnFilterCriteriaDqlExclusionSupplier(d) &&
            d.isExcludedFromFilterCriteriaDql
            ? false
            : true
        ).map((d) => d.identity) as FilterableColumnName[];
      }),
    ),
  };
}
