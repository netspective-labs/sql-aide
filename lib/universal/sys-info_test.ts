import { testingAsserts as ta } from "../../deps-test.ts";
import * as mod from "./sys-info.ts";

Deno.test("osPlatformName function should return the OS name", () => {
  const expected = Deno.build.os;
  ta.assertEquals(mod.osPlatformName(), expected);
});

Deno.test("osArchitecture function should return x64 or x86", async () => {
  const result = await mod.osArchitecture();
  ta.assertEquals(["x64", "x86"].includes(result), true);
});

Deno.test("paths function should return correct paths", () => {
  ta.assertEquals(
    mod.homePath(),
    Deno.env.get("HOME") ?? Deno.env.get("USERPROFILE"),
  );
});

Deno.test("publicIpAddress function should return an IP address", async () => {
  const result = await mod.publicIpAddress();
  const isIPv4 = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/.test(result);
  ta.assertEquals(isIPv4, true);
});

Deno.test("publicIpAddress function should return an IPv6 when asked", async () => {
  const result = await mod.publicIpAddress(true);
  const isIPv6 = /([0-9a-fA-F]{0,4}:){1,7}[0-9a-fA-F]{0,4}/.test(result);
  ta.assertEquals(isIPv6, true);
});
