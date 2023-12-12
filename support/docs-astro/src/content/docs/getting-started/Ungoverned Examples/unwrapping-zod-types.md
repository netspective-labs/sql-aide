---
title: Unwrapping Zod Types
sidebar:
  order: 5
---

<!-- ## Unwrapping Zod Types -->

Zod Aide lets you clone and "unwrap" your Zod types. This means that it will
remove any wrappers such as `optional`, `default`, and `nullable` from the Zod
type, allowing you to get the base type. Here's a sample usage:

```typescript filename="examples/getting-started/05-unwrapping-zod-types.sqla.ts"
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";
import * as ta from "https://deno.land/std@0.191.0/testing/asserts.ts";
import * as za from "https://raw.githubusercontent.com/netspective-labs/sql-aide/vX.Y.Z/lib/universal/zod-aide.ts";

// define Zod types
const textOptional = z.string().optional();

// clone and unwrap Zod type
const textOptionalUC = za.coreZTA(za.clonedZodType(textOptional));
ta.assert(textOptional.isOptional() && !textOptionalUC.isOptional());

console.log("Original type is optional:", textOptional.isOptional());
console.log(
  "Cloned and unwrapped type is optional:",
  textOptionalUC.isOptional(),
);
```

In the above example, the `textOptional` type was cloned and unwrapped using the
`clonedZodType` and `coreZTA` functions from Zod Aide. The `clonedZodType`
function clones the original Zod type, and the `coreZTA` function unwraps it,
removing the `optional` wrapper. The `ta.assert` checks that the original Zod
type is optional, and the unwrapped type is not.

```bash
deno run ./examples/getting-started/05-unwrapping-zod-types.sqla.ts
```

Produces:

```
Original type is optional: true
Cloned and unwrapped type is optional: false
```
