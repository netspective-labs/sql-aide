import {
  ZodArray,
  ZodObject,
  ZodTypeAny,
} from "https://deno.land/x/zod@v3.23.0/mod.ts";
import { z } from "https://deno.land/x/zod@v3.23.0/mod.ts";
import { unindentWhitespace } from "../universal/whitespace.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

/**
 * Represents a field in the JSON structure.
 */
export type TabularJsonShapeField<
  Shape,
  FieldName extends string,
  Type extends ZodTypeAny,
> = {
  readonly name: FieldName;
  readonly field: Type;
};

/**
 * Represents a column in the SQL table or view.
 */
export type TabularJsonColumn<Type extends ZodTypeAny> = {
  readonly name: string;
  readonly type: Type;
  readonly isEmittable: boolean;
  readonly sqlWrapExpr?: (suppliedSql: string) => string;
  readonly sqlAccessJsonField?: JsonFieldAccessSqlSupplier;
  readonly asSqlSelectName?: string;
};

/**
 * Function to supply column details for the given fields path and shape.
 */
export type TabularJsonColumnSupplier<Shape> = (
  fieldsPath: readonly TabularJsonShapeField<Shape, string, ZodTypeAny>[],
  shape: Shape,
) => TabularJsonColumn<ZodTypeAny>;

/**
 * Function to generate the SQL necessary to access a specific JSON field.
 */
export type JsonFieldAccessSqlSupplier = (
  jsonColumnName: string,
  fieldsPath: readonly TabularJsonShapeField<Any, string, ZodTypeAny>[],
  nullableDefaultSqlExpr?: (
    field: TabularJsonShapeField<Any, string, ZodTypeAny>,
  ) => string,
) => string;

/**
 * Default supplier for PostgreSQL-dialect JSON field access SQL.
 */
export const postgreSqlFieldAccessSqlSupplier: JsonFieldAccessSqlSupplier = (
  jsonColumnName,
  fieldsPath,
  nullableDefaultSqlExpr,
) => {
  // Build the path excluding the terminal field
  const pathWithoutTerminal = fieldsPath.slice(0, -1).map((field, index) => {
    const optional = field.field instanceof z.ZodOptional ||
      field.field instanceof z.ZodNullable;
    const pathPart = optional && nullableDefaultSqlExpr
      ? `COALESCE(${jsonColumnName}${index > 0 ? ` -> ` : ""}'${field.name}', ${
        nullableDefaultSqlExpr(field)
      })`
      : `${jsonColumnName}${index > 0 ? ` -> ` : ""}'${field.name}'`;
    return pathPart;
  }).join(" -> ");

  // Add the terminal field using ->> for text extraction
  const terminalField = fieldsPath[fieldsPath.length - 1];
  const terminalFieldPart = ` ->> '${terminalField.name}'`;

  // Construct the full path
  const fullPath = pathWithoutTerminal
    ? `${pathWithoutTerminal} -> ${jsonColumnName}${terminalFieldPart}`
    : `${jsonColumnName}${terminalFieldPart}`;

  return `(${fullPath})`;
};

/**
 * Helper function to convert camelCase to snake_case.
 */
