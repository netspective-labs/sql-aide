# TypeScript and JavaScript runtime reflection module

- The `callable.ts` module provides utility functions for working with objects
  and class instances in TypeScript, allowing you to easily identify, filter,
  and execute methods on these instances. This can be particularly useful in
  environments where dynamic execution of methods is needed, such as in a
  Jupyter or similar notebook-style setting.
- The `reflect.ts` module is designed to inspect and analyze the types of
  variables at runtime. It provides a utility function, `reflect`, that
  generates detailed information about the type and structure of a given
  variable. This can be especially useful for debugging, logging, or dynamically
  processing various data types.
- The `ts-content.ts` module is designed to dynamically generate TypeScript type
  definitions and constant arrays based on the structure of provided row data.
  The core function of this module is `toTypeScriptCode`, which processes data
  rows to infer types, build TypeScript types, and output a constant that
  represents the data.
- The `value.ts` module is designed to handle the detection and transformation
  of various data types within streams of data. A key component of this module
  is the `detectedValueNature` function, which automatically determines the type
  of a given value and provides methods to convert and represent that value as a
  TypeScript type.

## `callable.ts`

- **Identify Methods:** Extracts the identifiers of callable methods from an
  object or class instance.
- **Filter Methods:** Provides a flexible filtering mechanism to include or
  exclude methods based on names, regular expressions, or custom functions.
- **Execute Methods:** Returns callable interfaces that allow you to dynamically
  invoke methods with proper context handling for class instances.

### `callables<T, R>(instance: T)`

Returns method names ("identifiers"), type information, and a filter function
for the provided instance.

- **Parameters:**
  - `instance`: The object or class instance to analyze.

- **Returns:** An object containing:
  - `identifiers`: An array of method names (filtered based on the return type
    `R` if specified).
  - `target`: The target object or prototype from which the method names were
    extracted.
  - `nature`: An enum value indicating if the instance is an object or a class.
  - `filter`: A function that filters and returns methods based on `include` and
    `exclude` criteria, with a callable interface that handles `this` context
    for class methods.

- **Throws:** If the instance is not an object or a constructed class instance.

## Example Usage

### Notebook-Style Environment

In a notebook-style environment, each class or object can be treated as a
_notebook_, and each method within it as a _cell_ that can be executed
dynamically.

```typescript
// Define a class representing a notebook
class Notebook {
  cell1() {
    return "This is the first cell";
  }

  cell2(data: string) {
    return `Processing: ${data}`;
  }

  helper() {
    return "This is a helper method";
  }
}

// Create an instance of the notebook
const notebook = new Notebook();

// Analyze the notebook with callables
const result = callables(notebook);

// Display the method identifiers (cells)
console.log(result.identifiers); // Output: ["cell1", "cell2", "helper"]

// Execute a specific cell
const cell1Result = result.filter({ include: "cell1" })[0].call();
console.log(cell1Result); // Output: "This is the first cell"

// Execute another cell with arguments
const cell2Result = result.filter({ include: "cell2" })[0].call("my data");
console.log(cell2Result); // Output: "Processing: my data"

// Exclude helper methods and execute only cells
const cells = result.filter({ include: (name) => name.startsWith("cell") });
cells.forEach((cell) => {
  console.log(`Executing ${cell.callable}:`, cell.call());
});
```

## `reflect.ts`:

### 1. Type Checking Functions:

The module includes several helper functions (`isBoolean`, `isNull`,
`isUndefined`, etc.) that determine the type of a given variable. These
functions are used within `reflect` to categorize the input correctly.

### 2. Type Definitions:

- **PrimitiveType:** Represents basic primitive types in JavaScript like
  `boolean`, `number`, `string`, etc.
- **NonPrimitiveType:** Represents more complex types such as `Date`, `RegExp`,
  and collections like `Map` and `Set`.
- **TypeInfo:** A union type that can represent a primitive, function, or
  object, with detailed type-specific information.

