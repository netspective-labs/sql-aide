import { testingAsserts as ta } from "./deps-test.ts";
import {
  detectedValueNature,
  TransformArrayValuesStream,
  TransformObjectValuesStream,
} from "./value.ts";

Deno.test("determineType function", () => {
  ta.assertEquals(detectedValueNature("true").nature, "boolean");
  ta.assertEquals(detectedValueNature("on").nature, "boolean");
  ta.assertEquals(detectedValueNature("yes").nature, "boolean");
  ta.assertEquals(detectedValueNature("false").nature, "boolean");
  ta.assertEquals(detectedValueNature("off").nature, "boolean");
  ta.assertEquals(detectedValueNature("no").nature, "boolean");
  ta.assertEquals(detectedValueNature("123").nature, "number");
  ta.assertEquals(detectedValueNature("123n").nature, "bigint");
  ta.assertEquals(detectedValueNature("{Red}").nature, "union");
  ta.assertEquals(detectedValueNature("2022-01-01").nature, "Date");
  ta.assertEquals(detectedValueNature("John Doe").nature, "string");
});

Deno.test("TransformObjectValuesStream class", async () => {
  type Input = { age: string; name: string; isStudent: string };
  type Output = { age: number; name: string; isStudent: boolean };

  const stream = new TransformObjectValuesStream<Input, Output>();
  const writer = stream.writable.getWriter();
  const reader = stream.readable.getReader();

  const inputData: Input[] = [
    { age: "25", name: "John", isStudent: "true" },
    { age: "30", name: "Jane", isStudent: "false" },
    { age: "28", name: "Doe", isStudent: "true" },
  ];

  const expectedOutput: Output[] = [
    { age: 25, name: "John", isStudent: true },
    { age: 30, name: "Jane", isStudent: false },
    { age: 28, name: "Doe", isStudent: true },
  ];

  for (const data of inputData) {
    writer.write(data);
  }
  writer.close();

  for (const expected of expectedOutput) {
    const result = await reader.read();
    ta.assertEquals(result.value, expected);
  }
});

Deno.test("TransformArrayValuesStream class", async () => {
  type Input = [string, string, string];
  type Output = [number, string, boolean];

  const stream = new TransformArrayValuesStream<Input, Output>();
  const writer = stream.writable.getWriter();
  const reader = stream.readable.getReader();

  const inputData: Input[] = [
    ["25", "John", "true"],
    ["30", "Jane", "false"],
    ["28", "Doe", "true"],
  ];

  const expectedOutput: Output[] = [
    [25, "John", true],
    [30, "Jane", false],
    [28, "Doe", true],
  ];

  for (const data of inputData) {
    writer.write(data);
  }
  writer.close();

  for (const expected of expectedOutput) {
    const result = await reader.read();
    ta.assertEquals(result.value, expected);
  }
});
