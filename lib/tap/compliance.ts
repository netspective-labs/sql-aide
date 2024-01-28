import * as tap from "./protocol.ts";

export class TapComplianceBodyBuilder<Diagnosable extends tap.Diagnostics>
  extends tap.BodyBuilder<Diagnosable> {
}

export class TapComplianceBuilder<Diagnosable extends tap.Diagnostics> {
  #tcb = new tap.TapContentBuilder<Diagnosable>();

  constructor() {
    this.header();
  }

  header(
    content =
      "Quality System (QS) Compliance Assertions and Attestations version 1",
  ) {
    this.#tcb.bb.comment(content);
    return this;
  }

  async subject(
    area: string,
    elems: (
      factory: tap.BodyFactory<Diagnosable>,
    ) => AsyncGenerator<tap.TestSuiteElement<Diagnosable>>,
  ) {
    await this.#tcb.bb.ok(area, {
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
    await this.#tcb.bb.populate(elems);
    return this;
  }

  tapContent() {
    return this.#tcb.tapContent();
  }

  tapContentText() {
    return this.#tcb.tapContentText();
  }
}
