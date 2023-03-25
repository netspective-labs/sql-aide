import { testingAsserts as ta } from "../../deps-test.ts";
import * as mod from "./safety.ts";

export interface TestType {
  readonly testPropName: string;
}

export interface TestSubType extends TestType {
  readonly subTypePropName: string;
}

export type TestTypeArray = TestType[];

const [isTestType, isTestTypeArray] = mod.typeGuards<
  TestType,
  TestTypeArray
>("testPropName");

const isTestSubType = mod.subTypeGuard<TestType, TestSubType>(
  isTestType,
  "subTypePropName",
);

const isAllTypes = mod.multipleTypesGuard<TestType & TestSubType, TestSubType>(
  [isTestType, isTestSubType],
  "testPropName",
  "subTypePropName",
);

Deno.test(`type guard`, () => {
  ta.assert(isTestType({ testPropName: "test prop value" }));
  ta.assert(!isTestType({ invalidPropName: "test prop value" }));
});

Deno.test(`subtype guard`, () => {
  ta.assert(
    isTestSubType({
      testPropName: "test prop value",
      subTypePropName: "test prop value",
    }),
  );
  ta.assert(
    !isTestSubType({
      testPropName: "test prop value",
      invalidPropName: "test prop value",
    }),
  );
  ta.assert(!isTestSubType({ invalidPropName: "test prop value" }));
});

Deno.test(`multiple types guard`, () => {
  ta.assert(
    isAllTypes({
      testPropName: "test prop value",
      subTypePropName: "test prop value",
    }),
  );
  ta.assert(
    !isAllTypes({
      testPropName: "test prop value",
      invalidPropName: "test prop value",
    }),
  );
  ta.assert(!isTestSubType({ invalidPropName: "test prop value" }));
});

Deno.test(`type array guard`, () => {
  ta.assert(
    isTestTypeArray(
      [
        { testPropName: "test prop value 1" },
        { testPropName: "test prop value 2" },
        { testPropName: "test prop value 3" },
      ],
    ),
  );
  ta.assert(
    !isTestTypeArray(
      [
        { testPropName: "test prop value 1" },
        { testPropName: "test prop value 2" },
        { wrongPropName: "test prop value 3" },
      ],
    ),
  );
});

interface StronglyTyped {
  text: string;
  flag?: boolean;
  numeric?: number;
  required: string;
}

type FlagOrNumeric = mod.RequireAtLeastOne<
  StronglyTyped,
  "flag" | "numeric"
>;

Deno.test(`RequireAtLeastOne<StronglyTyped>`, () => {
  const withFlag: FlagOrNumeric = {
    text: "test1",
    flag: true,
    required: "test2",
  };

  const withNumeric: FlagOrNumeric = {
    text: "test1",
    numeric: 45,
    required: "test2",
  };

  // to test: uncomment this to see an error
  // const errorWithNeither: FlagOrNumeric = {
  //   text: "test",
  //   required: "icon",
  // };

  const noErrorWithBoth: FlagOrNumeric = {
    text: "test1",
    flag: false,
    numeric: 37,
    required: "test2",
  };

  // to test: uncomment this to see an error
  // const errorWithBothWhenOneHasWrongType: FlagOrNumeric = {
  //   text: "test1",
  //   flag: false,
  //   numeric: "should be a number here",
  //   required: "test2",
  // };

  ta.assert(withFlag);
  ta.assert(withNumeric);
  ta.assert(noErrorWithBoth);
});

type OnlyOneFlagOrNumeric = mod.RequireOnlyOne<
  StronglyTyped,
  "flag" | "numeric"
>;

Deno.test(`RequireOnlyOne<StronglyTyped>`, () => {
  const noErrorWithOnlyOne: OnlyOneFlagOrNumeric = {
    text: "test1",
    flag: true,
    required: "test2",
  };

  // to test: uncomment this to see an error
  // const errorWithBoth: OnlyOneFlagOrNumeric = {
  //   text: "test1",
  //   flag: false,
  //   numeric: 53,
  //   required: "test2",
  // };

  // This interface will be used to trick OnlyOneFlagOrNumeric into allowing an object with both
  interface TrickStronglyTyped {
    text: string;
    numeric: number;
    required: string;
  }

  const hasBoth = {
    text: "test",
    flag: true,
    numeric: 24,
    required: "test2",
  };

  // No error because excess properties are only disallowed when directly assigning an object literal
  const temp: TrickStronglyTyped = hasBoth;

  // No error despite temp actually having both because TS only knows that temp is a TrickStronglyTyped
  const trickIntoAllowingBoth: OnlyOneFlagOrNumeric = temp;

  ta.assert(noErrorWithOnlyOne);
  ta.assert(temp);
  ta.assert(trickIntoAllowingBoth);
});
