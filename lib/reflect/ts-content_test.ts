import { testingAsserts as ta } from "./deps-test.ts";
import { detectedValueNature } from "./value.ts";
import { toTypeScriptCode } from "./ts-content.ts";

Deno.test("toTypeScriptCode with async generator function", async () => {
  async function* rowsGenerator() {
    yield ["name", "color", "isActive", "birthdate", "type"];
    yield ["John", "{Red}", "true", "1998-05-12", "undefined"];
    yield ["Doe", "{Green}", "false", "March 15, 1993", "something else"];
  }
  const result = await toTypeScriptCode(
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
            transform: (value) =>
              value.trim().length == 0 || value == "undefined"
                ? undefined
                : value,
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

  ta.assertEquals(result.rowType, expectedTypeDefinitions);
  ta.assertEquals(result.rowsConst, expectedRowContent);
});
