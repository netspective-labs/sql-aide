import { zod as z } from "../../deps.ts";
import * as tbl from "../../ddl/table/mod.ts";
import * as emit from "../../emit/mod.ts";
import * as d from "../../domain/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any; // make it easy on linter

export function primaryKeyColumnFactory<
  Context extends emit.SqlEmitContext,
  DomainQS extends d.SqlDomainQS,
>() {
  const pkcf = tbl.primaryKeyColumnFactory<Context, DomainQS>();
  const { sdFactory: sdf, zodBaggage: zb } = pkcf;

  const serialPrimaryKey = <ColumnName extends string>() => {
    const zodType = z.number().optional();
    const sqlDomain: d.SqlDomain<
      z.ZodOptional<z.ZodNumber>,
      Context,
      ColumnName,
      DomainQS
    > = {
      ...sdf.numberSDF.defaults<ColumnName>(zodType, { isOptional: true }),
      sqlDataType: () => ({ SQL: () => `SERIAL` }),
      polygenixDataType: () => `integer::serial`,
    };
    const pkSD:
      & tbl.TablePrimaryKeyColumnDefn<typeof zodType, Context, DomainQS>
      & tbl.TableColumnInsertDmlExclusionSupplier<
        z.ZodOptional<z.ZodNumber>,
        Context,
        DomainQS
      >
      & typeof sqlDomain = {
        ...sqlDomain,
        isPrimaryKey: true,
        isExcludedFromInsertDML: true,
        isAutoIncrement: true,
        sqlPartial: (dest) => {
          if (dest === "create table, column defn decorators") {
            const ctcdd = sqlDomain?.sqlPartial?.(
              "create table, column defn decorators",
            );
            const decorators: emit.SqlTextSupplier<Context> = {
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

  return {
    ...pkcf,
    serialPrimaryKey,
  };
}
