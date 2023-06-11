import { testingAsserts as ta } from "../../deps-test.ts";
import * as mod from "./mod.ts";

Deno.test("context", () => {
  const sec = mod.emitter(import.meta).sqlEmitContext();
  ta.assert(mod.context().SQL(sec));
});