const camelCaseToSnakeCase = (str: string) => {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

/**
 * Default column supplier using snake_case naming convention.
 */
export const snakeCaseColumnSupplier: TabularJsonColumnSupplier<Any> = (
  fieldsPath,
) => {
  const name = fieldsPath
    .map((field) => camelCaseToSnakeCase(field.name))
    .join("_");
  const lastField = fieldsPath[fieldsPath.length - 1].field;

  return {
    name,
    type: lastField,
    isEmittable: true,
  };
};

/**
 * Main class to handle JSON data, schema, and SQL view generation.
 */
export class TabularJson<Shape extends ZodObject<Any>> {
  protected shapeSchema?: Shape;
  protected columnSupplierFunction: TabularJsonColumnSupplier<Shape>;
  protected jsonFieldAccessSqlSupplier: JsonFieldAccessSqlSupplier;

  /**
   * Initializes the TabularJson.
   */
  constructor() {
    this.columnSupplierFunction = snakeCaseColumnSupplier;
    this.jsonFieldAccessSqlSupplier = postgreSqlFieldAccessSqlSupplier;
  }

  /**
   * Sets the JSON schema.
   * @param schema - The Zod schema defining the JSON structure.
   * @returns The TabularJson instance for chaining.
   */
  jsonSchema(schema: Shape): this {
    this.shapeSchema = schema;
    return this;
  }

  /**
   * Sets the column supplier function.
   * @param supplier - The function supplying column details.
   * @returns The TabularJson instance for chaining.
   */
  columnSupplier(supplier: TabularJsonColumnSupplier<Shape>): this {
    this.columnSupplierFunction = supplier;
    return this;
  }

  /**
   * Sets the JSON field access SQL supplier function.
   * @param supplier - The function generating SQL for JSON field access.
   * @returns The TabularJson instance for chaining.
   */
  jsonFieldAccessSql(supplier: JsonFieldAccessSqlSupplier): this {
    this.jsonFieldAccessSqlSupplier = supplier;
    return this;
  }

  /**
   * Generates a JavaScript function to process data according to the schema.
   * @returns A function that processes data and returns a flattened object.
   */
  tabularJs(
    options: { readonly flattenArrays: boolean } = { flattenArrays: true },
  ): (data: unknown) => { [key: string]: Any } {
    if (!this.shapeSchema) {
      throw new Error("Shape schema must be defined");
    }

    return (data: unknown) => {
      const parsedData = this.shapeSchema!.safeParse(data);
      if (!parsedData.success) {
        throw new Error("Invalid data shape");
      }

      const result: { [key: string]: Any } = {};
      const recurse = (
        obj: Any,
        fieldsPath: readonly TabularJsonShapeField<
          Shape,
          string,
          ZodTypeAny
        >[] = [],
      ) => {
        for (const key in obj) {
          const field = this.shapeSchema!.shape[key];
          const currentField: TabularJsonShapeField<Shape, string, ZodTypeAny> =
            { name: key, field };
          const { name, isEmittable } = this.columnSupplierFunction([
            ...fieldsPath,
            currentField,
          ], this.shapeSchema!);
          if (!isEmittable) continue;

          if (Array.isArray(obj[key])) {
            if (options.flattenArrays) {
              // Handle array of objects
              obj[key].forEach((item: Any, index: number) => {
                if (typeof item === "object" && item !== null) {
                  recurse(item, [
                    ...fieldsPath,
                    { name: `${key}_${index}`, field },
                  ]);
                } else {
                  result[`${name}_${index}`] = item;
                }
              });
            } else {
              result[name] = obj[key]; // Keep the array as-is
            }
          } else if (typeof obj[key] === "object" && obj[key] !== null) {
            // Recursively handle nested objects
            recurse(obj[key], [...fieldsPath, currentField]);
          } else {
            result[name] = obj[key];
          }
        }
      };

      recurse(parsedData.data);
      return result;
    };
  }

  /**
   * Generates SQL view creation and deletion statements.
   * @param viewName - The name of the SQL view.
   * @param jsonSupplierCTE - The CTE SQL for JSON data.
   * @param jsonColumnNameInCTE - The name of the JSON column within the CTE.
   * @param isMaterialized - If true, creates a materialized view.
   * @returns An object with `dropDDL` and `createDDL` methods for SQL view management.
   */
  tabularSqlView(
    viewName: string,
    jsonSupplierCTE: string,
    jsonColumnNameInCTE: string,
    isMaterialized = false,
  ): { readonly dropDDL: () => string; readonly createDDL: () => string } {
    if (!this.shapeSchema) {
      throw new Error("Shape schema must be defined");
    }

    const viewType = isMaterialized ? "MATERIALIZED VIEW" : "VIEW";
    const columns: string[] = [];

    const recurse = (
      shape: ZodObject<Any> | ZodArray<Any>,
      fieldsPath: readonly TabularJsonShapeField<Shape, string, ZodTypeAny>[] =
        [],
    ) => {
      if (shape instanceof ZodObject) {
        for (const key in shape.shape) {
          const field = shape.shape[key];
          const currentField: TabularJsonShapeField<Shape, string, ZodTypeAny> =
            {
              name: key,
              field,
            };
          const {
            isEmittable,
            sqlWrapExpr,
            sqlAccessJsonField,
            asSqlSelectName,
          } = this.columnSupplierFunction(
            [...fieldsPath, currentField],
            this.shapeSchema!,
          );
          if (!isEmittable) continue;

          if (field instanceof ZodObject || field instanceof z.ZodArray) {
            recurse(field, [...fieldsPath, currentField]);
          } else {
            // Construct the path excluding the final ->>'field'
            const fieldPath = fieldsPath.map((f) => `'${f.name}'`).join(" -> ");
            let columnExprSQL = sqlAccessJsonField
              ? sqlAccessJsonField(jsonColumnNameInCTE, [
                ...fieldsPath,
                currentField,
              ])
              : `${jsonColumnNameInCTE}${
                fieldPath ? ` -> ${fieldPath}` : ""
              } ->> '${currentField.name}'`;

            if (sqlWrapExpr) {
              columnExprSQL = sqlWrapExpr(columnExprSQL);
            }

            columns.push(
              `${columnExprSQL} AS ${asSqlSelectName ?? key}`,
            );
          }
        }
      } else if (shape instanceof z.ZodArray) {
        const itemType = shape.element;
        if (itemType instanceof ZodObject) {
          recurse(itemType, fieldsPath);
        }
      }
    };

    recurse(this.shapeSchema!);

    return {
      dropDDL: () => `DROP VIEW IF EXISTS ${viewName};`,
      createDDL: () =>
        unindentWhitespace(`
          CREATE ${viewType} ${viewName} AS
              WITH jsonSupplierCTE AS (
                  ${jsonSupplierCTE.replaceAll("\n", "\n              ")}
              )
              SELECT
                  ${columns.join(",\n                  ")}
              FROM jsonSupplierCTE;`),
    };
  }
}
