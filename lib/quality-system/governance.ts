import * as safety from "../../lib/universal/safety.ts";

export type Documentable = { readonly description: string };

export const isDocumentable = safety.typeGuard<Documentable>("description");

export type QualitySystemSupplier<QualitySystem extends Documentable> = {
  readonly qualitySystem: QualitySystem;
};

export function isQualitySystemSupplier<QualitySystem extends Documentable>(
  o: unknown,
): o is QualitySystemSupplier<QualitySystem> {
  const isQS = safety.typeGuard<QualitySystemSupplier<QualitySystem>>(
    "qualitySystem",
  );
  return isQS(o) && o.qualitySystem ? true : false;
}
