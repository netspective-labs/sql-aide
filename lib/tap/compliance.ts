import * as tap from "./protocol.ts";

export class TapComplianceBuilder<
  SubjectArea extends string,
  Diagnosable extends tap.Diagnostics,
> {
  readonly contentBuilder = new tap.TapContentBuilder<Diagnosable>();

  constructor(header = true) {
    if (header) this.header();
  }

  header(
    content =
      "Quality System (QS) Compliance Assertions and Attestations version 1",
  ) {
    this.contentBuilder.bb.comment(content);
    return this;
  }

  async subject(
    area: SubjectArea,
    elems: (
      factory: tap.BodyFactory<Diagnosable>,
    ) => AsyncGenerator<tap.TestSuiteElement<Diagnosable>>,
  ) {
    await this.contentBuilder.bb.ok(area, {
      subtests: async (bb) => {
        await bb.populate(elems);
        return {
          nature: "sub-test",
          body: bb.content,
          title: area,
          plan: bb.plan(),
        };
      },
    });
    return this;
  }

  async populate(
    elems: (
      factory: tap.BodyFactory<Diagnosable>,
    ) => AsyncGenerator<tap.TestSuiteElement<Diagnosable>>,
  ) {
    await this.contentBuilder.bb.populate(elems);
    return this;
  }

  tapContent() {
    return this.contentBuilder.tapContent();
  }

  tapContentText() {
    return this.contentBuilder.tapContentText();
  }
}
