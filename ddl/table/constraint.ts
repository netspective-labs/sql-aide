import { zod as z } from "../../deps.ts";
import * as tmpl from "../../emit/mod.ts";
import * as safety from "../../lib/universal/safety.ts";

export type TableConstraint<Context extends tmpl.SqlEmitContext> =
  tmpl.SqlTextSupplier<Context>;

export type IdentifiableTableConstraint<
  ConstraintIdentity extends string,
  Context extends tmpl.SqlEmitContext,
> = TableConstraint<Context> & {
  readonly constraintIdentity: ConstraintIdentity;
};

export type TableColumnsConstraint<
  ColumnsShape extends z.ZodRawShape,
  Context extends tmpl.SqlEmitContext,
  ColumnName extends keyof ColumnsShape = keyof ColumnsShape,
> =
  & TableConstraint<Context>
  & {
    readonly constrainedColumnNames: ColumnName[];
  };

export function uniqueContraint<
  ColumnsShape extends z.ZodRawShape,
  Context extends tmpl.SqlEmitContext,
  ColumnName extends keyof ColumnsShape = keyof ColumnsShape,
>(...constrainedColumnNames: ColumnName[]) {
  const constraint: TableColumnsConstraint<ColumnsShape, Context> = {
    constrainedColumnNames,
    SQL: (ctx) => {
      const ns = ctx.sqlNamingStrategy(ctx, { quoteIdentifiers: true });
      const ucQuoted = constrainedColumnNames.map((c) =>
        ns.domainName(String(c))
      );
      return `UNIQUE(${ucQuoted.join(", ")})`;
    },
  };
  return constraint;
}

export function tableConstraints<
  TableName extends string,
  ColumnsShape extends z.ZodRawShape,
  Context extends tmpl.SqlEmitContext,
  ColumnName extends keyof ColumnsShape = keyof ColumnsShape,
>(tableName: TableName, columnsShape: ColumnsShape) {
  let uniqConstrIndex = 0;
  const constraints: (
    & IdentifiableTableConstraint<string, Context>
    & TableColumnsConstraint<ColumnsShape, Context>
  )[] = [];
  const builder = {
    uniqueNamed: (
      constraintIdentity = `unique${uniqConstrIndex}`,
      ...constrainedColumnNames: ColumnName[]
    ) => {
      uniqConstrIndex++;
      const constraint:
        & IdentifiableTableConstraint<string, Context>
        & TableColumnsConstraint<ColumnsShape, Context> = {
          constraintIdentity,
          ...uniqueContraint(...constrainedColumnNames),
        };
      constraints.push(constraint);
      return constraint;
    },
    unique: (...constrainedColumnNames: ColumnName[]) =>
      builder.uniqueNamed(undefined, ...constrainedColumnNames),
  };
  return {
    tableName,
    columnsShape,
    constraints,
    ...builder,
  };
}

export type UniqueTableColumn = { readonly isUnique: boolean };

export const isUniqueTableColumn = safety.typeGuard<UniqueTableColumn>(
  "isUnique",
);
