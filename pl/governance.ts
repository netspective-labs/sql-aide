import { zod as z } from "../deps.ts";
import * as safety from "../lib/universal/safety.ts";
import * as emit from "../emit/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;
export type ANONYMOUS = "ANONYMOUS";

export interface RoutineBody<
  BodyIdentity extends string,
  Context extends emit.SqlEmitContext,
> extends emit.SqlTextSupplier<Context> {
  readonly identity?: BodyIdentity;
  readonly isValid: boolean;
  readonly content: emit.SqlTextSupplier<Context>;
}

export interface RoutineDefinition<
  RoutineName extends string,
  Context extends emit.SqlEmitContext,
> extends emit.SqlTextSupplier<Context> {
  readonly isValid: boolean;
  readonly body: RoutineBody<RoutineName, Context>;
}

export interface AnonymousRoutineDefn<
  Context extends emit.SqlEmitContext,
> extends RoutineDefinition<ANONYMOUS, Context> {
  readonly isAnonymousRoutine: boolean;
  readonly isValid: boolean;
  readonly body: RoutineBody<ANONYMOUS, Context>;
}

export interface NamedRoutineDefn<
  RoutineName extends string,
  ArgsShape extends z.ZodRawShape,
  Context extends emit.SqlEmitContext,
> extends RoutineDefinition<RoutineName, Context> {
  readonly routineName: RoutineName;
  readonly isValid: boolean;
  readonly body: RoutineBody<RoutineName, Context>;
  readonly argsDefn: ArgsShape;
  readonly isIdempotent: boolean;
}

export function isAnonymousRoutineDefn<
  Context extends emit.SqlEmitContext,
>(
  o: unknown,
): o is AnonymousRoutineDefn<Context> {
  const isViewDefn = safety.typeGuard<
    AnonymousRoutineDefn<Context>
  >(
    "isAnonymousRoutine",
    "body",
    "SQL",
  );
  return isViewDefn(o);
}

export function isRoutineDefinition<
  RoutineName extends string,
  ArgsShape extends z.ZodRawShape,
  Context extends emit.SqlEmitContext,
>(
  o: unknown,
): o is NamedRoutineDefn<RoutineName, ArgsShape, Context> {
  const isViewDefn = safety.typeGuard<
    NamedRoutineDefn<RoutineName, ArgsShape, Context>
  >(
    "routineName",
    "body",
    "SQL",
  );
  return isViewDefn(o);
}
