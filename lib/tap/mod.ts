import * as yaml from "https://deno.land/std@0.213.0/yaml/stringify.ts";

export interface TapNode<Kind extends string> {
  readonly kind: Kind;
}

export interface TapDirective<Kind extends string> {
  readonly kind: Kind;
}

export interface VersionNode extends TapNode<"version"> {
  readonly version: number;
}

export interface PlanNode extends TapNode<"plan"> {
  readonly start: number;
  readonly end: number;
  readonly skip?: Readonly<SkipDirective>;
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

export interface TestCase<Diagnosable extends Record<string, unknown>>
  extends TapNode<"test-case"> {
  readonly index: number;
  readonly description: string;
  readonly ok: boolean;
  readonly directive?: Readonly<Directive>;
  readonly diagnostic?: Readonly<Diagnosable>;
  readonly subTest?: Readonly<NestedTestSuite<Diagnosable>>;
}

export interface SubTest<Diagnosable extends Record<string, unknown>>
  extends TapNode<"sub-test"> {
  readonly title: string;
  readonly body: Iterable<Readonly<TestSuiteElement<Diagnosable>>>;
}

export type TestSuiteElement<Diagnosable extends Record<string, unknown>> =
  | CommentNode
  | TestCase<Diagnosable>
  | SubTest<Diagnosable>
  | NestedTestSuite<Diagnosable>;

export interface NestedTestSuite<Diagnosable extends Record<string, unknown>>
  extends TapNode<"nested-suite"> {
  readonly title: string;
  readonly body: Iterable<Readonly<TestSuiteElement<Diagnosable>>>;
  readonly plan?: Readonly<PlanNode>;
  readonly diagnostic?: Readonly<Diagnosable>;
}

export interface TapContent<Diagnosable extends Record<string, unknown>> {
  readonly version?: Readonly<VersionNode>;
  readonly plan?: Readonly<PlanNode>;
  readonly body: Iterable<Readonly<TestSuiteElement<Diagnosable>>>;
  readonly footers: Iterable<Readonly<FooterNode>>;
}

type InitTestCase<Diagnosable extends Record<string, unknown>> =
  & Partial<Pick<TestCase<Diagnosable>, "index" | "diagnostic">>
  & { readonly todo?: string; readonly skip?: string };

export class BodyBuilder<Diagnosable extends Record<string, unknown>> {
  #plansCount = 0;
  readonly content: TestSuiteElement<Diagnosable>[] = [];

  get plansCount() {
    return this.#plansCount;
  }

  testCase<Elaboration extends Diagnosable = Diagnosable>(
    ok: boolean,
    description: string,
    init?: InitTestCase<Elaboration>,
  ) {
    const directive = (): Directive | undefined => {
      if (init?.todo) return { kind: "TODO", reason: init.todo };
      if (init?.skip) return { kind: "SKIP", reason: init.skip };
      return undefined;
    };
    const testCase: TestCase<Elaboration> = {
      kind: "test-case",
      ok,
      description,
      index: init?.index ?? ++this.#plansCount,
      directive: directive(),
      ...init,
    };
    return testCase;
  }

  ok<Elaboration extends Diagnosable = Diagnosable>(
    description: string,
    init?: InitTestCase<Elaboration>,
  ) {
    const tc = this.testCase<Elaboration>(true, description, init);
    this.content.push(tc);
    return this;
  }

  notOk<Elaboration extends Diagnosable = Diagnosable>(
    description: string,
    init?: InitTestCase<Elaboration>,
  ) {
    const tc = this.testCase<Elaboration>(false, description, init);
    this.content.push(tc);
    return this;
  }

  comment(comment: string) {
    this.content.push({ kind: "comment", content: comment });
    return this;
  }
}

export class TapContentBuilder<
  Diagnosable extends Record<string, unknown> = Record<string, unknown>,
> {
  #bb = new BodyBuilder<Diagnosable>();
  readonly footers: FooterNode[] = [];

  constructor(readonly version = 14) {
  }

  get body() {
    return this.#bb;
  }

  async populate(
    init: (
      bb: BodyBuilder<Diagnosable>,
      footers: FooterNode[],
    ) => void | Promise<void>,
  ) {
    await init(this.body, this.footers);
    return this;
  }

  tapContent(): TapContent<Diagnosable> {
    const body = this.body.content;
    return {
      version: { kind: "version", version: this.version },
      plan: body.length < 1
        ? { kind: "plan", start: -1, end: -1 }
        : { kind: "plan", start: 1, end: this.body.plansCount },
      body,
      footers: this.footers,
    };
  }
}

export function stringify<Diagnosable extends Record<string, unknown>>(
  tc: TapContent<Diagnosable>,
): string {
  let result = "";

  // Function to escape special characters
  function escapeSpecialChars(str: string): string {
    return str.replace(/#/g, "\\#");
  }

  // Helper function for processing elements
  function processElement(
    element: TestSuiteElement<Diagnosable>,
    depth: number,
  ): string {
    const indent = "  ".repeat(depth);
    let elementResult = "";

    // Function to format YAML block with proper alignment
    const yamlBlock = (yamlBlock: Record<string, unknown>): string => {
      const yamlIndented = yaml.stringify(yamlBlock)
        .split("\n")
        .map((line) => `${indent}  ${line}`)
        .join("\n")
        .trimEnd(); // Ensure no trailing spaces

      return `${indent}  ---\n${yamlIndented}\n${indent}  ...\n`;
    };

    switch (element.kind) {
      case "test-case": {
        const description = escapeSpecialChars(element.description);
        elementResult += `${indent}${
          element.ok ? "ok" : "not ok"
        } ${element.index} - ${description}`;
        if (element.directive) {
          const directiveReason = escapeSpecialChars(element.directive.reason);
          elementResult += ` # ${element.directive.kind} ${directiveReason}`;
        }
        if (element.diagnostic) {
          elementResult += `\n${yamlBlock(element.diagnostic)}`;
        }
        elementResult += "\n";
        break;
      }
      case "sub-test": {
        const subTitle = escapeSpecialChars(element.title);
        elementResult += `${indent}# Subtest: ${subTitle}\n`;
        for (const nestedElement of element.body) {
          elementResult += processElement(nestedElement, depth + 1);
        }
        break;
      }
      case "nested-suite": {
        const suiteTitle = escapeSpecialChars(element.title);
        elementResult += `${indent}# Nested Suite: ${suiteTitle}\n`;
        if (element.plan) {
          elementResult += `${indent}1..${element.plan.end}`;
          if (element.plan.skip) {
            const planReason = escapeSpecialChars(element.plan.skip.reason);
            elementResult += ` # SKIP ${planReason}`;
          }
          elementResult += "\n";
        }
        for (const nestedElement of element.body) {
          elementResult += processElement(nestedElement, depth + 1);
        }
        if (element.diagnostic) {
          elementResult += `\n${yamlBlock(element.diagnostic)}`;
        }
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

  // Process body elements
  for (const element of tc.body) {
    result += processElement(element, 0);
  }

  // Process footers
  for (const footer of tc.footers) {
    const footerContent = escapeSpecialChars(footer.content);
    result += `# ${footerContent}\n`;
  }

  return result;
}
