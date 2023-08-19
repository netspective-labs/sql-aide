import { detectedValueNature, ValueNature } from "./value.ts";

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
 * const result = await toTypeScriptCode(rowsGenerator());
 */
export async function toTypeScriptCode(
  rows: AsyncIterable<string[]> | Iterable<string[]>,
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
  let rowType = `type ${rowTypeName} = {\n`;
  for (let i = 0; i < propertyNames!.length; i++) {
    const vn = types[i];
    rowType += `  ${tsTypePropName(i)}: ${vn.emitTsType(vn)};\n`;
  }
  rowType += "};";

  return { rowType, rowsConst };
}
