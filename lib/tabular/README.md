# Tabular Data Helpers

This TypeScript module provides utilities to handle tabular data (like CSV) in
Deno, with a focus on type detection, transformation, and emission. Below is an
explanation of the major parts of the module.

## Overview

- **Value Nature Detection**: Understands the nature of values in tabular data,
  e.g., is a value a string, number, date, etc.?
- **Transformers and Emitters**: Provides functionality to transform detected
  values into a desired format and emit them as TypeScript types/values.
- **Tabular Content**: Helps in reading tabular data as streams or as promises
  that resolve to arrays.
- **Tabular Content Strategy**: Helps in the transformation of tabular rows into
  structured rows such as objects with named properties, possibly with typed
  values.

This module is a powerful utility for developers dealing with tabular data,
offering a unique mix of type detection, transformation, and tabular data
processing capabilities. It simplifies a lot of boilerplate and ensures that
you're working with data in a type-safe and efficient manner.

## Key Types & Functions

### ValueNature

This is the central type that captures the nature of a value (e.g., number,
string, date). Apart from the nature, a `ValueNature` instance also has the
capability to:

- Transform values
- Emit values and types in TypeScript

### detectedValueNature(sampleValue?: string): ValueNature

Given a sample value, this function tries to detect its nature. For instance,
given "123" it'll detect the nature as "number".

### autoDetectValueNatures(sampleRow: string[])

For a given sample row of data, this function tries to detect the nature of each
cell.

### TabularContent & TabularContentStrategy

These interfaces encapsulate tabular content and provide methods to process that
content, both as asynchronous streams and as promises. The Strategy interfaces
help in processing the tabular rows, potentially turning them into typed
objects.

### transformIterable(iterator, strategy)

This function transforms an asynchronous iterable of asynchronous iterables
using a factory function provided via strategy (`strategy`). This is
particularly useful for turning rows of cells into other forms.

### tcObjectStrategy(options?)

This function provides a strategy instance that can transform tabular rows
(arrays of strings) into objects. It relies on detected value natures and column
headers to do so.

### delimitedText(source, options?)

This is your go-to function for processing delimited text data (e.g., CSV). It
takes a Deno reader source and produces tabular content, either as streams or
arrays.

## Usage Example

Suppose you have a CSV file:

```csv
Name, Age, Birthday
John, 28, 1995-06-15
Doe, 30, 1993-01-20
```

You can use `delimitedText` to read this file, auto-detect the nature of
columns, and process it into an array of objects:

```typescript
const file = await Deno.open("path_to_csv");
const tabularContent = delimitedText(file, {
  strategy: tcObjectStrategy({
    propNames: (headerRow) => headerRow.map((h) => h.trim()),
    valueNatures: autoDetectValueNatures,
  }),
});
const data = await tabularContent.rows();
console.log(data);
```

Output, notice the header was removed and used for the property keys:

```typescript
[
  { Name: "John", Age: 28, Birthday: Date.parse("1995-06-15") },
  { Name: "Doe", Age: 30, Birthday: Date.parse("1993-01-20") },
];
```
