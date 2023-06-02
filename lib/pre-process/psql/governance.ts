export type DirectiveDeclState = {
  readonly state: "mutated" | "not-mutated" | "removed";
  readonly line: string;
} | {
  readonly state: "replaced";
  readonly lines: string[] | undefined;
};

export interface Directive {
  readonly directive: string;
  readonly isDirective: (encountered: {
    readonly line: string;
    readonly lineNum: number;
  }) => boolean;
  readonly handleDeclaration: (encountered: {
    readonly line: string;
    readonly lineNum: number;
  }) => DirectiveDeclState;
}
