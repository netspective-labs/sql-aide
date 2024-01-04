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

// see https://sql.ophir.dev/documentation.sql?component=debug#component

export interface Component<EmitContext extends SQLa.SqlEmitContext>
  extends SQLa.SqlTextSupplier<EmitContext> {
  readonly name: "shell" | "list" | "text" | "table";
}

export interface Shell<EmitContext extends SQLa.SqlEmitContext>
  extends Component<EmitContext> {
  readonly name: "shell";
  readonly title: string;
  readonly icon?: string;
  readonly link?: string;
  readonly menuItems?: Iterable<{ caption: string }>;
}

export interface Text<EmitContext extends SQLa.SqlEmitContext>
  extends Component<EmitContext> {
  readonly name: "text";
  readonly title: string;
  readonly content: { readonly text: string } | { readonly markdown: string };
}

export interface ListItem<
  Href extends string,
  EmitContext extends SQLa.SqlEmitContext,
> extends SQLa.SqlTextSupplier<EmitContext> {
  readonly link: Href; /* TODO: strongly type this */
  readonly title: string;
  readonly descr?: string;
}

export interface List<EmitContext extends SQLa.SqlEmitContext>
  extends Component<EmitContext> {
  readonly name: "list";
  readonly title?: string;
  readonly items: Iterable<ListItem<string, EmitContext>>;
}

export interface TableRow<EmitContext extends SQLa.SqlEmitContext>
  extends SQLa.SqlTextSupplier<EmitContext> {
  readonly color?: string;
  readonly cssClass?: string;
}

export interface Table<
  ColumName extends string,
  EmitContext extends SQLa.SqlEmitContext,
> extends Component<EmitContext> {
  readonly name: "table";
  readonly search?: boolean;
  readonly sort?: boolean;
  readonly columns?: Record<ColumName, {
    readonly alignRight?: boolean;
    readonly icon: string;
    readonly markdown: string;
  }>;
  readonly rows: Iterable<TableRow<EmitContext>>;
}

export function typicalComponents<
  Href extends string,
  EmitContext extends SQLa.SqlEmitContext,
>() {
  type CompCode = [value: string | undefined, as: string];
  const selectables = (...args: (CompCode | undefined)[]): string[] => {
    const code = args.filter((c) => c && c[0]) as [value: string, as: string][];
    return code.map((c) => `'${c[0].replaceAll("'", "''")}' as ${c[1]}`);
  };

  // create a selectables args list from an object when the proper name
  // matches the `as` argument
  const select = <Args extends Record<string, unknown>>(
    args: Args,
    ...propNames: (keyof Args)[]
  ): CompCode[] => {
    return propNames.map((
      pn,
    ) => [args[pn] ? String(args[pn]) : undefined, String(pn)]);
  };

  const component = <Name extends Component<EmitContext>["name"]>(
    name: Name,
    ...args: (CompCode | undefined)[]
  ): Component<EmitContext> => {
    const select = selectables(...args);
    return {
      name,
      // deno-fmt-ignore
      SQL: () => `SELECT '${name}' as component${select.length ? `, ${select.join(", ")}` : ''}`,
    };
  };

  const shell = (
    init: Omit<Shell<EmitContext>, "name" | "SQL">,
  ): Shell<EmitContext> => {
    return {
      ...init,
      ...component(
        "shell",
        ...select(init, "title", "icon", "link"),
        ...(init.menuItems
          ? Array.from(init.menuItems).map((mi) =>
            [mi.caption, "menu_item"] as CompCode
          )
          : []),
      ),
      name: "shell",
    };
  };

  const text = (
    init: Omit<Text<EmitContext>, "name" | "SQL">,
  ): Text<EmitContext> => {
    return {
      ...init,
      ...component(
        "text",
        ...select(init, "title"),
        "text" in init.content ? [init.content.text, "contents"] : undefined,
        "markdown" in init.content
          ? [init.content.markdown, "contentsmd"]
          : undefined,
      ),
      name: "text",
    };
  };

  const listItem = (
    init: Omit<ListItem<Href, EmitContext>, "SQL">,
  ): ListItem<Href, EmitContext> => {
    return {
      ...init,
      // deno-fmt-ignore
      SQL: () =>
        `SELECT ${selectables(
            ...select(init, "title", "link"),
            [init.descr, "description"],
          )}`,
    };
  };

  const list = (
    init: Omit<List<EmitContext>, "name" | "SQL">,
  ): List<EmitContext> => {
    const topLevel = component("list", ...select(init, "title"));
    return {
      name: "list",
      ...init,
      SQL: (ctx) => {
        return `${topLevel.SQL(ctx)};\n` +
          Array.from(init.items).map((i) => i.SQL(ctx)).join(";\n");
      },
    };
  };

  const table = <ColumnName extends string>(
    init: Omit<Table<ColumnName, EmitContext>, "name" | "SQL">,
  ): Table<ColumnName, EmitContext> => {
    const topLevel = select(init, "search", "sort");
    if (init.columns) {
      for (const [columnName, v] of Object.entries(init.columns)) {
        const args = v as typeof init.columns[ColumnName];
        if (args.icon) topLevel.push([columnName, "icon"]);
        if (args.markdown) topLevel.push([columnName, "markdown"]);
        if (args.alignRight) topLevel.push([columnName, "align_right"]);
      }
    }
    return {
      name: "table",
      ...init,
      SQL: (ctx) => {
        return `${component("table", ...topLevel).SQL(ctx)};\n` +
          Array.from(init.rows).map((i) => i.SQL(ctx)).join(";\n");
      },
    };
  };

  return { selectables, select, component, shell, text, list, listItem, table };
}
