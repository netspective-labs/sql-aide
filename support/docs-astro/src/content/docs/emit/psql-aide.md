---
title: psql Aide
---

Creating complex PostgreSQL psql files with `\set` variables typically requires the use of format functions to ensure that the variables and SQL statements are correctly formatted and safe to use. These `\set` variables are essentially placeholders in your SQL statements, and you need to assign them values before you can run your SQL script.

However, manually handling this process can be tedious and error-prone. It involves ensuring that every variable is correctly set, every placeholder in the SQL statement is correctly formatted, and every variable value is correctly inserted into the SQL statement. This complexity increases with the complexity and length of the SQL scripts.

That's where psql Aide comes in. This library simplifies the process of generating parameterized SQL statements, making them suitable for loading into PostgreSQL using psql. It provides a set of utility functions that automate and streamline this process.

## How psql Aide Simplifies the Process

Here's a brief overview of how psql Aide simplifies this process:

1. **Format Arguments**: With psql Aide's `formatArgs` function, you can format multiple arguments at once and ensure that they are in the correct format for your SQL statements. This function takes a structured set of arguments and returns an object containing those arguments, correctly formatted for SQL queries.

2. **Resolve Formats**: The `formatAide` function in psql Aide simplifies the process of transforming SQL strings into template literals, replacing placeholders with positional parameters. This ensures that your SQL statements are correctly formatted and safe to use.

3. **Injecting Arguments**: psql Aide's `injectables` function allows you to generate an object of injectable arguments. You specify the argument types, and the function returns an object with each argument associated with a unique key. You can use this object in other operations to ensure that your arguments are correctly injected into SQL statements.

4. **Generating PSQL Scripts**: The `psqlAide` function provides a flexible way to generate SQL scripts on-the-fly. It allows for the creation of PostgreSQL scripts using template literals, creating dynamic scripts that include variable injection and dynamic formatting.

psql Aide helps you to avoid errors, increase efficiency, and focus more on developing your application rather than wrestling with SQL syntax and format issues.

## Example

In the example below, the transformed object contains the final psql using strongly-typed `\set` variables and the usage of those `\set` variables in a format string.

Note that the source in TypeScript does not need to worry about positional parameters required by PostgreSQL's format function. Instead, you use string template literals with Zod record definitions, and psql Aide automatically generates all the positional parameters correctly from either `\set` variables or any other variables passed into the format function. All of it is configurable.

```typescript
const transformed = mod.psqlAide(
  {
    setX: z.string(),
    setY: z.number(),
    setZ: z.date(),
  },
  ({ setables: { setX, setY, setZ } }, template) => {
    const fa1 = mod.formatAide(
      {
        setX,
        setY,
        setZ,
        arg1: z.string(),
        arg2: z.number(),
        arg3: z.date(),
      },
      ({ injectables: { setX, setY, setZ, arg1, arg2, arg3 } }, template) =>
        template`
          this is a test of arg1: ${arg1.L} (literal)
          this is a test of arg2: ${arg2.s} (simple value)
          this is a test of arg3: ${arg3.I} (quoted identifier)
          this is a test of setX inside format: ${setX.L} (literal)
          this is a test of setY inside format: ${setY.s} (simple value)
          this is a test of setZ inside format: ${setZ.I} (quoted identifier)`,
    );
 
    template`
      ${setX.set}
      ${setY.set}
      ${setZ.set}
 
      this is a test of setX (outer): ${setX.L} (literal)
      this is a test of setY (outer): ${setY.s} (simple value)
      this is a test of setZ (outer): ${setZ.I} (quoted identifier)
 
      -- formatted
      ${fa1.format()}`;
  },
);
