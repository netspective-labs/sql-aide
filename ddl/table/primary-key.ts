import { zod as z } from "../../deps.ts";
import * as tmpl from "../../emit/mod.ts";
import * as safety from "../../lib/universal/safety.ts";
import * as za from "../../lib/universal/zod-aide.ts";
import * as d from "../../domain/mod.ts";
import * as c from "./column.ts";

// deno-lint-ignore no-explicit-any
type Any = any; // make it easy on linter

export type TablePrimaryKeyColumnDefn<
  ColumnTsType extends z.ZodTypeAny,
  Context extends tmpl.SqlEmitContext,
> = d.SqlDomain<ColumnTsType, Context, Any> & {
  readonly isPrimaryKey: true;
  readonly isAutoIncrement: boolean;
};

export function isTablePrimaryKeyColumnDefn<
  ColumnTsType extends z.ZodTypeAny,
  Context extends tmpl.SqlEmitContext,
>(
  o: unknown,
): o is TablePrimaryKeyColumnDefn<ColumnTsType, Context> {
  const isTPKCD = safety.typeGuard<
    TablePrimaryKeyColumnDefn<ColumnTsType, Context>
  >("isPrimaryKey", "isAutoIncrement");
  return isTPKCD(o);
}

export function primaryKeyColumnFactory<Context extends tmpl.SqlEmitContext>() {
  const sdf = d.zodTypeSqlDomainFactory<Any, Context>();
  const zb = za.zodBaggage<
    d.SqlDomain<Any, Context, Any>,
    d.SqlDomainSupplier<Any, Any, Context>
  >("sqlDomain");

  const primaryKey = <ColumnName extends string>() => {
    const zodType = z.string();
    const sqlDomain = sdf.cacheableFrom<ColumnName, z.ZodString>(zodType);
    const pkSD: TablePrimaryKeyColumnDefn<z.ZodString, Context> = {
      ...sqlDomain,
      isPrimaryKey: true,
      isAutoIncrement: false,
      sqlPartial: (dest) => {
        if (dest === "create table, column defn decorators") {
          const ctcdd = sqlDomain?.sqlPartial?.(
            "create table, column defn decorators",
          );
          const decorators: tmpl.SqlTextSupplier<Context> = {
            SQL: () => `PRIMARY KEY`,
          };
          return ctcdd ? [decorators, ...ctcdd] : [decorators];
        }
        return sqlDomain.sqlPartial?.(dest);
      },
    };

    // trick Typescript into thinking the Zod instance is also a SqlDomainSupplier;
    // this allows assignment of a reference to a Zod object or use as a
    // regular Zod schema; the sqlDomain is carried in zodType._def
    // we do special typing of sqlDomain because isPrimaryKey, isExcludedFromInsertDML,
    // etc. are needed by tableDefinition()
    return zb.zodTypeBaggageProxy<typeof zodType>(
      zodType,
      pkSD,
    ) as unknown as typeof zodType & { sqlDomain: typeof pkSD };
  };

  const autoIncPrimaryKey = <ColumnName extends string>() => {
    // the zodSchema is optional() because the actual value is computed in the DB
    const zodType = z.number().optional();
    const sqlDomain = sdf.cacheableFrom<ColumnName, z.ZodOptional<z.ZodNumber>>(
      zodType,
    );
    const aipkSD:
      & TablePrimaryKeyColumnDefn<z.ZodOptional<z.ZodNumber>, Context>
      & c.TableColumnInsertDmlExclusionSupplier<
        z.ZodOptional<z.ZodNumber>,
        Context
      > = {
        ...sqlDomain,
        isPrimaryKey: true,
        isExcludedFromInsertDML: true,
        isAutoIncrement: true,
        sqlPartial: (dest) => {
          if (dest === "create table, column defn decorators") {
            const ctcdd = sqlDomain?.sqlPartial?.(
              "create table, column defn decorators",
            );
            const decorators: tmpl.SqlTextSupplier<Context> = {
              SQL: () => `PRIMARY KEY AUTOINCREMENT`,
            };
            return ctcdd ? [decorators, ...ctcdd] : [decorators];
          }
          return sqlDomain.sqlPartial?.(dest);
        },
      };

    // trick Typescript into thinking the Zod instance is also a SqlDomainSupplier;
    // this allows assignment of a reference to a Zod object or use as a
    // regular Zod schema; the sqlDomain is carried in zodType._def;
    // we do special typing of sqlDomain because isPrimaryKey, isExcludedFromInsertDML,
    // etc. are needed by tableDefinition()
    return zb.zodTypeBaggageProxy<typeof zodType>(
      zodType,
      aipkSD,
    ) as unknown as typeof zodType & { sqlDomain: typeof aipkSD };
  };

  /**
   * Declare a "user agent defaultable" (`uaDefaultable`) primary key domain.
   * uaDefaultable means that the primary key is required on the way into the
   * database but can be defaulted on the user agent ("UA") side. This type of
   * SqlDomain is useful when the primary key is assigned a value from the client
   * app/service before going into the database.
   * @returns
   */
  const uaDefaultableTextPrimaryKey = <ColumnName extends string>(
    zodType: z.ZodDefault<z.ZodString>,
  ) => {
    const sqlDomain = sdf.cacheableFrom<ColumnName, z.ZodDefault<z.ZodString>>(
      zodType,
    );
    const uadPK:
      & TablePrimaryKeyColumnDefn<z.ZodDefault<z.ZodString>, Context>
      & c.TableColumnInsertableOptionalSupplier<
        z.ZodDefault<z.ZodString>,
        Context
      > = {
        ...sqlDomain,
        isPrimaryKey: true,
        isAutoIncrement: false,
        isOptionalInInsertableRecord: true,
        sqlPartial: (dest) => {
          if (dest === "create table, column defn decorators") {
            const ctcdd = sqlDomain?.sqlPartial?.(
              "create table, column defn decorators",
            );
            const decorators: tmpl.SqlTextSupplier<Context> = {
              SQL: () => `PRIMARY KEY`,
            };
            return ctcdd ? [decorators, ...ctcdd] : [decorators];
          }
          return sqlDomain.sqlPartial?.(dest);
        },
      };

    // trick Typescript into thinking the Zod instance is also a SqlDomainSupplier;
    // this allows assignment of a reference to a Zod object or use as a
    // regular Zod schema; the sqlDomain is carried in zodType._def
    // we do special typing of sqlDomain because isPrimaryKey, isExcludedFromInsertDML,
    // etc. are needed by tableDefinition()
    return zb.zodTypeBaggageProxy<typeof zodType>(
      zodType,
      uadPK,
    ) as unknown as typeof zodType & { sqlDomain: typeof uadPK };
  };

  return {
    primaryKey,
    autoIncPrimaryKey,
    uaDefaultableTextPrimaryKey,
  };
}
