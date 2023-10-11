import { ulid } from "./deps.ts";
import * as SQLa from "../../render/mod.ts";
import * as si from "../../lib/universal/sys-info.ts";
import * as m from "./models.sqla.ts";

export function content<EmitContext extends SQLa.SqlEmitContext>() {
  const models = m.models<EmitContext>();

  // usually we want to use SQLite ulid() to generate but sometimes it's more
  // convenient to compute outside of SQLite and pass it in
  const newUlid = ulid.ulid;

  const activeDevice = (boundary?: string) => {
    return {
      name: Deno.hostname(),
      boundary: boundary ?? "??",
    };
  };

  const device = async (deviceId = { SQL: () => "ulid()" }) => {
    const ad = activeDevice();
    return models.device.prepareInsertable({
      deviceId,
      name: ad.name,
      boundary: ad.boundary,
      deviceElaboration: JSON.stringify({
        hostname: Deno.hostname(),
        networkInterfaces: Deno.networkInterfaces(),
        osPlatformName: si.osPlatformName(),
        osArchitecture: await si.osArchitecture(),
      }),
    });
  };

  return {
    newUlid,
    activeDevice,
    device,
  };
}
