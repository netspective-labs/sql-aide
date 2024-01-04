import * as ws from "../../lib/universal/whitespace.ts";
import * as SQLa from "../../render/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

// we want to auto-unindent our string literals and remove initial newline
export const markdown = (
  literals: TemplateStringsArray,
  ...expressions: unknown[]
) => {
  const literalSupplier = ws.whitespaceSensitiveTemplateLiteralSupplier(
    literals,
    expressions,
    {
      unindent: true,
      removeInitialNewLine: true,
    },
  );
  let interpolated = "";

  // Loop through each part of the template
  for (let i = 0; i < literals.length; i++) {
    interpolated += literalSupplier(i); // Add the string part
    if (i < expressions.length) {
      interpolated += expressions[i]; // Add the interpolated value
    }
  }
  return interpolated;
};

// deno-lint-ignore no-empty-interface
export interface Component<EmitContext extends SQLa.SqlEmitContext>
  extends SQLa.SqlTextSupplier<EmitContext> {
}

export interface Text<EmitContext extends SQLa.SqlEmitContext>
  extends Component<EmitContext> {
  readonly title: string;
  readonly content: { readonly text: string } | { readonly markdown: string };
}

export interface ListItem<
  Href extends string,
  EmitContext extends SQLa.SqlEmitContext,
> extends Component<EmitContext> {
  readonly link: Href; /* TODO: strongly type this */
  readonly title: string;
  readonly descr?: string;
}

export interface List<EmitContext extends SQLa.SqlEmitContext>
  extends Component<EmitContext> {
  readonly title?: string;
  readonly items: (ListItem<string, EmitContext>)[];
}

export function typicalComponents<
  Href extends string,
  EmitContext extends SQLa.SqlEmitContext,
>() {
  const text = (
    init: Omit<Text<EmitContext>, "SQL">,
  ): Text<EmitContext> => {
    return {
      ...init,
      SQL: () =>
        `SELECT 'text' as component, '${init.title}' as title, ${
          "text" in init.content
            ? `'${init.content.text}' as contents`
            : `'${init.content.markdown}' as contentsmd`
        }`,
    };
  };

  const list = (
    init: Omit<List<EmitContext>, "SQL">,
  ): List<EmitContext> => {
    return {
      ...init,
      // deno-fmt-ignore
      SQL: (ctx) => {
        return `SELECT 'list' as component${init.title ? `, '${init.title}' as title`: ''};\n` +
          init.items.map((i) => i.SQL(ctx)).join(";\n") + ";";
      },
    };
  };

  const listItem = (
    init: Omit<ListItem<Href, EmitContext>, "SQL">,
  ): ListItem<Href, EmitContext> => {
    return {
      ...init,
      SQL: () =>
        `SELECT '${init.title}' as title, '${init.link}' as link${
          init.descr ? `, '${init.descr}' as description` : ""
        }`,
    };
  };

  return { text, list, listItem };
}
