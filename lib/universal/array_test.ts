// array_test.ts
import { testingAsserts as ta } from "../../deps-test.ts";
import { distinctEntries } from "./array.ts";

Deno.test("distinctEntries should return all items if all are unique", () => {
  const input = [
    { id: 1, value: "A" },
    { id: 2, value: "B" },
    { id: 3, value: "C" },
  ];
  const output = distinctEntries(input);
  ta.assertEquals(output, input);
});

Deno.test("distinctEntries should filter out duplicate objects", () => {
  const input = [
    { id: 1, value: "A" },
    { id: 1, value: "A" },
    { id: 2, value: "B" },
  ];
  const expected = [
    { id: 1, value: "A" },
    { id: 2, value: "B" },
  ];
  const output = distinctEntries(input);
  ta.assertEquals(output, expected);
});

Deno.test("distinctEntries should handle complex objects", () => {
  const input = [
    { id: 1, details: { first: "A", second: "B" } },
    { id: 1, details: { first: "A", second: "B" } },
    { id: 2, details: { first: "C", second: "D" } },
  ];
  const expected = [
    { id: 1, details: { first: "A", second: "B" } },
    { id: 2, details: { first: "C", second: "D" } },
  ];
  const output = distinctEntries(input);
  ta.assertEquals(output, expected);
});

Deno.test("distinctEntries should return an empty array for empty input", () => {
  const input: Record<string, string>[] = [];
  const output = distinctEntries(input);
  ta.assertEquals(output, []);
});
