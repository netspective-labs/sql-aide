import { testingAsserts as ta } from "./deps-test.ts";
import * as ws from "./whitespace.ts";

const goldenUnindented =
  `This is a test to see if we can remove indentation properly.
  First level
    Second level`;

Deno.test("Unindent text value", () => {
  const testIndented = `
    This is a test to see if we can remove indentation properly.
      First level
        Second level`;

  ta.assertEquals(4, ws.minWhitespaceIndent(testIndented));
  ta.assertEquals(goldenUnindented, ws.unindentWhitespace(testIndented));
});

Deno.test("Multiple lines with whitespace as single line", () => {
  const goldenSingleLine =
    `select a, b, c from table where a = 'Value with spaces' and b = "Another set of spaces"`;
  const testMultiline = `
    select a, b, c 
      from table
     where a = 'Value with spaces' 
       and b = "Another set of spaces"`;

  ta.assertEquals(goldenSingleLine, ws.singleLineTrim(testMultiline));
});
