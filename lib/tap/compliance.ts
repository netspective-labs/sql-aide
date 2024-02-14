import * as tap from "./protocol.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export class TapComplianceBuilder<
  SubjectArea extends string,
  Diagnosable extends tap.Diagnostics,
> extends tap.TapContentBuilder<SubjectArea, Diagnosable> {
  constructor(header = true) {
    super();
    if (header) this.header();
  }

  header(
    content =
      "Quality System (QS) Compliance Assertions and Attestations version 1",
  ) {
    this.bb.comment(content);
    return this;
  }

  async subject<Topic extends string, TopicDiagnosable extends tap.Diagnostics>(
    subject: SubjectArea,
    elems: (
      bb: tap.BodyBuilder<Topic, TopicDiagnosable>,
    ) => void | Promise<void>,
  ) {
    await this.bb.okParent<Topic, TopicDiagnosable>(subject, elems);
    return this;
  }

  static merged(
    builders: Iterable<TapComplianceBuilder<string, tap.Diagnostics>>,
  ) {
    const tcb = new TapComplianceBuilder();
    for (const merge of builders) {
      tcb.bb.content.push(
        ...merge.bb.content.filter((c) => c.nature === "test-case"),
      );
    }
    return tcb.tapContent();
  }

  // use this when the Area must be type-safe but the Topics are not known in
  // advance so it allows `ok` and `notOk` to be used liberally with any text
  static strategy<
    Area extends string,
    EvidenceStrategy extends tap.Diagnostics,
  >(
    area: Area,
    descr?: string,
    tcb = new (class extends TapComplianceBuilder<Area, EvidenceStrategy> {
      constructor() {
        super(false); // don't include a header
      }

      // wraps this.subject so that "subject area" title doesn't need to be passed
      async compliance<
        Topic extends string,
        TopicDiagnosable extends tap.Diagnostics,
      >(
        elems: (
          bb: tap.BodyBuilder<Topic, TopicDiagnosable>,
        ) => void | Promise<void>,
      ) {
        await this.subject<Topic, TopicDiagnosable>(area, elems);
        return this;
      }
    })(),
  ) {
    return { area, descr, tcb };
  }
}

// use this when the area and topics must be type-safe
export function complianceParentStrategy<
  Area extends string,
  AreaEvidence extends tap.Diagnostics,
  Topic extends string,
  TopicEvidence extends tap.Diagnostics,
>(
  area: Area,
  descr: string,
  topics: ReturnType<
    typeof TapComplianceBuilder.strategy<Topic, TopicEvidence>
  >[],
) {
  const tcb = new (class extends TapComplianceBuilder<Area, AreaEvidence> {
    constructor() {
      super(false); // don't include a header
    }

    // wraps this.subject so that "subject area" title doesn't need to be passed
    async compliance(
      elems: (
        bb: tap.BodyBuilder<Topic, TopicEvidence>,
      ) => void | Promise<void>,
    ) {
      await this.subject<Topic, TopicEvidence>(area, elems);
      return this;
    }
  })();
  return { area, descr, topics, tcb };
}
