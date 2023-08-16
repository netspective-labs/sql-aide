import { assertEquals } from "./deps-test.ts";
import { detectedValueNature } from "./value.ts";

Deno.test("determineType function", () => {
  assertEquals(detectedValueNature("true").nature, "boolean");
  assertEquals(detectedValueNature("on").nature, "boolean");
  assertEquals(detectedValueNature("yes").nature, "boolean");
  assertEquals(detectedValueNature("false").nature, "boolean");
  assertEquals(detectedValueNature("off").nature, "boolean");
  assertEquals(detectedValueNature("no").nature, "boolean");
  assertEquals(detectedValueNature("123").nature, "number");
  assertEquals(detectedValueNature("123n").nature, "bigint");
  assertEquals(detectedValueNature("{Red}").nature, "union");
  assertEquals(detectedValueNature("2022-01-01").nature, "Date");
  assertEquals(detectedValueNature("John Doe").nature, "string");
});
