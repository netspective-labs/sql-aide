#!/usr/bin/env -S deno run --allow-all

export enum ExecutionContext {
  PRODUCTION = "production",
  TEST = "test",
  DEVELOPMENT = "devl",
  SANDBOX = "sandbox",
  EXPERIMENTAL = "experimental",
}

export enum VerificationType {
  NOT_VERIFIED = "Not Verified",
  PENDING_VERIFICATION = "Verification Pending",
  VERIFIED = "Verified",
  FAILED_VERIFICATION = "Verification Failed",
  OPTED_OUT = "Opted Out",
}
