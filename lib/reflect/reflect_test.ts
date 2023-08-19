import { testingAsserts as ta } from "./deps-test.ts";
import * as mod from "./reflect.ts";

// converted to Deno Typescript from github.com/gustavoam-asdf/object-inspector

Deno.test("Basic type checker", async (ctx) => {
  // deno-lint-ignore ban-types
  const nonBasicTypeVariables: (mod.NonPrimitiveType | Function | object)[] = [
    new Date(),
    /asdf/,
    new Error(),
    new Map(),
    new WeakMap(),
    new Set(),
    new WeakSet(),
    new Promise(() => {}),
    [123, 2132, 32],
    {},
    () => {},
    function () {},
    function () {
      console.log("console.log output");
    },
  ];

  await ctx.step("isBoolean", () => {
    const nonBooleans: Array<mod.ExcludeBasicType<boolean>> = [
      undefined,
      null,
      0,
      Symbol(Math.random() * 10),
      Symbol("12"),
      -2.5,
      "",
      "foo",
      ...nonBasicTypeVariables,
    ];

    const booleans = [true, false];

    nonBooleans.forEach((value) => {
      ta.assertEquals(
        mod.isBoolean(value),
        false,
        `${value?.toString()} must not be a boolean`,
      );
    });

    booleans.forEach((value) => {
      ta.assert(mod.isBoolean(value), `${value?.toString()} must be a boolean`);
    });
  });

  await ctx.step("isNull", () => {
    const nonNulls: Array<mod.ExcludeBasicType<null>> = [
      undefined,
      true,
      0,
      Symbol(Math.random()),
      Symbol("12"),
      -2.5,
      "",
      "foo",
      ...nonBasicTypeVariables,
    ];

    const nullValue = null;

    nonNulls.forEach((value) => {
      ta.assert(!mod.isNull(value), `${value?.toString()} must not be a null`);
    });

    ta.assert(mod.isNull(nullValue), `${nullValue} must be a null`);
  });

  await ctx.step("isUndefined", () => {
    const nonUndefineds: Array<mod.ExcludeBasicType<undefined>> = [
      true,
      false,
      0,
      234,
      Symbol(Math.random()),
      Symbol("12"),
      -2.5,
      "",
      "foo",
      ...nonBasicTypeVariables,
    ];

    const undefinedValue = undefined;

    nonUndefineds.forEach((value) => {
      ta.assert(
        !mod.isUndefined(value),
        `${value?.toString()} must not be a undefined`,
      );
    });

    ta.assert(
      mod.isUndefined(undefinedValue),
      `${undefinedValue} must be a undefined`,
    );
  });

  await ctx.step("isNumber", () => {
    const nonNumbers: Array<mod.ExcludeBasicType<number>> = [
      undefined,
      null,
      true,
      false,
      Symbol(Math.random()),
      Symbol("12"),
      "",
      "foo",
      ...nonBasicTypeVariables,
    ];

    const numbers = [0, -2.5, Math.random()];

    nonNumbers.forEach((value) => {
      ta.assert(
        !mod.isNumber(value),
        `${value?.toString()} must not be a number`,
      );
    });

    numbers.forEach((value) => {
      ta.assert(mod.isNumber(value), `${value?.toString()} must be a number`);
    });
  });

  await ctx.step("isString", () => {
    const nonStrings: Array<mod.ExcludeBasicType<string>> = [
      undefined,
      null,
      true,
      false,
      0,
      Symbol(Math.random()),
      Symbol("12"),
      -2.5,
      ...nonBasicTypeVariables,
    ];

    const strings = ["", "foo", "asdfasdfasdf", JSON.stringify(Math.random())];

    nonStrings.forEach((value) => {
      ta.assert(
        !mod.isString(value),
        `${value?.toString()} must not be a string`,
      );
    });

    strings.forEach((value) => {
      ta.assert(mod.isString(value), `${value?.toString()} must be a string`);
    });
  });

  await ctx.step("isSymbol", () => {
    const nonSymbols: Array<mod.ExcludeBasicType<symbol>> = [
      undefined,
      null,
      true,
      false,
      0,
      -2.5,
      "",
      "foo",
      ...nonBasicTypeVariables,
    ];

    const symbols = [Symbol(Math.random()), Symbol("12")];

    nonSymbols.forEach((value) => {
      ta.assert(
        !mod.isSymbol(value),
        `${value?.toString()} must not be a symbol`,
      );
    });

    symbols.forEach((value) => {
      ta.assert(mod.isSymbol(value), `${value?.toString()} must be a symbol`);
    });
  });

  await ctx.step("function", () => {
    const value = function () {};
    const expected = true;
    const result = mod.isFunction(value);

    ta.assertStrictEquals(result, expected);
  });

  await ctx.step("object", () => {
    const value = {};
    const expected = true;
    const result = mod.isObject(value);

    ta.assertStrictEquals(result, expected);
  });
});

Deno.test("Information on a primitive type variable", async (ctx) => {
  await ctx.step("boolean", () => {
    const value = true;
    const expected = { value, type: "boolean" };
    const result = mod.reflect(value);

    ta.assertEquals(result, expected);
  });

  await ctx.step("number", () => {
    const value = 12323;
    const expected = { value, type: "number" };
    const result = mod.reflect(value);

    ta.assertEquals(result, expected);
  });

  await ctx.step("string", () => {
    const value = "adfasd";
    const expected = { value, type: "string" };
    const result = mod.reflect(value);

    ta.assertEquals(result, expected);
  });

  await ctx.step("symbol", () => {
    const value = Symbol("123");
    const expected = { value, type: "symbol", description: "123" };
    const result = mod.reflect(value);

    ta.assertEquals(result, expected);
  });

  await ctx.step("null", () => {
    const value = null;
    const expected = { value, type: "object" };
    const result = mod.reflect(value);

    ta.assertEquals(result, expected);
  });

  await ctx.step("undefined", () => {
    const value = undefined;
    const expected = { value, type: "undefined" };
    const result = mod.reflect(value);

    ta.assertEquals(result, expected);
  });
});

// console.log(mod.reflect(() => {}))
// console.log(mod.reflect(mod.isFunction))
// console.log(mod.reflect(mod.isBoolean))

// const obj = mod.reflect({
// 	prop: "value",
// 	[Symbol("asdf")]: "value",
// 	[Symbol("testFunction")]: function () {
// 		return function () {
// 			console.log("Hola")
// 		}
// 	},
// 	[Symbol(123123)]: {
// 		data: 234
// 	},
// 	fecha: new Date(),
// 	mySimb: Symbol(12),
// 	data: [
// 		{
// 			prop: "value"
// 		},
// 		{
// 			prop: 1323
// 		},
// 		{
// 			prop: true
// 		},
// 		{
// 			prop: new Date()
// 		}
// 	],
// 	action() {
// 		console.log("Function")
// 	},
// 	get test() {
// 		return "asdfasdf"
// 	}
// })
// console.log(obj)
