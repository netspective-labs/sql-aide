import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";
import * as za from "../../lib/universal/zod-aide.ts";

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
