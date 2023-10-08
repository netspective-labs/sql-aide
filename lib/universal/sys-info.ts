import { path } from "../../deps.ts";

export function osPlatformName() {
  return Deno.build.os;
}

export async function osArchitecture() {
  const decoder = new TextDecoder("utf-8");
  if (Deno.build.arch === "x86_64") {
    return "x64";
  }

  if (Deno.build.os === "darwin") {
    return "x64";
  }

  if (Deno.build.os === "windows") {
    const systemRoot = Deno.env.get("SystemRoot");
    const sysRoot = systemRoot && Deno.statSync(systemRoot)
      ? systemRoot
      : "C:\\Windows";

    let isWOW64 = false;
    try {
      isWOW64 = sysRoot
        ? !!Deno.statSync(path.join(sysRoot, "sysnative"))
        : false;
    } catch (_err) {
      // no worries
    }

    return isWOW64 ? "x64" : "x86";
  }

  if (Deno.build.os === "linux") {
    const command = new Deno.Command("getconf", {
      args: ["LONG_BIT"],
      stdout: "piped",
    });
    const { stdout } = await command.output();
    const output = decoder.decode(stdout);
    return output === "64\n" ? "x64" : "x86";
  }

  return "x86";
}

export function deviceIpAddresses() {
  return Deno.networkInterfaces();
}

export const homePath = (relPath?: string) =>
  path.join(
    Deno.env.get("HOME") ?? Deno.env.get("USERPROFILE") ?? "",
    relPath ?? "",
  );

export async function publicIpAddress(ipv6 = false) {
  const isIPv4 = (ip: string) =>
    /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/.test(ip);

  const endpoint = ipv6 ? "https://api64.ipify.org" : "https://api.ipify.org";
  let response: { [key: string]: string };
  try {
    response = await (await fetch(`${endpoint}?format=json`)).json();
    if (ipv6 === true && isIPv4(response.ip)) {
      throw new Error(`IPv6 is not supported by ${endpoint}`);
    }
  } catch (err) {
    return `error: ${err}`;
  }

  return response.ip;
}
