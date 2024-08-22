import { testingAsserts as ta } from "./deps-test.ts";
import { callables, callablesCollection, CallablesNature } from "./callable.ts";

// Test class for testing callables
class TestClass {
  private instanceVar = "instanceVar";

  foo() {
    return 42;
  }
  bar(message: string) {
    return `Hello, ${message} (${this.instanceVar}Value)`;
  }
  baz = "not a method";
}

// Test object for testing callables
const testObject = {
  greet: (name: string) => `Hi, ${name}`,
  add: (a: number, b: number) => a + b,
  description: "I am an object",
};

Deno.test("callables - should return method names for a class instance", () => {
  const instance = new TestClass();
  const result = callables(instance);

  ta.assertEquals(result.identifiers, ["foo", "bar"]);
  ta.assertEquals(result.nature, CallablesNature.CLASS);
});

Deno.test("callables - should return method names for an object", () => {
  const result = callables(testObject);

  ta.assertEquals(result.identifiers, ["greet", "add"]);
  ta.assertEquals(result.nature, CallablesNature.OBJECT);
});

Deno.test("callables - should filter methods based on include and exclude criteria", async () => {
  const instance = new TestClass();
  const result = callables(instance);

  let filteredMethods = result.filter({
    include: (name) => name.startsWith("f"), // Include methods starting with "f"
    exclude: "bar", // Exclude method named "bar"
  });

  ta.assertEquals(filteredMethods.length, 1);
  ta.assertEquals(filteredMethods[0].callable, "foo");
  ta.assertEquals(await filteredMethods[0].call(), 42);

  filteredMethods = result.filter({ include: "bar" });

  ta.assertEquals(filteredMethods.length, 1);
  ta.assertEquals(filteredMethods[0].callable, "bar");
  ta.assertEquals(
    filteredMethods[0].callSync("bar"),
    "Hello, bar (instanceVarValue)",
  );
});

Deno.test("callables - should handle standalone object functions correctly", async () => {
  const result = callables(testObject);

  const filteredMethods = result.filter();

  ta.assertEquals(filteredMethods.length, 2);
  ta.assertEquals(filteredMethods[0].callable, "greet");
  ta.assertEquals(await filteredMethods[0].call("Alice"), "Hi, Alice");

  ta.assertEquals(filteredMethods[1].callable, "add");
  ta.assertEquals(filteredMethods[1].callSync(2, 3), 5);
});

Deno.test("callables - should throw an error for invalid instance types", () => {
  ta.assertThrows(
    () => {
      callables(null);
    },
    TypeError,
    "The provided instance must be an object or a constructed class instance.",
  );

  ta.assertThrows(
    () => {
      callables("not an object");
    },
    TypeError,
    "The provided instance must be an object or a constructed class instance.",
  );

  ta.assertThrows(
    () => {
      callables([1, 2, 3]);
    },
    TypeError,
    "The provided instance must be an object or a constructed class instance.",
  );
});

Deno.test("callables - should handle filtering by string, RegExp, and function", () => {
  const instance = new TestClass();
  const result = callables(instance);

  // Filtering by string
  const byString = result.filter({ include: "foo" });
  ta.assertEquals(byString.length, 1);
  ta.assertEquals(byString[0].callable, "foo");

  // Filtering by RegExp
  const byRegExp = result.filter({ include: /ba/ });
  ta.assertEquals(byRegExp.length, 1);
  ta.assertEquals(byRegExp[0].callable, "bar");

  // Filtering by function
  const byFunction = result.filter({ include: (name) => name.length === 3 });
  ta.assertEquals(byFunction.length, 2);
  ta.assertEquals(byFunction[0].callable, "foo");
  ta.assertEquals(byFunction[1].callable, "bar");
});

Deno.test("callables - should handle complex object with nested functions", () => {
  const complexObject = {
    level1: {
      greet: () => "Hello from level 1",
      level2: {
        sayHi: () => "Hi from level 2",
      },
    },
    describe: () => "I am a complex object",
  };

  const result = callables(complexObject);

  const filteredMethods = result.filter();

  ta.assertEquals(filteredMethods.length, 1);
  ta.assertEquals(filteredMethods[0].callable, "describe");
  ta.assertEquals(filteredMethods[0].callSync(), "I am a complex object");
});

Deno.test("callables - should ensure `this` context is correctly handled in class methods", () => {
  class ThisContextClass {
    name = "Deno";

    getName() {
      return this.name;
    }
  }

  const instance = new ThisContextClass();
  const result = callables(instance);

  const filteredMethods = result.filter();

  ta.assertEquals(filteredMethods.length, 1);
  ta.assertEquals(filteredMethods[0].callable, "getName");
  ta.assertEquals(filteredMethods[0].callSync(), "Deno");
});

Deno.test("callablesCollection - should return combined callables and allow filtering across multiple instances", () => {
  class Notebook1 {
    cell1() {
      return "Notebook 1 - Cell 1";
    }
    cell2() {
      return "Notebook 1 - Cell 2";
    }
  }

  class Notebook2 {
    cell3() {
      return "Notebook 2 - Cell 3";
    }
    cell4() {
      return "Notebook 2 - Cell 4";
    }
  }

  const notebook1 = new Notebook1();
  const notebook2 = new Notebook2();

  const collectionResult = callablesCollection<Notebook1 | Notebook2, unknown>(
    notebook1,
    notebook2,
  );

  // Assert that callables are identified correctly for each notebook
  ta.assertEquals(collectionResult.callables.length, 2);
  ta.assertEquals(collectionResult.callables[0].identifiers, [
    "cell1",
    "cell2",
  ]);
  ta.assertEquals(collectionResult.callables[1].identifiers, [
    "cell3",
    "cell4",
  ]);

  // Filter callables across both notebooks using a RegExp
  const filtered = collectionResult.filter({ include: /cell/ });

  // Assert the filtered result contains the correct callable names
  ta.assertEquals(filtered.length, 4);
  ta.assertEquals(filtered[0].callable, "cell1");
  ta.assertEquals(filtered[1].callable, "cell2");
  ta.assertEquals(filtered[2].callable, "cell3");
  ta.assertEquals(filtered[3].callable, "cell4");

  // Assert the callable methods return the expected results
  ta.assertEquals(filtered[0].callSync(), "Notebook 1 - Cell 1");
  ta.assertEquals(filtered[1].callSync(), "Notebook 1 - Cell 2");
  ta.assertEquals(filtered[2].callSync(), "Notebook 2 - Cell 3");
  ta.assertEquals(filtered[3].callSync(), "Notebook 2 - Cell 4");
});
