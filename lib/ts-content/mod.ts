import { assert } from "https://deno.land/std@0.190.0/testing/asserts.ts";

// deno-lint-ignore no-explicit-any
export type Any = any;

export type Emitters = {
  readonly emitTsType: (vn: ValueNature) => string;
  readonly emitTsValue: (value: string, vn: ValueNature) => string;
};

export type ValueNature =
  | { readonly nature: "custom" } & Emitters
  | { readonly nature: "undefined" } & Emitters
  | { readonly nature: "number" } & Emitters
  | { readonly nature: "string" } & Emitters
  | { readonly nature: "boolean" } & Emitters
  | { readonly nature: "Date" } & Emitters
  | { readonly nature: "bigint" } & Emitters
  | { readonly nature: "union" } & Emitters & {
    readonly accumulate: (unionable?: string) => string[];
  };

export const detectedValueNature = (sampleValue?: string): ValueNature => {
  if (typeof sampleValue === "undefined") {
    return {
      nature: "undefined",
      emitTsType: () => `undefined`,
      emitTsValue: () => `undefined`,
    };
  }

  const normalizedValue = sampleValue.trim().toLowerCase();
  const defaultEmitters: Emitters = {
    emitTsType: (type) => type.nature,
    emitTsValue: (value) => value,
  };

  // Check for number
  if (!isNaN(Number(sampleValue))) {
    return { nature: "number", ...defaultEmitters };
  } // Check for boolean
  else if (
    ["true", "on", "yes", "false", "off", "no"].includes(normalizedValue)
  ) {
    return {
      nature: "boolean",
      ...defaultEmitters,
      emitTsValue: (value) =>
        ["true", "on", "yes"].includes(value) ? "true" : "false",
    };
  } // Check for date using Date.parse
  else if (!isNaN(Date.parse(sampleValue))) {
    return {
      nature: "Date",
      ...defaultEmitters,
      emitTsValue: (value) => `Date.parse("${value}")`,
    };
  } // Check for BigInt (e.g., 123n)
  else if (/^\d+n$/.test(sampleValue)) {
    return { nature: "bigint", ...defaultEmitters };
  } // Check for union types (using a convention)
  else if (sampleValue.startsWith("{") && sampleValue.endsWith("}")) {
    const accumlated: string[] = [];
    return {
      nature: "union",
      accumulate: (unionable) => {
        if (unionable && !accumlated.includes(unionable)) {
          accumlated.push(unionable);
        }
        return accumlated;
      },
      emitTsType: () => accumlated.join(" | "),
      emitTsValue: (value) => `"${value.slice(1, -1)}"`,
    };
  }

  return {
    nature: "string",
    ...defaultEmitters,
    emitTsValue: (value) => `"${value}"`,
  };
};

/**
 * Generates TypeScript type definitions and content based on provided property names and row data.
 *
 * @param rows - An async generator function that yields arrays of strings representing row data.
 * @param options.propertyNames - An array of strings representing the property names for the type. Defaults to first row values.
 * @param options.rowTypeName - The name of the TypeScript type to be generated. Defaults to 'Row'.
 * @param options.rowsContentName - The name of the TypeScript constant for the array of objects. Defaults to 'rows'.
 *
 * @returns An object containing the generated TypeScript type definitions and content.
 *
 * @example
 * async function* rowsGenerator() {
 *     yield ['name', 'age'];
 *     yield ['John', '25'];
 *     yield ['Doe', '30'];
 * }
 * const result = await safeContent(rowsGenerator());
 */
export async function safeContent(
  rows: AsyncGenerator<string[]>,
  options?: {
    readonly valueNature?: (index: number, sample?: string) => ValueNature;
    readonly tsTypePropName?: (index: number) => string;
    readonly propertyNames?: string[];
    readonly rowTypeName?: string;
    readonly rowsConstName?: string;
  },
) {
  const valueNature = options?.valueNature ??
    ((_index, sample) => detectedValueNature(sample));
  const rowTypeName = options?.rowTypeName ?? "Row";
  const rowsConstName = options?.rowsConstName ?? "rows";
  let propertyNames = options?.propertyNames;
  const tsTypePropName = options?.tsTypePropName ??
    ((index) => propertyNames![index]);

  const types: ValueNature[] = [];
  let rowsConst = `const ${rowsConstName}: ${rowTypeName}[] = [\n`;

  let typesDetected = false;
  for await (const row of rows) {
    // if property names were not provided, infer from the first row
    if (!propertyNames) {
      propertyNames = row;
      continue;
    }

    if (!typesDetected) {
      // Determine types based on the first non-header row
      for (let i = 0; i < row.length; i++) {
        const vn = valueNature(i, row[i]);
        types.push(vn);
        if (vn.nature === "union") {
          vn.accumulate(`"${row[i].slice(1, -1)}"`);
        }
      }
      typesDetected = true;
    } else {
      // For subsequent rows, only update union values
      for (let i = 0; i < row.length; i++) {
        const vn = types[i];
        if (vn.nature === "union") {
          vn.accumulate(`"${row[i].slice(1, -1)}"`);
        }
      }
    }

    // Build row content
    rowsConst += "  {\n";
    for (let i = 0; i < propertyNames.length; i++) {
      const vn = types[i];
      rowsConst += `    ${tsTypePropName(i)}: ${vn.emitTsValue(row[i], vn)},\n`;
    }
    rowsConst += "  },\n";
  }
  rowsConst += "];";

  // Build type definitions after processing all rows
  assert(propertyNames);
  let rowType = `type ${rowTypeName} = {\n`;
  for (let i = 0; i < propertyNames.length; i++) {
    const vn = types[i];
    rowType += `  ${tsTypePropName(i)}: ${vn.emitTsType(vn)};\n`;
  }
  rowType += "};";

  return { rowType, rowsConst };
}
