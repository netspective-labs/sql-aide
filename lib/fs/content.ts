import { File } from "./governance.ts";

export interface Content<Entry> extends File<Entry> {
  readonly content: () => Promise<Uint8Array>;
}

export interface TextContent<Entry> extends Content<Entry> {
  readonly text: () => Promise<string>;
}
