import { testingAsserts as ta } from "../../deps-test.ts";
import * as mod from "./mod.ts";

Deno.test("context", () => {
  const dcpe = mod.context();
  const SQL = dcpe.content.SQL(
    dcpe.tmplEngine.sqlEmitContext(),
  );
  ta.assert(SQL);
});
