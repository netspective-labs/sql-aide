import { testingAsserts as ta } from "../../deps-test.ts";
import * as mod from "./mod.ts";

Deno.test("context", () => {
  const tmplEngine = mod.PgDcpEmitter.init(import.meta);
  const SQL = mod.context({ tmplEngine }).SQL(tmplEngine.sqlEmitContext());
  ta.assert(SQL);
  // console.log(SQL);
});
