---
title: Tables
---

# Table DDL Aides

`SQLa` uses Zod to declare type-safe tables and generate SQL DDL that can be
used directly in template literals.

## Type-safe declarations

Assuming `ctx` and `stsOptions` are setup as in the examples above, you can
import `z` from Zod, prepare a table definition and then use it:

```ts
const typeSafeTable1 = t.tableDefinition("synthetic_table_without_pk", {
  text: z.string(),
  text_nullable: z.string().optional(),
  int: z.number(),
  int_nullable: z.number().optional(),
});

type TypeSafeTable1 = z.infer<typeof typeSafeTable1.zSchema>;
const record: TypeSafeTable1 = {
  text: "required",
  int: 0,
  text_nullable: undefined,
};

const templateDefn = SQLa.SQL<SyntheticTmplContext>(stsOptions)`
-- this is a minimal SQL generator template
${syntheticTable1Defn}

${typeSafeTable1}
`;
console.log(templateDefn.SQL(ctx));
```

`syntheticTable1Defn` is a custom-prepared (not type-safe) but `typeSafeTable1`
is type-safe because it's defined using a Zod schema.
