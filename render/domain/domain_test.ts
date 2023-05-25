import { zod as z } from "../deps.ts";
import { testingAsserts as ta } from "../deps-test.ts";
import * as za from "../../lib/universal/zod-aide.ts";
import * as tmpl from "../emit/mod.ts";
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
    ta.assert(ztsdFactory.detachFrom);
    ta.assert(ztsdFactory.from);
    ta.assert(ztsdFactory.cacheableFrom);
  });
});

Deno.test("SQLa domain from Zod Types", async (tc) => {
  const textSD = ztsdFactory.cacheableFrom(z.string(), {
    identity: "syntheticText",
  });
  const textOptionalSD = ztsdFactory.cacheableFrom(z.string().optional(), {
    identity: "syntheticTextOptional",
  });
  const textOptionalDefaultSD = ztsdFactory.cacheableFrom(
    z.string().optional().default("syntheticTextOptionalDefault-defaultValue"),
    {
      identity: "syntheticTextOptionalDefault",
    },
  );
  const numberSD = ztsdFactory.cacheableFrom(z.number(), {
    identity: "syntheticNumber",
  });

  enum NativeEnumOrdinal {
    NativeEnumOrdinal_1,
    NativeEnumOrdinal_2,
  }

  enum SyntheticZodEnum {
    NativeEnumText_1 = "enum-text-1",
    NativeEnumText_2 = "enum-text-2",
  }

  const nativeEnumOrdinalSD = ztsdFactory.cacheableFrom(
    z.nativeEnum(NativeEnumOrdinal),
    { identity: "nativeEnumOrdinal" },
  );

  type SZE = [`${SyntheticZodEnum}`, ...(readonly `${SyntheticZodEnum}`[])];
  const szeValues = Object.values(SyntheticZodEnum) as SZE;
  const zodEnum = z.enum(szeValues);

  const zodEnumSD = ztsdFactory.cacheableFrom(zodEnum, {
    identity: "syntheticZodEnum",
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
    expectType<
      d.SqlDomain<
        z.ZodNativeEnum<typeof NativeEnumOrdinal>,
        SyntheticContext,
        "nativeEnumOrdinal"
      >
    >(nativeEnumOrdinalSD);
    expectType<
      d.SqlDomain<
        z.ZodEnum<SZE>,
        SyntheticContext,
        "syntheticZodEnum"
      >
    >(zodEnumSD);
  });

  await tc.step("SqlDomain identity", () => {
    ta.assertEquals(textSD.identity, "syntheticText");
    ta.assertEquals(textOptionalSD.identity, "syntheticTextOptional");
    ta.assertEquals(
      textOptionalDefaultSD.identity,
      "syntheticTextOptionalDefault",
    );
    ta.assertEquals(numberSD.identity, "syntheticNumber");
    ta.assertEquals(nativeEnumOrdinalSD.identity, "nativeEnumOrdinal");
    ta.assertEquals(zodEnumSD.identity, "syntheticZodEnum");
  });

  await tc.step("SqlDomain can access Dialect", async (tc) => {
    const { ctx } = sqlGen();

    await tc.step("primary context", () => {
      const csd = ctx.sqlDialect;
      ta.assert(tmpl.isAnsiSqlDialect(csd));
      ta.assertEquals(csd.identity("presentation"), "ANSI");
      ta.assertEquals(tmpl.isSqliteDialect(csd), false);
      ta.assertEquals(tmpl.isPostgreSqlDialect(csd), false);
      ta.assertEquals(tmpl.isMsSqlServerDialect(csd), false);

      const sd = ztsdFactory.stringSDF.stringDialect(z.string());
      ta.assertEquals(
        sd.sqlDataType().SQL(ctx),
        `TEXT /* {"identity":"ANSI","isAnsiSqlDialect":true,"isSqliteDialect":false,"isPostgreSqlDialect":false,"isMsSqlServerDialect":false} */`,
      );
    });

    await tc.step("secondary context", () => {
      const pgCtx: SyntheticContext = {
        ...tmpl.typicalSqlEmitContext({ sqlDialect: tmpl.postgreSqlDialect() }),
        customContextProp1: "customContextProp1Value",
        executedAt: new Date(),
      };

      const csd = pgCtx.sqlDialect;
      ta.assert(tmpl.isAnsiSqlDialect(csd));
      ta.assertEquals(csd.identity("presentation"), "PostgreSQL");
      ta.assertEquals(tmpl.isSqliteDialect(csd), false);
      ta.assertEquals(tmpl.isPostgreSqlDialect(csd), true);
      ta.assertEquals(tmpl.isMsSqlServerDialect(csd), false);

      const sd = ztsdFactory.stringSDF.stringDialect(z.string());
      ta.assertEquals(
        sd.sqlDataType().SQL(pgCtx),
        `TEXT /* {"identity":"PostgreSQL","isAnsiSqlDialect":true,"isSqliteDialect":false,"isPostgreSqlDialect":true,"isMsSqlServerDialect":false} */`,
      );
    });
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
    ta.assertEquals(types(nativeEnumOrdinalSD), {
      nullable: false,
      sqlDataType: "INTEGER",
    });
    ta.assertEquals(types(zodEnumSD), {
      nullable: false,
      sqlDataType: "TEXT",
    });
  });
});

