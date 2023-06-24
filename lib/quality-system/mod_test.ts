import { testingAsserts as ta } from "../../deps-test.ts";
import * as mod from "./mod.ts";

const expectType = <T>(_value: T) => {
  // Do nothing, the TypeScript compiler handles this for us
};

Deno.test("Data Governance types", () => {
  const doc1: mod.Documentable = {
    description: "description1",
  };
  type Doc1 = typeof doc1;
  ta.assert(doc1);

  const dgs1: mod.QualitySystemSupplier<Doc1> = {
    qualitySystem: doc1,
  };
  expectType<mod.Documentable>(doc1);
  expectType<mod.QualitySystemSupplier<Doc1>>(dgs1);
});
