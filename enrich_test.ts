import { testingAsserts as ta } from "./deps-test.ts";
import * as e from "./enrich.ts";

const expectType = <T>(_value: T) => {
  // Do nothing, the TypeScript compiler handles this for us
};

Deno.test("flexible enrichments", async (tc) => {
  type SyntheticTarget = {
    readonly isTarget: true;
  };

  type SyntheticEnrichment = {
    property1: string;
    property2: number;
  };

  type SyntheticEnrichmentSupplier = {
    syntheticEnrichment: SyntheticEnrichment;
  };

  const se = e.flexibleEnrichment<
    SyntheticTarget,
    SyntheticEnrichment,
    SyntheticEnrichmentSupplier
  >("syntheticEnrichment");

  await tc.step("access enrichment directly", () => {
    const unenrichedTarget: SyntheticTarget = {
      isTarget: true,
    };
    const enrichedTarget1 = se.withEnrichment(unenrichedTarget, () => ({
      property1: "enrichedText1",
      property2: 1285,
    }));
    const enrichedTarget2 = se.withEnrichment(unenrichedTarget, () => ({
      property1: "enrichedText2",
      property2: 34,
    }));

    // NOTE: internally the object is still the following shape:
    //   {
    //     isTarget: true,
    //     syntheticEnrichment: { ... },
    //   }
    // However, for ease of access (especially in Typescript type-checking)
    // it looks "flat" without 'syntheticEnrichment' or the partent attrs;

    expectType<SyntheticTarget>(unenrichedTarget);
    expectType<SyntheticEnrichment>(
      enrichedTarget1,
    );
    expectType<SyntheticEnrichment>(
      enrichedTarget2,
    );

    ta.assert(se.isEnrichmentSupplier(unenrichedTarget));

    ta.assertEquals(enrichedTarget1, {
      property1: "enrichedText1",
      property2: 1285,
    });
    ta.assertEquals(enrichedTarget2, {
      property1: "enrichedText1",
      property2: 1285,
    });
    // enriching a second time doesn't change the original
    ta.assertEquals(enrichedTarget1, enrichedTarget2);

    const enrichedTarget3 = se.withEnrichmentCustom(unenrichedTarget, () => ({
      property1: "enrichedText3",
      property2: 56,
    }));
    ta.assertEquals(enrichedTarget3, {
      property1: "enrichedText3",
      property2: 56,
    });
  });

  await tc.step("access through enrichment supplier", () => {
    const unenrichedTarget: SyntheticTarget = {
      isTarget: true,
    };
    const enrichedTarget1 = se.withEnrichmentSupplier(unenrichedTarget, () => ({
      property1: "enrichedText1",
      property2: 1285,
    }));
    const enrichedTarget2 = se.withEnrichmentSupplier(unenrichedTarget, () => ({
      property1: "enrichedText2",
      property2: 34,
    }));

    expectType<SyntheticTarget>(unenrichedTarget);
    expectType<SyntheticTarget & SyntheticEnrichmentSupplier>(
      enrichedTarget1,
    );
    expectType<SyntheticTarget & SyntheticEnrichmentSupplier>(
      enrichedTarget2,
    );

    ta.assert(se.isEnrichmentSupplier(unenrichedTarget));

    ta.assertEquals(enrichedTarget1, {
      isTarget: true,
      syntheticEnrichment: {
        property1: "enrichedText1",
        property2: 1285,
      },
    });
    ta.assertEquals(enrichedTarget2, {
      isTarget: true,
      syntheticEnrichment: {
        property1: "enrichedText1",
        property2: 1285,
      },
    });
    // enriching a second time doesn't change the original
    ta.assertEquals(enrichedTarget1, enrichedTarget2);

    const enrichedTarget3 = se.withEnrichmentSupplierCustom(
      unenrichedTarget,
      () => ({
        property1: "enrichedText3",
        property2: 56,
      }),
    );
    ta.assertEquals(enrichedTarget3, {
      isTarget: true,
      syntheticEnrichment: {
        property1: "enrichedText3",
        property2: 56,
      },
    });

    const denriched = se.deenriched(enrichedTarget3);
    ta.assertEquals(denriched, {
      isTarget: true,
    });
  });
});
