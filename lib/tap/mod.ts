import * as yaml from "https://deno.land/std@0.213.0/yaml/stringify.ts";
import * as safety from "../universal/safety.ts";

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

export interface MutatablePlanNode extends safety.DeepWriteable<PlanNode> {
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

export interface TestCase<Diagnosable extends Record<string, unknown>>
  extends TapNode<"test-case"> {
  readonly index?: number;
  readonly description: string;
  readonly ok: boolean;
  readonly directive?: Directive;
  readonly diagnostic?: Diagnosable;
  readonly subtests?: SubTests<Diagnosable>;
}

export interface SubTests<Diagnosable extends Record<string, unknown>> {
  readonly body: Iterable<TestSuiteElement<Diagnosable>>;
  readonly title?: string;
  readonly plan?: PlanNode;
}

export type TestSuiteElement<Diagnosable extends Record<string, unknown>> =
  | CommentNode
  | TestCase<Diagnosable>;

export interface TapContent<Diagnosable extends Record<string, unknown>> {
  readonly version?: VersionNode;
  readonly plan?: PlanNode;
  readonly body: Iterable<TestSuiteElement<Diagnosable>>;
  readonly footers: Iterable<FooterNode>;
}

type InitTestCaseBuilder<
  Diagnosable extends Record<string, unknown>,
  Elaboration extends Diagnosable,
> =
  & Partial<Pick<TestCase<Elaboration>, "index" | "diagnostic">>
  & {
    readonly subtests?: (
      bb: BodyBuilder<Elaboration>,
    ) => Promise<SubTests<Elaboration>> | SubTests<Elaboration>;
    readonly todo?: string;
    readonly skip?: string;
  };

export class BodyFactory<Diagnosable extends Record<string, unknown>> {
  constructor(
    readonly nestedBodyBuilder: () => BodyBuilder<Diagnosable>,
  ) {
  }

  async testCase<Elaboration extends Diagnosable = Diagnosable>(
    ok: boolean,
    description: string,
    init?: InitTestCaseBuilder<Diagnosable, Elaboration>,
  ) {
    const directive = (): Directive | undefined => {
      if (init?.todo) return { nature: "TODO", reason: init.todo };
      if (init?.skip) return { nature: "SKIP", reason: init.skip };
      return undefined;
    };

    let subtests: SubTests<Elaboration> | undefined = undefined;
    if (init?.subtests) {
      let nestedBB: BodyBuilder<Elaboration> | undefined = undefined;
      nestedBB = this.nestedBodyBuilder() as BodyBuilder<Elaboration>;
      subtests = await init.subtests(nestedBB);
    }

    const testCase: TestCase<Elaboration> = {
      nature: "test-case",
      ok,
      description,
      index: init?.index,
      directive: directive(),
      diagnostic: init?.diagnostic,
      subtests,
    };
    return testCase;
  }

  ok<Elaboration extends Diagnosable = Diagnosable>(
    description: string,
    init?: InitTestCaseBuilder<Diagnosable, Elaboration>,
  ) {
    return this.testCase<Elaboration>(true, description, init);
  }

  notOk<Elaboration extends Diagnosable = Diagnosable>(
    description: string,
    init?: InitTestCaseBuilder<Diagnosable, Elaboration>,
  ) {
    return this.testCase<Elaboration>(false, description, init);
  }

  comment(comment: string) {
    return { nature: "comment", content: comment } as CommentNode;
  }
}

export class BodyBuilder<Diagnosable extends Record<string, unknown>> {
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

  async compose<Elaboration extends Diagnosable = Diagnosable>(
    ...elems: (
      | Promise<TestSuiteElement<Elaboration>>
      | TestSuiteElement<Elaboration>
    )[]
  ) {
    this.content.push(...await Promise.all(elems));
  }

  async ok<Elaboration extends Diagnosable = Diagnosable>(
    description: string,
    init?: InitTestCaseBuilder<Diagnosable, Elaboration>,
  ) {
    this.content.push(await this.factory.ok<Elaboration>(description, init));
    return this;
  }

  async notOk<Elaboration extends Diagnosable = Diagnosable>(
    description: string,
    init?: InitTestCaseBuilder<Diagnosable, Elaboration>,
  ) {
    this.content.push(await this.factory.notOk<Elaboration>(description, init));
    return this;
  }

  comment(comment: string) {
    this.content.push({ nature: "comment", content: comment });
    return this;
  }
}

export class TapContentBuilder<
  Diagnosable extends Record<string, unknown> = Record<string, unknown>,
  BB extends BodyBuilder<Diagnosable> = BodyBuilder<Diagnosable>,
> {
  #bb: BB;
  readonly footers: FooterNode[] = [];

  constructor(
    readonly bbSupplier: () => BB,
    readonly version = 14,
  ) {
    this.#bb = bbSupplier();
  }

  get body() {
    return this.#bb;
  }

  async populate(
    init: (bb: BB, footers: FooterNode[]) => void | Promise<void>,
  ) {
    await init(this.body, this.footers);
    return this;
  }

  tapContent(): TapContent<Diagnosable> {
    return {
      version: { nature: "version", version: this.version },
      plan: this.body.plan(),
      body: this.body.content,
      footers: this.footers,
    };
  }

  static create() {
    return new TapContentBuilder(() => new BodyBuilder());
  }
}

export function stringify<Diagnosable extends Record<string, unknown>>(
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
    const yamlBlock = (yamlBlock: Record<string, unknown>): string => {
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
        if (element.diagnostic) {
          elementResult += `\n${yamlBlock(element.diagnostic)}`;
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
