export type PsqlMetaCmdState = {
  readonly state: "mutated" | "not-mutated" | "removed";
  readonly line: string;
} | {
  readonly state: "replaced";
  readonly lines: string[] | undefined;
};

export interface PsqlMetaCommand {
  readonly metaCommand: string;
  readonly isMetaCommand: (encountered: {
    readonly line: string;
    readonly lineNum: number;
  }) => boolean;
  readonly handleMetaCommand: (encountered: {
    readonly line: string;
    readonly lineNum: number;
  }) => PsqlMetaCmdState;
}

export function processPsqlMetaCmd(
  d: PsqlMetaCommand,
  lines: string[],
): string[] {
  const result: string[] = [];
  let lineNum = 0;
  for (const line of lines) {
    lineNum++;
    const encountered = { line, lineNum };
    if (d.isMetaCommand(encountered)) {
      const hd = d.handleMetaCommand(encountered);
      switch (hd.state) {
        case "mutated":
        case "not-mutated":
          result.push(hd.line);
          break;

        case "replaced":
          if (hd.lines) result.push(...hd.lines);
          break;

        case "removed":
          // don't include in the destination
          break;
      }
    } else {
      result.push(line);
    }
  }
  return result;
}