### 3. Type Information Interfaces:

These interfaces define the structure of the data returned by `reflect`.
Depending on the type of the input variable, `reflect` returns an object
conforming to one of these interfaces:

- **PrimitiveTypeInfo:** Describes primitive types.
- **FunctionTypeInfo:** Extends `PrimitiveTypeInfo` with function-specific
  details.
- **ObjectTypeInfo:** Describes objects, including their properties and symbols.

## The `reflect` Function:

The `reflect` function is the core utility of the module. It inspects the input
variable and returns a detailed description of its type, structure, and content.
The function handles different types (primitives, functions, objects) uniquely:

- **For Primitive Types:** The function checks if the input is a primitive type
  (e.g., `boolean`, `string`, `symbol`) and returns a `PrimitiveTypeInfo` object
  containing the type and value.

- **For Functions:** If the input is a function, `reflect` returns a
  `FunctionTypeInfo` object with additional details such as the function's name
  and stringified representation.

- **For Objects:** When the input is an object, `reflect` recursively inspects
  each property and symbol, returning an `ObjectTypeInfo` object that includes a
  detailed breakdown of the object's structure.

### Example of Using the `reflect` Function:

Let's walk through an example to demonstrate how to use the `reflect` function:

```typescript
import { reflect } from "./reflect.ts";

// Example object with various types of properties
const exampleObject = {
  propString: "Hello, World!",
  propNumber: 42,
  propBoolean: true,
  propSymbol: Symbol("example"),
  propFunction: () => "I'm a function",
  nestedObject: {
    nestedProp: "Nested value",
  },
  propArray: [1, 2, 3],
};

// Use the reflect function to inspect the object
const reflection = reflect(exampleObject);

// Print the detailed type information
console.log(JSON.stringify(reflection, null, 2));
```

### Explanation of the Output:

When you run this code, the `reflect` function will generate and log a detailed
JSON object that describes the structure and types of `exampleObject`. The
output will include:

- The **type** of each property (e.g., `"string"`, `"number"`, `"boolean"`).
- The **value** of each primitive property.
- For functions, the **name** and **stringified representation** of the
  function.
- For nested objects and arrays, a recursive breakdown of their structure.
- Descriptions of **symbols** and their associated values.

Here's a snippet of what the output might look like:

```json
{
  "value": {
    "propString": "Hello, World!",
    "propNumber": 42,
    "propBoolean": true,
    "propSymbol": "Symbol(example)",
    "propFunction": "() => "I'm a function"",
    "nestedObject": {
      "nestedProp": "Nested value"
    },
    "propArray": [
      1,
      2,
      3
    ]
  },
  "type": "object",
  "properties": [
    {
      "value": "Hello, World!",
      "type": "string",
      "key": "propString",
      "propertyDescription": {
        "configurable": true,
        "enumerable": true,
        "writable": true,
        "value": "Hello, World!"
      }
    },
    ...
  ],
  "symbols": []
}
```

The `reflect` function in the `reflect.ts` Deno module is a powerful tool for
inspecting and understanding the structure and types of variables at runtime. It
can handle a wide range of types, from simple primitives to complex objects, and
provides detailed information that can be used for debugging, logging, or
dynamic processing. By using this function, you can gain insights into the
nature of your data in a structured and consistent manner.

## `ts-content.ts`

### Function Signature

```typescript
export async function toTypeScriptCode(
  rows: AsyncIterable<string[]> | Iterable<string[]>,
  options?: {
    readonly valueNature?: (index: number, sample?: string) => ValueNature;
    readonly tsTypePropName?: (index: number) => string;
    readonly propertyNames?: string[];
    readonly rowTypeName?: string;
    readonly rowsConstName?: string;
  },
);
```

### Parameters:

1. **`rows`**: An iterable or async iterable that yields arrays of strings,
   where each array represents a row of data. The first row is typically
   considered the header, and subsequent rows contain the actual data.