Deno.test("SQLa custom domain based on native Zod type", async (tc) => {
  const syntheticZB = za.zodBaggage<
    d.SqlDomain<Any, SyntheticContext, Any>,
    d.SqlDomainSupplier<Any, Any, SyntheticContext>
  >("sqlDomain");

  await tc.step("native zod domains plus a custom domain", async (innerTC) => {
    type MyCustomColumnDefn = {
      readonly isCustomProperty1: true;
      readonly customPropertyValue: number;
    };
    const isMyCustomColumnDefn = (o: unknown): o is MyCustomColumnDefn => {
      return (o && typeof o === "object" && "isCustomProperty1" in o &&
          "customPropertyValue" in o &&
          typeof o.customPropertyValue === "number")
        ? true
        : false;
    };

    function customDomainNumeric() {
      const zodSchema = z.number();
      const customSD:
        & d.SqlDomain<z.ZodNumber, SyntheticContext, Any>
        & MyCustomColumnDefn = {
          ...ztsdFactory.cacheableFrom<Any, z.ZodNumber>(zodSchema),
          isCustomProperty1: true,
          customPropertyValue: 2459,
        };

      // we're "wrapping" a Zod type in a JS Proxy so we mutate the zod schema
      // to hold our custom properties in a single object and then return zod
      // schema so it can be used as-is in other libraries; we need to "trick"
      // TypeScript into thinking that the mutated zod object is a
      // MyCustomColumnDefn SqlDomainSupplier in case any further strongly
      // typed actions need to take place (like downstream type-building)
      return syntheticZB.zodTypeBaggageProxy<typeof zodSchema>(
        zodSchema,
        customSD,
      ) as unknown as
        & typeof zodSchema
        & d.SqlCustomDomainSupplier<
          MyCustomColumnDefn,
          z.ZodNumber,
          Any,
          SyntheticContext
        >;
    }

    await innerTC.step("type safety", () => {
      const customNumeric = customDomainNumeric();
      expectType<
        & z.ZodNumber
        & {
          sqlDomain:
            & d.SqlDomain<z.ZodNumber, SyntheticContext, Any>
            & MyCustomColumnDefn;
        }
      >(customNumeric);
      const domain: z.infer<typeof customNumeric> = 1;
      expectType<z.infer<typeof customNumeric>>(domain);
      ta.assert(isMyCustomColumnDefn(customNumeric.sqlDomain));
    });

    await innerTC.step("SQL types", () => {
      const { ctx } = sqlGen();
      const customNumeric = customDomainNumeric();
      ta.assertEquals(
        customNumeric.sqlDomain.identity,
        "SQL_DOMAIN_NOT_IN_COLLECTION",
      );
      ta.assertEquals(
        customNumeric.sqlDomain.sqlDataType("create table column").SQL(ctx),
        "INTEGER",
      );
    });
  });
});
