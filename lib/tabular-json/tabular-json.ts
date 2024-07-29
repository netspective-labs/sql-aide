import {
  ZodArray,
  ZodObject,
  ZodTypeAny,
} from "https://deno.land/x/zod@v3.21.4/mod.ts";
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";
import { unindentWhitespace } from "../universal/whitespace.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

/**
 * Represents a field in the JSON structure.
 */
export type TabularJsonShapeField<
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
 * Given a shape, define optional column definitions
 */
export type TabularJsonColumns<Shape extends ZodObject<z.ZodRawShape>> = {
  [Key in keyof Shape["shape"]]?: Shape["shape"][Key] extends
    ZodObject<z.ZodRawShape> ? TabularJsonColumns<Shape["shape"][Key]>
    : Partial<TabularJsonColumn<Shape["shape"][Key]>>;
};

/**
 * Function to supply column details for the given fields path and shape.
 */
export type TabularJsonColumnSupplier<Shape> = (
  fieldsPath: TabularJsonShapeField<string, ZodTypeAny>[],
  shape: Shape,
) => TabularJsonColumn<ZodTypeAny>;

/**
 * Function to generate the SQL necessary to access a specific JSON field.
 */
export type JsonFieldAccessSqlSupplier = (
  jsonColumnName: string,
  fieldsPath: TabularJsonShapeField<string, ZodTypeAny>[],
  nullableDefaultSqlExpr?: (
    field: TabularJsonShapeField<string, ZodTypeAny>,
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
export class TabularJson<Shape extends ZodObject<Any, Any, Any>> {
  protected shapeSchema: Shape;
  protected columnSupplierFunctions: TabularJsonColumnSupplier<Shape>[] = [];
  protected shapeColumnsSearch: TabularJsonColumns<Shape>[] = [];
  protected jsonFieldAccessSqlSupplier: JsonFieldAccessSqlSupplier;

  /**
   * Initializes the TabularJson.
   */
  constructor(schema: Shape) {
    this.shapeSchema = schema;
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

  schemaColumns(search: TabularJsonColumns<Shape>) {
    this.shapeColumnsSearch.push(search);
    return this;
  }

  /**
   * Adds a column supplier function.
   * @param supplier - The function supplying column details.
   * @returns The TabularJson instance for chaining.
   */
  columnSupplier(supplier: TabularJsonColumnSupplier<Shape>): this {
    this.columnSupplierFunctions.push(supplier);
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
   * Returns the first non-undefined value from the list of column supplier functions.
   * @param fieldsPath - The fields path to use for the column.
   * @returns The first non-undefined TabularJsonColumn or the default snake_case column.
   */
  jsonFieldColumn(
    fieldsPath: TabularJsonShapeField<string, ZodTypeAny>[],
  ): TabularJsonColumn<ZodTypeAny> | undefined {
    let result: TabularJsonColumn<ZodTypeAny> | undefined;
    for (const supplier of this.columnSupplierFunctions) {
      const column = supplier(fieldsPath, this.shapeSchema);
      if (column) break;
    }
    if (!result) result = snakeCaseColumnSupplier(fieldsPath, this.shapeSchema);

    for (const search of this.shapeColumnsSearch) {
      let foundColumnDefn: Any = search;
      for (const field of fieldsPath) {
        if (!foundColumnDefn) break;
        foundColumnDefn = foundColumnDefn[field.name];
      }

      if (foundColumnDefn) {
        result = {
          ...result,
          ...foundColumnDefn,
        };
        return result;
      }
    }

    return result!;
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
      const parsedData = this.shapeSchema.safeParse(data);
      if (!parsedData.success) {
        throw new Error("Invalid data shape");
      }

      const result: { [key: string]: Any } = {};
      const recurse = (
        obj: Any,
        fieldsPath: readonly TabularJsonShapeField<
          string,
          ZodTypeAny
        >[] = [],
      ) => {
        for (const key in obj) {
          const field = this.shapeSchema.shape[key];
          const currentField: TabularJsonShapeField<string, ZodTypeAny> = {
            name: key,
            field,
          };
          const column = this.jsonFieldColumn([...fieldsPath, currentField]);
          if (!column?.isEmittable) continue;

          if (Array.isArray(obj[key])) {
            if (options.flattenArrays) {
              obj[key].forEach((item: Any, index: number) => {
                if (typeof item === "object" && item !== null) {
                  recurse(item, [
                    ...fieldsPath,
                    { name: `${key}_${index}`, field },
                  ]);
                } else {
                  result[`${column.name}_${index}`] = item;
                }
              });
            } else {
              result[column.name] = obj[key];
            }
          } else if (typeof obj[key] === "object" && obj[key] !== null) {
            recurse(obj[key], [...fieldsPath, currentField]);
          } else {
            result[column.name] = obj[key];
          }
        }
      };

      recurse(parsedData.data);
      return result;
    };
  }

  /**
   * Generates SQL column definitions for the JSON schema.
   * @returns An array of ExtendedTabularJsonColumn objects representing the SQL columns.
   */
  tabularSqlColumns(jsonColumnAccessSQL: string) {
    const columns:
      (TabularJsonColumn<ZodTypeAny> & { columnExprSQL: string })[] = [];

    const recurse = (
      shape: ZodObject<Any> | ZodArray<Any>,
      fieldsPath: readonly TabularJsonShapeField<string, ZodTypeAny>[] = [],
    ) => {
      if (shape instanceof ZodObject) {
        for (const key in shape.shape) {
          const field = shape.shape[key];
          const currentField: TabularJsonShapeField<string, ZodTypeAny> = {
            name: key,
            field,
          };
          const column = this.jsonFieldColumn([...fieldsPath, currentField]);
          if (!column?.isEmittable) continue;

          const fieldPath = fieldsPath.map((f) => `'${f.name}'`).join(" -> ");
          let columnExprSQL = column.sqlAccessJsonField
            ? column.sqlAccessJsonField(jsonColumnAccessSQL, [
              ...fieldsPath,
              currentField,
            ])
            : `${jsonColumnAccessSQL}${
              fieldPath ? ` -> ${fieldPath}` : ""
            } ->> '${currentField.name}'`;

          if (column.sqlWrapExpr) {
            columnExprSQL = column.sqlWrapExpr(columnExprSQL);
          }

          if (field instanceof ZodObject || field instanceof z.ZodArray) {
            recurse(field, [...fieldsPath, currentField]);
          } else {
            columns.push({
              ...column,
              columnExprSQL,
            });
          }
        }
      } else if (shape instanceof z.ZodArray) {
        const itemType = shape.element;
        if (itemType instanceof ZodObject) {
          recurse(itemType, fieldsPath);
        }
      }
    };

    recurse(this.shapeSchema);
    return columns;
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
  ) {
    if (!this.shapeSchema) {
      throw new Error("Shape schema must be defined");
    }

    const viewType = isMaterialized ? "MATERIALIZED VIEW" : "VIEW";
    const columns = this.tabularSqlColumns(jsonColumnNameInCTE);

    return {
      dropDDL: () => `DROP VIEW IF EXISTS ${viewName};`,
      createDDL: () =>
        // deno-fmt-ignore
        unindentWhitespace(`
          CREATE ${viewType} ${viewName} AS
              WITH jsonSupplierCTE AS (
                  ${jsonSupplierCTE.replaceAll("\n", "\n              ")}
              )
              SELECT
                  ${columns.map((col) => `${col.columnExprSQL} AS ${col.asSqlSelectName ?? col.name}`).join(",\n                  ")}
              FROM jsonSupplierCTE;`),
    };
  }
}
