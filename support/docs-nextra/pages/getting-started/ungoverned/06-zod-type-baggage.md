---
title: Zod Type Baggage
---

## Zod Type Baggage

Zod also allows you to attach additional properties, referred to as "baggage",
to Zod types. This allows you to store and retrieve extra data from your Zod
types. Here's a sample usage:

```typescript filename="examples/getting-started/06-zod-type-baggage.sqla.ts"
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";
import * as za from "https://raw.githubusercontent.com/netspective-labs/sql-aide/vX.Y.Z/lib/universal/zod-aide.ts";

// define your baggage type
type SyntheticBaggage = {
  property1: string;
  property2: number;
};

// define baggage supplier
type SyntheticBaggageSupplier = {
  syntheticBaggage: SyntheticBaggage;
};

// create a zod baggage
const sb = za.zodBaggage<SyntheticBaggage, SyntheticBaggageSupplier>(
  "syntheticBaggage",
);

// get the zodTypeBaggageProxy
const { zodTypeBaggageProxy: proxy } = sb;

// apply the proxy to a Zod type
const baggageText = proxy(z.string());
baggageText.syntheticBaggage = {
  property1: "baggageText",
  property2: 1285,
};

console.log(baggageText.syntheticBaggage);
```

In the above example, `SyntheticBaggage` and `SyntheticBaggageSupplier` types
are defined to represent a type of additional data that can be associated with
Zod types. This 'baggage' includes a string property (`property1`) and a number
property (`property2`). The `zodBaggage` function from `zod-aide` is used to
create a 'baggage' object (`sb`). This function expects two types: one for the
baggage itself, and one for the supplier of the baggage. From this baggage
object, a 'proxy' is extracted which enables the ability to add baggage to any
Zod type. In this case, the proxy is applied to a Zod string type
(`baggageText`). Finally, the synthetic baggage (containing the string
"baggageText" and the number 1285) is associated with `baggageText` via the
proxy.

```bash
deno run ./examples/getting-started/06-zod-type-baggage.sqla.ts
```

Produces:

```object
{ property1: "baggageText", property2: 1285 }
```
