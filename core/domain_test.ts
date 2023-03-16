import { zod as z } from "../deps.ts";
import { testingAsserts as ta } from "../deps-test.ts";
import * as tmpl from "../sql.ts";
import * as d from "./domain.ts";

// deno-lint-ignore no-explicit-any
type Any = any; // make it easy on linter

const expectType = <T>(_value: T) => {
  // Do nothing, the TypeScript compiler handles this for us
};

type SyntheticContext = tmpl.SqlEmitContext & {
  readonly customContextProp1: string;
  readonly executedAt: Date;
};
const ztsdFactory = d.zodTypeSqlDomainFactory<Any, SyntheticContext>();

const sqlGen = () => {
  const ctx: SyntheticContext = {
    ...tmpl.typicalSqlEmitContext(),
    customContextProp1: "customContextProp1Value",
    executedAt: new Date(),
  };
  const ddlOptions = tmpl.typicalSqlTextSupplierOptions();
  const lintState = tmpl.typicalSqlLintSummaries(
    ddlOptions.sqlTextLintState,
  );
  return { ctx, ddlOptions, lintState };
};

Deno.test("SQLa domain factories", async (tc) => {
  await tc.step("zodTypeSqlDomainFactory", () => {
    ta.assert(ztsdFactory);
    ta.assert(ztsdFactory.anySDF);
    ta.assert(ztsdFactory.stringSDF);
    ta.assert(ztsdFactory.numberSDF);
    ta.assert(ztsdFactory.coreSqlDomain);
  });
});

Deno.test("SQLa domain from Zod Types", async (tc) => {
  const textSD = ztsdFactory.coreSqlDomain(z.string(), {
    identity: "syntheticText",
  });
  const textOptionalSD = ztsdFactory.coreSqlDomain(z.string().optional(), {
    identity: "syntheticTextOptional",
  });
  const textOptionalDefaultSD = ztsdFactory.coreSqlDomain(
    z.string().optional().default("syntheticTextOptionalDefault-defaultValue"),
    {
      identity: "syntheticTextOptionalDefault",
    },
  );
  const numberSD = ztsdFactory.coreSqlDomain(z.number(), {
    identity: "syntheticNumber",
  });

  await tc.step("SqlDomain compile-time type safety", () => {
    expectType<d.SqlDomain<z.ZodString, SyntheticContext, "syntheticText">>(
      textSD,
    );
    expectType<
      d.SqlDomain<
        z.ZodOptional<z.ZodString>,
        SyntheticContext,
        "syntheticTextOptional"
      >
    >(textOptionalSD);
    expectType<
      d.SqlDomain<
        z.ZodDefault<z.ZodOptional<z.ZodString>>,
        SyntheticContext,
        "syntheticTextOptionalDefault"
      >
    >(textOptionalDefaultSD);
    expectType<d.SqlDomain<z.ZodNumber, SyntheticContext, "syntheticNumber">>(
      numberSD,
    );
  });

  await tc.step("SqlDomain identity", () => {
    ta.assertEquals(textSD.identity, "syntheticText");
    ta.assertEquals(textOptionalSD.identity, "syntheticTextOptional");
    ta.assertEquals(
      textOptionalDefaultSD.identity,
      "syntheticTextOptionalDefault",
    );
    ta.assertEquals(numberSD.identity, "syntheticNumber");
  });

  await tc.step("SqlDomain SQL types", () => {
    const { ctx } = sqlGen();
    const types = (domain: d.SqlDomain<Any, SyntheticContext, Any>) => ({
      nullable: domain.isNullable(),
      sqlDataType: domain.sqlDataType("create table column").SQL(ctx),
    });
    ta.assertEquals(types(textSD), { nullable: false, sqlDataType: "TEXT" });
    ta.assertEquals(types(textOptionalSD), {
      nullable: true,
      sqlDataType: "TEXT",
    });
    ta.assertEquals(types(textOptionalDefaultSD), {
      nullable: true,
      sqlDataType: "TEXT",
    });
    ta.assertEquals(types(numberSD), {
      nullable: false,
      sqlDataType: "INTEGER",
    });
  });
});