2. **`options`** (optional): An object allowing customization:
   - **`valueNature`**: A function to detect the nature (type) of each value. By
     default, it uses `detectedValueNature`.
   - **`tsTypePropName`**: A function to determine property names for the
     TypeScript type. By default, it uses the inferred or provided property
     names.
   - **`propertyNames`**: An array of strings representing property names. If
     not provided, they are inferred from the first row of the data.
   - **`rowTypeName`**: The name for the TypeScript type to be generated.
     Defaults to `"Row"`.
   - **`rowsConstName`**: The name for the TypeScript constant that will hold
     the array of objects. Defaults to `"rows"`.

### Functionality:

1. **Type and Property Name Detection**:
   - If `propertyNames` are not provided, the first row of data is assumed to
     contain them.
   - The `valueNature` function is used to detect the type of each value in the
     first non-header row. This information is stored and later used to generate
     the TypeScript type definition.

2. **Row Processing**:
   - The function iterates through each row, updating the types for union values
     (e.g., strings that can have multiple predefined values) and accumulating
     these into a TypeScript union type.
   - It also constructs the content of a TypeScript constant, representing the
     data as an array of objects.

3. **Output Generation**:
   - The function generates a TypeScript type definition (`rowType`) based on
     the detected types.
   - It constructs a TypeScript constant (`rowsConst`) that holds the data rows
     as objects typed with the generated type.

4. **Return Value**:
   - The function returns an object containing the TypeScript type definition
     (`rowType`) and the data constant (`rowsConst`).

## Example Usage

Here’s an example of how to use the `toTypeScriptCode` function:

```typescript
import { toTypeScriptCode } from "./ts-content.ts";

async function* rowsGenerator() {
  yield ["name", "color", "isActive", "birthdate", "type"];
  yield ["John", "{Red}", "true", "1998-05-12", "undefined"];
  yield ["Doe", "{Green}", "false", "March 15, 1993", "something else"];
}

const result = await toTypeScriptCode(
  rowsGenerator(),
  {
    rowTypeName: "Person", // Custom name for the TypeScript type
    rowsConstName: "people", // Custom name for the constant array
    valueNature: (index, value) => {
      // Custom type handling for specific columns
      if (index == 4) {
        return {
          nature: "custom",
          emitTsType: () => `string | undefined`,
          emitTsValue: (value) =>
            value.trim().length == 0 || value == "undefined"
              ? "undefined"
              : `"${value}"`,
          transform: (value) =>
            value.trim().length == 0 || value == "undefined"
              ? undefined
              : value,
        };
      }
      return detectedValueNature(value);
    },
  },
);

console.log(result.rowType);
console.log(result.rowsConst);
```

### Output:

The `result` object will contain the following:

1. **TypeScript Type Definition:**

```typescript
type Person = {
  name: string;
  color: "Red" | "Green";
  isActive: boolean;
  birthdate: Date;
  type: string | undefined;
};
```

2. **TypeScript Constant Array:**

```typescript
const people: Person[] = [
  {
    name: "John",
    color: "Red",
    isActive: true,
    birthdate: Date.parse("1998-05-12"),
    type: undefined,
  },
  {
    name: "Doe",
    color: "Green",
    isActive: false,
    birthdate: Date.parse("March 15, 1993"),
    type: "something else",
  },
];
```

The `toTypeScriptCode` function in the `ts-content.ts` module automates the
generation of TypeScript type definitions and constant arrays from row-based
data. This is particularly useful in scenarios where the structure of the data
is dynamic or not predefined, ensuring type safety in your TypeScript code. By
providing flexible options for type detection and naming, the function can be
tailored to various use cases, making it a powerful tool for TypeScript
development.

## `value.ts`

The `detectedValueNature` function is the core utility that determines the
"nature" or type of a value based on its string representation. It analyzes the
input string and returns an object with methods to:

