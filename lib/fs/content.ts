import { File } from "./governance.ts";

export interface Content<Entry> extends File<Entry, Uint8Array> {
  readonly content: () => Promise<Uint8Array>;
}

export interface TextContent<Entry> extends Content<Entry> {
  readonly text: () => Promise<string>;
}

export function streamFromText(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const uint8Array = encoder.encode(text);
  return new ReadableStream({
    start(controller) {
      controller.enqueue(uint8Array);
      controller.close();
    },
  });
}

export async function textFromStream(
  readableStream: ReadableStream<Uint8Array>,
): Promise<string> {
  let chunks = new Uint8Array(0);

  const writableStream: WritableStream<Uint8Array> = new WritableStream({
    write(chunk: Uint8Array) {
      chunks = new Uint8Array([...chunks, ...chunk]);
      return Promise.resolve();
    },
  });

  await readableStream.pipeTo(writableStream);
  return new TextDecoder().decode(chunks);
}
