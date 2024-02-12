import * as tap from "./protocol.ts";

export class TapComplianceBuilder<
  SubjectArea extends string,
  Diagnosable extends tap.Diagnostics,
> extends tap.TapContentBuilder<
  SubjectArea,
  Diagnosable
> {
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
}
