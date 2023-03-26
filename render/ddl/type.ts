import { zod as z } from "../deps.ts";
import * as safety from "../../lib/universal/safety.ts";
import * as emit from "../emit/mod.ts";
import * as d from "../domain/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export interface SqlTypeDefinition<
  TypeName extends string,
  Context extends emit.SqlEmitContext,
> extends emit.SqlTextSupplier<Context> {
  readonly typeName: TypeName;
}

export function isSqlTypeDefinition<
  TypeName extends string,
  Context extends emit.SqlEmitContext,
>(
  o: unknown,
): o is SqlTypeDefinition<TypeName, Context> {
  const isTypeDefn = safety.typeGuard<
    SqlTypeDefinition<TypeName, Context>
  >("typeName", "SQL");
  return isTypeDefn(o);
}

export interface SqlTypeDefnOptions<
  TypeName extends string,
  FieldName extends string,
  Context extends emit.SqlEmitContext,
> extends emit.SqlTextSupplierOptions<Context> {
  readonly embeddedStsOptions: emit.SqlTextSupplierOptions<Context>;
  readonly before?: (
    viewName: TypeName,
    vdOptions: SqlTypeDefnOptions<TypeName, FieldName, Context>,
  ) => emit.SqlTextSupplier<Context>;
  readonly sqlNS?: emit.SqlNamespaceSupplier;
}

export function sqlTypeDefinition<
  TypeName extends string,
  ArgsShape extends z.ZodRawShape,
  Context extends emit.SqlEmitContext,
  ColumnName extends keyof ArgsShape & string = keyof ArgsShape & string,
>(
  typeName: TypeName,
  argsShape: ArgsShape,
  stdOptions?: SqlTypeDefnOptions<TypeName, ColumnName, Context>,
) {
  const sdf = d.sqlDomainsFactory<TypeName, Context>();
  const sd = sdf.sqlDomains(argsShape);
  const typeDefn: SqlTypeDefinition<TypeName, Context> & {
    readonly sqlNS?: emit.SqlNamespaceSupplier;
  } = {
    typeName,
    SQL: (ctx) => {
      const { sqlTextEmitOptions: steOptions } = ctx;
      // use this naming strategy when schema/namespace not required
      const ns = ctx.sqlNamingStrategy(ctx, { quoteIdentifiers: true });
      // use this naming strategy when schema/namespace might be necessary
      const qualNS = ctx.sqlNamingStrategy(ctx, {
        quoteIdentifiers: true,
        qnss: stdOptions?.sqlNS,
      });
      const ctfi = steOptions.indentation("define type field");
      const create = steOptions.indentation(
        "create type",
        `CREATE TYPE ${qualNS.typeName(typeName)} AS (\n${ctfi}${
          sd.domains.map((
            r,
          ) => (`${ns.typeFieldName({ typeName, fieldName: r.identity })} ${
            r.sqlDataType("type field").SQL(ctx)
          }`)).join(`,\n${ctfi}`)
        }\n)`,
      );
      return stdOptions?.before
        ? ctx.embeddedSQL<Context>(stdOptions.embeddedStsOptions)`${[
          stdOptions.before(typeName, stdOptions),
          create,
        ]}`.SQL(ctx)
        : create;
    },
  };
  return {
    ...sd,
    ...typeDefn,
    drop: (options?: { ifExists?: boolean }) => dropType(typeName, options),
    sqlNS: stdOptions?.sqlNS,
  };
}

export function dropType<
  ViewName extends string,
  Context extends emit.SqlEmitContext,
>(
  viewName: ViewName,
  dtOptions?: {
    readonly ifExists?: boolean;
    readonly sqlNS?: emit.SqlNamespaceSupplier;
  },
): emit.SqlTextSupplier<Context> {
  const { ifExists = true } = dtOptions ?? {};
  return {
    SQL: (ctx) => {
      const ns = ctx.sqlNamingStrategy(ctx, {
        quoteIdentifiers: true,
        qnss: dtOptions?.sqlNS,
      });
      return `DROP TYPE ${ifExists ? "IF EXISTS " : ""}${
        ns.viewName(viewName)
      }`;
    },
  };
}
