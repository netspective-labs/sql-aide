export type FlexibleText =
  | string
  | { readonly fileSystemPath: string | string[] }
  | Iterable<string>
  | ArrayLike<string>
  | Generator<string>;

export type FlexibleTextSupplierSync =
  | FlexibleText
  | (() => FlexibleText);

/**
 * Accept a flexible source of text such as a string, a file system path, an
 * array of strings or a TypeScript Generator and convert them to a string
 * array.
 * @param supplier flexible source of text
 * @returns a resolved string array of text
 */
export const flexibleTextList = (
  supplier: FlexibleTextSupplierSync,
  options?: {
    readTextFileSync?: (...fsPath: string[]) => string[];
  },
): string[] => {
  const readTextFileSync = options?.readTextFileSync ??
    ((...fsPath) => fsPath.map((fsp) => Deno.readTextFileSync(fsp)));

  return typeof supplier === "function"
    ? flexibleTextList(supplier())
    : typeof supplier === "string"
    ? [supplier]
    : (typeof supplier === "object" && "fileSystemPath" in supplier
      ? Array.isArray(supplier.fileSystemPath)
        ? readTextFileSync(...supplier.fileSystemPath)
        : readTextFileSync(supplier.fileSystemPath)
      : Array.from(supplier));
};

/**
 * Accept a flexible source of text such as a string, a file system path, an
 * array of strings or a TypeScript Generator and create a human-friendly
 * message of the supplier type
 * @param supplier flexible source of text
 * @returns a string that explains the type of text provided
 */
export const flexibleTextType = (
  supplier: FlexibleTextSupplierSync,
  isFunctionResult?: boolean,
): string => {
  const ifr = isFunctionResult ? ` (function result)` : ``;
  return typeof supplier === "function"
    ? flexibleTextType(supplier(), true)
    : typeof supplier === "string"
    ? `text${ifr}`
    : (typeof supplier === "object" && "fileSystemPath" in supplier
      ? Array.isArray(supplier.fileSystemPath)
        ? `files ${supplier.fileSystemPath.join(", ")}${ifr}`
        : `file ${supplier.fileSystemPath}${ifr}`
      : `text array${ifr}`);
};
