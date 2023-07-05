import JSON5 from "npm:json5";
import { zod as z } from "./deps.ts";

export const connectionDescriptorSchema = z.object({
  vendor: z.string().optional().default("PostgreSQL"),
  provenance: z.string().optional().default(".pgpass"),
  id: z.string(),
  description: z.optional(z.string()),
  boundary: z.optional(z.string()),
  srcLineNumber: z.number(),
});
export type ConnectionDescriptor = z.infer<typeof connectionDescriptorSchema>;

// to test this RegExp, you can use https://regex101.com/ REPL
export const pgConnUrlPattern =
  /^postgres.*?:\/\/[^:]*(:[^@]*)?@[^:]*:[^\/]*\/.*/;
export const connectionSchema = z.object({
  index: z.number(),
  connDescr: z.object(connectionDescriptorSchema.shape),
  host: z.string(),
  port: z.string().transform<number>((text) => parseInt(text)),
  database: z.string(),
  username: z.string(),
  password: z.string(),
  connURL: z.string().regex(pgConnUrlPattern),
  srcLineNumber: z.number(),
});
export type Connection = z.infer<typeof connectionSchema>;

/**
 * Parse a .pgpass file formatted with "descriptors" above the connection
 * arguments. Before each .pgpass line you should include a strict JSON5L
 * definition that includes properties such as:
 * - id: unique ID where "XYZ" will become the environment variable prefix
 * - description: human=friendly elaboration of purpose
 * - boundary: human=friendly name of network or location of the connection
 *
 * Example:
 * { id: "XYZ", description: "Purpose", boundary: "Network" }
 * 192.168.2.x:5432:database:postgres:sup3rSecure!
 *
 * @param src The source file (e.g. ~/.pgpass)
 * @param options Whether the passwords should masked
 * @returns List of connections and issues
 */
export async function parse(
  src: string,
  options?: { maskPassword?: (passwd: string) => string },
) {
  const conns: Connection[] = [];
  const connsDict = new Map<string, Connection>();
  const issues: { message: string; error?: Error; srcLineNumber: number }[] =
    [];
  const pgpass = await Deno.readTextFile(src);
  let activeConnDescr: ConnectionDescriptor | undefined;
  let srcLineNumber = 0;
  for (const line of pgpass.split(/\n/)) {
    srcLineNumber++;
    // process comments
    if (line.match(/^#/)) {
      // NLH .pgpass convention assumes that before each connection is defined we
      // should should include a strict JSONL definition that includes a line like
      // { id: "XYZ", description: "Purpose", boundary: "Network" }
      if (line.match(/^#\s+\{.*\}\s*$/)) {
        const jsonl = line.slice(1);
        try {
          // remove the starting #, convert to POJO, then let Zod validate it
          activeConnDescr = connectionDescriptorSchema.parse({
            ...(JSON5.parse(jsonl) as object),
            srcLineNumber,
          });
        } catch (error) {
          issues.push({
            message: `Unable to parse conn descriptor: ${jsonl}`,
            error,
            srcLineNumber,
          });
        }
      }
    } else if (line.trim().length == 0) {
      // skip blank lines
    } else {
      if (!activeConnDescr) {
        issues.push({
          message: "conn has no descriptor preceding it.",
          srcLineNumber,
        });
        continue;
      }

      // anything that's not a comment is a line like this:
      // # hostname:port:database:username:password
      // e.g. 192.168.2.x:5432:database:postgres:sup3rSecure!
      try {
        let [host, port, database, username, password] = line.split(":");
        if (options?.maskPassword) password = options.maskPassword(password);
        const connURL =
          `postgres://${username}:${password}@${host}:${port}/${database}`;
        const potentialConn = {
          index: conns.length,
          connDescr: activeConnDescr,
          host,
          port,
          database,
          username,
          password,
          connURL,
          srcLineNumber,
        };
        const conn = connectionSchema.parse(potentialConn);
        conns.push(conn);
        if (connsDict.get(conn.connDescr.id)) {
          // deno-fmt-ignore
          issues.push({message: `'${conn.connDescr.id}' used multiple times`, srcLineNumber})
        } else {
          connsDict.set(conn.connDescr.id, conn);
        }
        activeConnDescr = undefined; // reset it since we've used it
      } catch (error) {
        issues.push({
          message: `Unable to conn descriptor: ${line}`,
          error,
          srcLineNumber,
        });
      }
    }
  }
  return { conns, connsDict, issues };
}
