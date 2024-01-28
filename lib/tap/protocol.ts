import * as yaml from "https://deno.land/std@0.213.0/yaml/stringify.ts";

export type Diagnostics = Record<string, unknown>;

export interface TapNode<Nature extends string> {
  readonly nature: Nature;
}

export interface TapDirective<Nature extends string> {
  readonly nature: Nature;
}

export interface VersionNode extends TapNode<"version"> {
  readonly version: number;
}

export interface PlanNode extends TapNode<"plan"> {
  readonly start: number;
  readonly end: number;
  readonly skip?: SkipDirective;
}

export type Writeable<T> = {
  -readonly [P in keyof T]: Writeable<T[P]>;
};

export interface MutatablePlanNode extends Writeable<PlanNode> {
  readonly nextPlanIndex: () => number;
}

export interface SkipDirective extends TapDirective<"SKIP"> {
  readonly reason: string;
}

export interface TodoDirective extends TapDirective<"TODO"> {
  readonly reason: string;
}

export interface BailOutDirective extends TapDirective<"BAIL_OUT"> {
  readonly reason: string;
}

export type Directive = SkipDirective | TodoDirective | BailOutDirective;

export interface CommentNode extends TapDirective<"comment"> {
  readonly content: string;
}

export interface FooterNode extends TapDirective<"footer"> {
  readonly content: string;
}

export interface TestCase<Diagnosable extends Diagnostics>
  extends TapNode<"test-case"> {
  readonly index?: number;
  readonly description: string;
  readonly ok: boolean;
  readonly directive?: Directive;
  readonly diagnostics?: Diagnosable;
  readonly subtests?: SubTests<Diagnosable>;
}

export interface SubTests<Diagnosable extends Diagnostics> {
  readonly body: Iterable<TestSuiteElement<Diagnosable>>;
  readonly title?: string;
  readonly plan?: PlanNode;
}

export type TestSuiteElement<Diagnosable extends Diagnostics> =
  | CommentNode
  | TestCase<Diagnosable>;

export interface TapContent<Diagnosable extends Diagnostics> {
  readonly version?: VersionNode;
  readonly plan?: PlanNode;
  readonly body: Iterable<TestSuiteElement<Diagnosable>>;
  readonly footers: Iterable<FooterNode>;
}

export type InitTestCaseBuilder<Diagnosable extends Diagnostics> =
  & Partial<Pick<TestCase<Diagnosable>, "index" | "diagnostics">>
  & {
    readonly subtests?: (
      bb: BodyBuilder<Diagnosable>,
    ) => Promise<SubTests<Diagnosable>> | SubTests<Diagnosable>;
    readonly todo?: string;
    readonly skip?: string;
  };

export type TestCaseBuilderArgs<Diagnosable extends Diagnostics> =
  InitTestCaseBuilder<Diagnosable>;

export class BodyFactory<Diagnosable extends Diagnostics> {
  constructor(
    readonly nestedBodyBuilder: () => BodyBuilder<Diagnosable>,
  ) {
  }

  async testCase(
    ok: boolean,
    description: string,
    args?: TestCaseBuilderArgs<Diagnosable>,
  ) {
    const directive = (): Directive | undefined => {
      if (args?.todo) return { nature: "TODO", reason: args.todo };
      if (args?.skip) return { nature: "SKIP", reason: args.skip };
      return undefined;
    };

    let subtests: SubTests<Diagnosable> | undefined = undefined;
    if (args?.subtests) {
      const nestedBB = this.nestedBodyBuilder();
      subtests = await args.subtests(nestedBB);
    }

    const testCase: TestCase<Diagnosable> = {
      nature: "test-case",
      ok,
      description,
      index: args?.index,
      directive: directive(),
      diagnostics: args?.diagnostics,
      subtests,
    };
    return testCase;
  }

  ok(description: string, args?: TestCaseBuilderArgs<Diagnosable>) {
    return this.testCase(true, description, args);
  }

  notOk(description: string, args?: TestCaseBuilderArgs<Diagnosable>) {
    return this.testCase(false, description, args);
  }

  comment(comment: string) {
    return { nature: "comment", content: comment } as CommentNode;
  }
}

export class BodyBuilder<Diagnosable extends Diagnostics> {
  readonly factory = new BodyFactory<Diagnosable>(() =>
    new BodyBuilder<Diagnosable>()
  );
  readonly content: TestSuiteElement<Diagnosable>[] = [];

  plan() {
    const result: PlanNode = {
      nature: "plan",
      start: 1,
      end: this.content.filter((e) => e.nature === "test-case").length,
    };
    return result;
  }

  /**
   * Accept yielded test suite elements
   */
  async populate(
    elems: (
      factory: BodyFactory<Diagnosable>,
    ) => AsyncGenerator<TestSuiteElement<Diagnosable>>,
  ) {
    for await (const e of elems(this.factory)) {
      this.content.push(e);
    }
  }