- **Transform** the value into its corresponding JavaScript type (e.g., number,
  boolean, Date, etc.).
- **Emit TypeScript type** information for the value.
- **Emit TypeScript value** representation for the value.

The function supports various data types, including:

- **Undefined**: If the input is undefined or an empty string, it returns a
  `ValueNature` object representing `undefined`.
- **Number**: If the input can be parsed as a number, it returns a `ValueNature`
  object representing a `number`.
- **Boolean**: If the input matches common boolean values (e.g., "true",
  "false", "on", "off", "yes", "no"), it returns a `ValueNature` object
  representing a `boolean`.
- **Date**: If the input can be parsed as a valid date, it returns a
  `ValueNature` object representing a `Date`.
- **BigInt**: If the input matches the pattern for a BigInt (e.g., "123n"), it
  returns a `ValueNature` object representing a `bigint`.
- **Union**: If the input appears to be a union type (e.g., "{Red}"), it returns
  a `ValueNature` object representing a `union`.
- **String**: If none of the above conditions are met, it defaults to returning
  a `ValueNature` object representing a `string`.

## Example Usage of `detectedValueNature`

Here's an example of how you can use the `detectedValueNature` function to
automatically detect and transform a series of string values:

```typescript
import { detectedValueNature } from "./value.ts";

const sampleValues = ["true", "123", "2022-01-01", "42n", "{Red}", "Hello,
World!"];

const detectedNatures = sampleValues.map(detectedValueNature);

detectedNatures.forEach((vn, index) => { const originalValue =
sampleValues[index]; const transformedValue = vn.transform(originalValue, vn);
const tsType = vn.emitTsType(vn); const tsValue = vn.emitTsValue(originalValue,
vn);

console.log(`Original Value: ${originalValue}`);
console.log(`Detected Nature: ${vn.nature}`); 
console.log(`Transformed Value: ${transformedValue}`); 
console.log(`TypeScript Type: ${tsType}`);
console.log(`TypeScript Value: ${tsValue}`); 
console.log("--------"); });
```

## Example Output:

When you run the above code, it will output something like this:

```
## Original Value: true Detected Nature: boolean Transformed Value: true TypeScript Type: boolean TypeScript Value: true

## Original Value: 123 Detected Nature: number Transformed Value: 123 TypeScript Type: number TypeScript Value: 123

## Original Value: 2022-01-01 Detected Nature: Date Transformed Value: 1640995200000 TypeScript Type: Date TypeScript Value: Date.parse("2022-01-01")

## Original Value: 42n Detected Nature: bigint Transformed Value: 42n TypeScript Type: bigint TypeScript Value: 42n

## Original Value: {Red} Detected Nature: union Transformed Value: Red TypeScript Type: Red TypeScript Value: "Red"

## Original Value: Hello, World! Detected Nature: string Transformed Value: Hello, World! TypeScript Type: string TypeScript Value: "Hello, World!"
```

## Explanation of the Example:

- **Boolean**: The input "true" is detected as a boolean, transformed into the
  JavaScript `true`, and emitted as `boolean` in TypeScript.
- **Number**: The input "123" is detected as a number, transformed into the
  number `123`, and emitted as `number` in TypeScript.
- **Date**: The input "2022-01-01" is detected as a date, transformed into a
  timestamp, and emitted as a Date constructor in TypeScript.
- **BigInt**: The input "42n" is detected as a BigInt, transformed accordingly,
  and emitted as `42n` in TypeScript.
- **Union**: The input "{Red}" is treated as a union type, with the curly braces
  removed and the value treated as a string type.
- **String**: The input "Hello, World!" defaults to a string type, with
  TypeScript representations using double quotes.

This example illustrates how `detectedValueNature` can simplify the process of
analyzing and converting string data into the appropriate types and
representations in TypeScript, making it easier to work with dynamic or loosely
typed data in a TypeScript environment.
