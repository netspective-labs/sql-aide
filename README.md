# SQL Aide (SQLa) Typescript template literal text supplier optimized for SQL

This module is a Deno Typescript module designed to help generate SQL DDL and
other SQL text in a type-safe, well-formatted, and composable manner.

These are the core interfaces:

- `SqlTextSupplier` is a block of partial SQL, almost always a statement
  terminatable by ';'
- `SqlEmitContext` is the shared context which can carry state between blocks of
  SQL

Complex SQL generation requires many different generators working together. To
help coordinate state management across `SqlTextSupplier` instances you use an
instance of `SqlEmitContext`. The simplest context is an empty one which
inherits the base `SqlEmitContext` interface.

```ts
// Type Option 1: if you do not have any custom properties
type SyntheticTmplContext = SQLa.SqlEmitContext;

// Instance Option 1: if you do not have any custom properties
const syntheticTmplContext = () =>
  SQLa.typicalSqlEmitContext() as SyntheticTmplContext;

// Type Option 2: if you have any custom properties
interface SyntheticTmplContext extends SQLa.SqlEmitContext {
  // your custom properties and functions go in here
  myCustomStateProp1: string;
  myCustomStateFunc1: (ctx: SyntheticTmplContext) => string;
}

// Instance Option 2: if you have any custom properties
const syntheticTmplContext = () => {
  const result: SyntheticTmplContext = {
    ...SQLa.typicalSqlEmitContext(),
    // initialize your custom properties
    myCustomStateProp1: "something",
    myCustomStateFunc1: (ctx) => `computed-value with ctx`,
  };
  return result;
};

// whichever option you use, prepare your ctx this way
const ctx = syntheticTmplContext();
```

Once you have your `ctx` prepared, you're ready to use the Typescript string
template literals as your templating engine.

The best way to start is to create each SQL statement generator as an instance
of `SqlTextSupplier`, minimally defining an object which returns a `SQL`
function which prepares a _single SQL statement **without a trailing ';'**:_

```ts
const syntheticTable1Defn: SQL.SqlTextSupplier<SyntheticTmplContext> = {
  SQL: (ctx) =>
    ws.unindentWhitespace(`
      CREATE TABLE "synthetic_table1" (
        "synthetic_table1_id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "column_one_text" TEXT NOT NULL,
        "column_two_text_nullable" TEXT,
        "column_unique" TEXT NOT NULL,
        "column_linted_optional" TEXT,
        "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("column_unique")
      )`),
};
```

If you don't need `ctx` in `SQL: (ctx) =>`, you can leave it out -- the _shared_
state _context_ will be provided so you can use it to store stateful information
about what you've generated.

It's best for templates and generators to be _stateless_ but in complex cases
you might not want to generate copies of text so you might need to track whether
you've generated something already or not. For example, every time you put
`${syntheticTable1Defn}` into a template as an expression its `SQL(ctx)`
function will be called. If you it generate each time it's referenced, you can
skip state management; however, if, for some reason, some parts or some
expressions in that SQL should only be generated in specific circumstances you
would utilize the typed `ctx` instance to do your state management
appropriately.

Once you have prepared your `SqlEmitContext` and `SqlTextSupplier` instances you
can use the template generator:

```ts
const stsOptions = SQLa.typicalSqlTextSupplierOptions<SyntheticTmplContext>();
const templateDefn = SQLa.SQL<SyntheticTmplContext>(stsOptions)`
-- this is a minimal SQL generator template
${syntheticTable1Defn}`;
console.log(templateDefn.SQL(ctx));
```

`stsOptions` creates a _typical_ (default) set of options. `templateDefn` will
be a new instance of `SQL.SqlTextSupplier<SyntheticTmplContext>`.

The template _definition_ **does not generate** anything and the shared context
properties will not be populated until the template is _executed_ using
`templateDefn.SQL(ctx)`. Calling `const x = templateDefn.SQL(ctx)` will "run"
the template and return the text while populating ctx with any shared state.

Inside the
`SQLa.SQL<SyntheticTmplContext>(stsOptions)\`foo\``string template you can have arbitrary text and a variety of`${expr}`instances where`expr`
can be one or more of:

- A string
- A number
- A single `SQL.SqlTextSupplier<SyntheticTmplContext>` instance
- An array of `SQL.SqlTextSupplier<SyntheticTmplContext>` instances
- A function which accepts a `SyntheticTmplContext` as a parameter and returns a
  single or array of `SQL.SqlTextSupplier<SyntheticTmplContext>` instances.
- The full list of typed `${expr}`s allowed are in [sql.ts](./sql.ts) and fully
  described by the `SqlPartialExpression` algebraic type. If a type is not a
  component of `SqlPartialExpression` then it's not a valid `${expr}`.

Using the mix above, you can prepare all your SQL statements as properly typed
object instances through literal SQL statements or use any SQL generator to
compose your SQL in text.

There are many other features available in generated templates, including:

- Lint state to add warnings/errors, etc. in the emitted SQL
- Events are generated to allow cataloging of what's being written
- Requests to persist portions of the output in separate files
- Behaviors can be defined so an expression at the bottom of generated text may
  safely influence content at the top of generated text and vice-versa
- Properly preserves indentation and whitespace whenever possible to create
  reproducible SQL text (to ease tracking in Git as generated code)

## TODO

Need to document all the different features of SQLa, but for now check out
`mod_test.ts` for examples.
