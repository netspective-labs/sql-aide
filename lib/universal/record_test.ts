import { testingAsserts as ta } from "../../deps-test.ts";
import {
  camelToSnakeCase,
  isIdenticallyShaped,
  snakeToCamelCase,
  transformTabularRecord,
  transformTabularRecords,
} from "./record.ts"; // update with your actual module path

Deno.test("snakeToCamelCase should correctly convert string", () => {
  ta.assertEquals(snakeToCamelCase("hello_world"), "helloWorld");
  ta.assertEquals(snakeToCamelCase("hello_world_again"), "helloWorldAgain");
});

Deno.test("camelToSnakeCase should correctly convert string", () => {
  ta.assertEquals(camelToSnakeCase("helloWorld"), "hello_world");
  ta.assertEquals(camelToSnakeCase("helloWorldAgain"), "hello_world_again");
});

Deno.test("transformTabularRecord should correctly transform an object", () => {
  const input = { helloWorld: "test" };
  const expectedOutput = { hello_world: "test" };
  const result = transformTabularRecord(input);
  ta.assertEquals(result, expectedOutput);
});

Deno.test("transformTabularRecords should correctly transform an array of objects", () => {
  const inputArray = [{ helloWorld: "test" }, { anotherTest: "test2" }];
  const expectedOutputArray = [{ hello_world: "test" }, {
    another_test: "test2",
  }];
  const result = transformTabularRecords(inputArray);
  ta.assertEquals(result, expectedOutputArray);
});

Deno.test("isIdenticallyShaped should correctly evaluate object shapes", () => {
  const identicalArray = [{ helloWorld: "test" }, { helloWorld: "test2" }];
  const nonIdenticalArray = [{ helloWorld: "test" }, { anotherTest: "test2" }];
  ta.assertEquals(isIdenticallyShaped(identicalArray).success, true);
  ta.assertEquals(isIdenticallyShaped(nonIdenticalArray).success, false);
});
