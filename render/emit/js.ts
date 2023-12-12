import * as tmpl from "./sql.ts";

export type JsTokenSupplier<Context extends tmpl.SqlEmitContext> = (
  ctx: Context,
  usage: "singular" | "plural",
  purpose:
    | "js-var-decl"
    | "js-class-member-decl"
    | "js-var-ref"
    | "ts-type-decl"
    | "rust-struct-member-decl"
    | "rust-type-decl"
    | "sql-token"
    | "sql-token-quoted",
) => string;

export function jsSnakeCaseToken<Context extends tmpl.SqlEmitContext>(
  singular: string,
  plural = `${singular}s`,
): JsTokenSupplier<Context> {
  const snakeToCamelCase = (str: string) =>
    str.replace(/([-_]\w)/g, (g) => g[1].toUpperCase());

  const snakeToPascalCase = (str: string) => {
    const camelCase = snakeToCamelCase(str);
    return camelCase[0].toUpperCase() + camelCase.substring(1);
  };

  return (_ctx, usage, purpose) => {
    const src = usage == "singular" ? singular : plural;
    switch (purpose) {
      case "js-var-decl":
      case "js-var-ref":
      case "js-class-member-decl":
        return snakeToCamelCase(src);

      case "ts-type-decl":
      case "rust-type-decl":
        return snakeToPascalCase(src);

      case "rust-struct-member-decl":
        return src;

      case "sql-token":
        return src;

      case "sql-token-quoted":
        return `"${src}"`;
    }
  };
}