  /**
   * Accept a series of type-safe `TestSuiteElement`s yielded as a generator
   * when subtypes might have different diagnostics types.
   * @param elems
   */
  async populateCustom<CustomD extends Diagnostics>(
    elems: (
      factory: BodyFactory<CustomD>,
    ) => AsyncGenerator<TestSuiteElement<CustomD>>,
  ) {
    const customF = new BodyFactory<CustomD>(() => new BodyBuilder<CustomD>());
    for await (const e of elems(customF)) {
      // coerce the CustomD for storage into this.content
      this.content.push(e as TestSuiteElement<Diagnosable>);
    }
  }

  /**
   * Accept a series of `TestSuiteElement`s that might have been created as
   * promises or were already awaited and resolve all the promises then "compose"
   * them into the body content. This is often more convenient than calling
   * await to resolve promises on a per-test-case basis.
   * @param elems
   */
  async compose(
    ...elems: (
      | Promise<TestSuiteElement<Diagnosable>>
      | TestSuiteElement<Diagnosable>
    )[]
  ) {
    this.content.push(...await Promise.all(elems));
  }

  async ok(
    description: string,
    init?: InitTestCaseBuilder<Diagnosable>,
  ) {
    this.content.push(await this.factory.ok(description, init));
    return this;
  }

  async notOk(
    description: string,
    init?: InitTestCaseBuilder<Diagnosable>,
  ) {
    this.content.push(await this.factory.notOk(description, init));
    return this;
  }

  comment(comment: string) {
    this.content.push(this.factory.comment(comment));
    return this;
  }
}

export class TapContentBuilder<Diagnosable extends Diagnostics> {
  readonly bb = new BodyBuilder<Diagnosable>();
  readonly footers: FooterNode[] = [];

  constructor(
    readonly version = 14,
  ) {
  }

  tapContent(): TapContent<Diagnosable> {
    return {
      version: { nature: "version", version: this.version },
      plan: this.bb.plan(),
      body: this.bb.content as Iterable<TestSuiteElement<Diagnosable>>,
      footers: this.footers,
    };
  }

  tapContentText() {
    return stringify(this.tapContent());
  }
}

export function stringify<Diagnosable extends Diagnostics>(
  tc: TapContent<Diagnosable>,
): string {
  let result = "";

  function escapeSpecialChars(str: string): string {
    return str.replace(/#/g, "\\#");
  }

  function processElement(
    element: TestSuiteElement<Diagnosable>,
    nextIndex: () => number,
    depth: number,
  ): string {
    const indent = "  ".repeat(depth);
    let elementResult = "";

    // Function to format YAML block with proper alignment
    const yamlBlock = (yamlBlock: Diagnostics): string => {
      const yamlIndented = yaml.stringify(yamlBlock)
        .split("\n")
        .map((line) => `${indent}  ${line}`)
        .join("\n")
        .trimEnd(); // Ensure no trailing spaces

      return `${indent}  ---\n${yamlIndented}\n${indent}  ...\n`;
    };

    switch (element.nature) {
      case "test-case": {
        const index = nextIndex();
        const description = escapeSpecialChars(element.description);
        elementResult += `${indent}${element.ok ? "ok" : "not ok"} ${
          element.index ?? index
        } - ${description}`;
        if (element.directive) {
          const directiveReason = escapeSpecialChars(element.directive.reason);
          elementResult += ` # ${element.directive.nature} ${directiveReason}`;
        }
        if (element.diagnostics) {
          elementResult += `\n${yamlBlock(element.diagnostics)}`;
        }
        if (element.subtests) {
          const subtests = element.subtests;
          if (subtests.title) {
            elementResult += `\n\n${indent}# Subtest: ${
              escapeSpecialChars(subtests.title)
            }\n`;
          }
          if (subtests.plan) {
            elementResult += `${"  ".repeat(depth + 1)}1..${subtests.plan.end}`;
            if (subtests.plan.skip) {
              const planReason = escapeSpecialChars(subtests.plan.skip.reason);
              elementResult += ` # SKIP ${planReason}`;
            }
            elementResult += "\n";
          }
          let subElemIdx = 0;
          for (const nestedElement of subtests.body) {
            elementResult += processElement(
              nestedElement,
              () => ++subElemIdx,
              depth + 1,
            );
          }
        }
        elementResult += "\n";
        break;
      }
      case "comment": {
        const commentContent = escapeSpecialChars(element.content);
        elementResult += `${indent}# ${commentContent}\n`;
        break;
      }
    }

    return elementResult;
  }

  // Process version and top-level plan
  if (tc.version) {
    result += `TAP version ${tc.version.version}\n`;
  }

  if (tc.plan) {
    result += `1..${tc.plan.end}`;
    if (tc.plan.skip) {
      const planReason = escapeSpecialChars(tc.plan.skip.reason);
      result += ` # SKIP ${planReason}`;
    }
    result += "\n";
  }

  let index = 0;
  for (const element of tc.body) {
    result += processElement(element, () => ++index, 0);
  }

  // Process footers
  for (const footer of tc.footers) {
    const footerContent = escapeSpecialChars(footer.content);
    result += `# ${footerContent}\n`;
  }

  return result;
}
