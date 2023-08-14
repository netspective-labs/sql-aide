import { assertEquals } from "https://deno.land/std@0.190.0/testing/asserts.ts";
import { detectedValueNature, safeContent } from "./mod.ts";

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

Deno.test("safeContent with async generator function", async () => {
  async function* rowsGenerator() {
    yield ["name", "color", "isActive", "birthdate", "type"];
    yield ["John", "{Red}", "true", "1998-05-12", "undefined"];
    yield ["Doe", "{Green}", "false", "March 15, 1993", "something else"];
  }
  const result = await safeContent(
    rowsGenerator(),
    {
      rowTypeName: "Person",
      rowsConstName: "people",
      valueNature: (index, value) => {
        if (index == 4) {
          return {
            nature: "custom",
            emitTsType: () => `string | undefined`,
            emitTsValue: (value) =>
              value.trim().length == 0 || value == "undefined"
                ? "undefined"
                : `"${value}"`,
          };
        }
        return detectedValueNature(value);
      },
    },
  );
  const expectedTypeDefinitions = `type Person = {
  name: string;
  color: "Red" | "Green";
  isActive: boolean;
  birthdate: Date;
  type: string | undefined;
};`;

  const expectedRowContent = `const people: Person[] = [
  {
    name: "John",
    color: "Red",
    isActive: true,
    birthdate: Date.parse("1998-05-12"),
    type: undefined,
  },
  {
    name: "Doe",
    color: "Green",
    isActive: false,
    birthdate: Date.parse("March 15, 1993"),
    type: "something else",
  },
];`;

  assertEquals(result.rowType, expectedTypeDefinitions);
  assertEquals(result.rowsConst, expectedRowContent);
});
