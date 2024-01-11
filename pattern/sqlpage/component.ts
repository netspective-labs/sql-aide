import * as ws from "../../lib/universal/whitespace.ts";
import * as SQLa from "../../render/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

// TODO: create type-safe browsing with lists/combo-boxes using <detail> and hide/show for drill down pattern

// we want to auto-unindent our string literals and remove initial newline
export const text = (
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

export interface Component<
  EmitContext extends SQLa.SqlEmitContext,
  Name extends string = "shell" | "list" | "text" | "table" | "breadcrumb",
> extends SQLa.SqlTextSupplier<EmitContext> {
  readonly name: Name;
  readonly condition?:
    | { anyExists: string | string[] }
    | { allExist: string | string[] }
    | { where: SQLa.SqlTextSupplier<EmitContext> };
}

export type FlexibleText<EmitContext extends SQLa.SqlEmitContext> =
  | string
  | SQLa.SqlTextSupplier<EmitContext>;

export type ComponentSelectExprArg<
  EmitContext extends SQLa.SqlEmitContext,
> = [
  value: FlexibleText<EmitContext> | undefined,
  as: string,
] | undefined;

export type ComponentSelectExpr<EmitContext extends SQLa.SqlEmitContext> = [
  value: FlexibleText<EmitContext>,
  as: string,
];

export class ComponentBuilder<
  Name extends string,
  EmitContext extends SQLa.SqlEmitContext,
> {
  /**
   * Accept a flexible list of key value pairs and prepare a `SELECT` clause
   * from all arguments that are defined
   * @param ctx an EmitContext instance
   * @param args the arguments that should be inspected and emitted
   * @returns string array suitable to emit after `SELECT` keyword
   */
  selectables(
    ctx: EmitContext,
    ...args: ComponentSelectExprArg<EmitContext>[]
  ): string[] {
    // find all defined arguments (filter any `undefined`); converts a
    // ComponentSelectExprArg to ComponentSelectExpr
    const code = args.filter((c) => c && c[0]) as ComponentSelectExpr<
      EmitContext
    >[];
    return code.map((c) =>
      `${
        typeof c[0] === "string"
          ? `'${c[0].replaceAll("'", "''")}'`
          : c[0].SQL(ctx)
      } as ${c[1]}`
    );
  }

  // create a selectables args list from an object when the proper name
  // matches the `as` argument
  select<Args extends Record<string, unknown>>(
    args: Args,
    ...propNames: (keyof Args)[]
  ): ComponentSelectExpr<EmitContext>[] {
    return propNames.map((pn) => {
      const arg = args[pn];
      return [
        SQLa.isSqlTextSupplier(arg)
          ? arg
          : (arg ? String(args[pn]) : undefined),
        String(pn),
      ] as ComponentSelectExpr<EmitContext>;
    });
  }

  component(
    name: Name,
    conditional?: Component<EmitContext, Name>["condition"],
    ...args: ComponentSelectExprArg<EmitContext>[]
  ): Component<EmitContext, Name> {
    return {
      name,
      SQL: (ctx) => {
        let condSql = "";
        if (conditional) {
          if ("anyExists" in conditional) {
            condSql = `WHERE coalesce(${
              Array.isArray(conditional.anyExists)
                ? conditional.anyExists.join(", ")
                : conditional.anyExists
            }, '') <> ''`;
          } else if ("allExist" in conditional) {
            condSql = `WHERE ${
              Array.isArray(conditional.allExist)
                ? conditional.allExist.join(" and ")
                : conditional.allExist
            }`;
          } else {
            condSql = conditional.where.SQL(ctx);
          }
        }

        const select = this.selectables(ctx, ...args);
        // deno-fmt-ignore
        return `SELECT '${name}' as component${select.length ? `, ${select.join(", ")}` : ""}${condSql.length > 0 ? ` ${condSql}` : ''}`;
      },
    };
  }

  customTemplatePath(name: Name): `sqlpage/templates/${Name}.handlebars` {
    return `sqlpage/templates/${name}.handlebars`;
  }

  custom<Args extends Record<string, unknown>>(
    name: Name,
    args: Args,
    sqlBuilder: (
      topLevel: Component<EmitContext, Name>,
    ) => SQLa.SqlTextSupplier<EmitContext>,
    ...specificArgNames: (keyof Args)[]
  ): Component<EmitContext, Name> {
    // if no args are supplied, grab them all
    const argNames = specificArgNames.length > 0
      ? specificArgNames
      : Object.keys(args);
    const sql = sqlBuilder(
      args
        ? this.component(name, undefined, ...this.select(args, ...argNames))
        : this.component(name),
    );
    return {
      name,
      SQL: sql.SQL,
    };
  }

  customNoArgs(
    name: Name,
    sqlBuilder: (
      topLevel: Component<EmitContext, Name>,
    ) => SQLa.SqlTextSupplier<EmitContext>,
  ): Component<EmitContext, Name> {
    return this.custom(name, {}, sqlBuilder);
  }
}

export interface Breadcrumbs<EmitContext extends SQLa.SqlEmitContext>
  extends Component<EmitContext> {
  readonly name: "breadcrumb";
  readonly items: Iterable<{
    readonly caption: FlexibleText<EmitContext>;
    readonly href?: FlexibleText<EmitContext>;
    readonly active?: boolean;
    readonly descr?: FlexibleText<EmitContext>;
  }>;
}

export interface Shell<EmitContext extends SQLa.SqlEmitContext>
  extends Component<EmitContext> {
  readonly name: "shell";
  readonly title: string;
  readonly icon?: string;
  readonly link?: string;
  readonly menuItems?: Iterable<{ caption: string }>;
}

export interface TextFragment<EmitContext extends SQLa.SqlEmitContext>
  extends SQLa.SqlTextSupplier<EmitContext> {
  readonly contents: string;
  readonly bold?: boolean;
  readonly break?: boolean;
  readonly code?: boolean;
  readonly color?: string;
  readonly italics?: boolean;
  readonly link?: string;
  readonly size?: number;
  readonly underline?: boolean;
}

export interface Text<EmitContext extends SQLa.SqlEmitContext>
  extends Component<EmitContext> {
  readonly name: "text";
  readonly title: FlexibleText<EmitContext>;
  readonly content?:
    | { readonly text: FlexibleText<EmitContext> }
    | { readonly markdown: FlexibleText<EmitContext> }
    | { readonly html: FlexibleText<EmitContext> };
  readonly center?: boolean;
  readonly width?: number;
  readonly fragments?: Iterable<TextFragment<EmitContext>>;
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
    readonly icon?: string;
    readonly markdown?: boolean;
  }>;
  readonly rows: Iterable<TableRow<EmitContext>>;
}

export type CustomTemplatePath<Name extends string> =
  `sqlpage/templates/${Name}.handlebars`;

// Handlebars code is not really SQL but we use the SQLa SQL emit infrastructure
// in SQLPageNotebook instances so it's convenient to assume it's SqlTextSupplier
export type HandlebarsCode<EmitContext extends SQLa.SqlEmitContext> =
  SQLa.SqlTextSupplier<EmitContext>;

export interface CustomTemplateSupplier<
  EmitContext extends SQLa.SqlEmitContext,
  Name extends string,
  TopLevelArgs extends Record<string, FlexibleText<EmitContext>>,
  Row extends Record<string, FlexibleText<EmitContext>>,
> {
  readonly templatePath: CustomTemplatePath<string>;
  readonly handlebarsCode: () => HandlebarsCode<EmitContext>;
  readonly component: (
    tla?: TopLevelArgs,
    ...rows: Row[]
  ) => Component<EmitContext, Name> & TopLevelArgs;
}

/**
 * Prepare an object proxy which takes each property of an object an returns a
 * string named exactly the same as the key name. This is useful for type-safety
 * in string template literals.
 * @returns a read-only object proxy which takes the name of any key and returns the same key
 */
export function safePropNames<Shape extends Record<string, unknown>>() {
  type ShapeKeyNames = {
    readonly [PropName in keyof Shape]: `${string & PropName}`;
  };
  return new Proxy<ShapeKeyNames>({} as ShapeKeyNames, {
    get: (_, p) => String(p),
  });
}

/**
 * Prepare an object proxy which takes each property of an object an returns
 * name of that field as a type-safe handlebars variable like {{key}}.
 * @returns a read-only object proxy which takes the name of any key and returns the same key as {{key}}
 */
export function safeHandlebars<
  Shape extends Record<string, unknown>,
>() {
  type HandlebarsVars = {
    readonly [PropName in keyof Shape]: `{{${string & PropName}}}`;
  };
  return new Proxy<HandlebarsVars>({} as HandlebarsVars, {
    get: (_, p) => `{{${String(p)}}}`,
  });
}

/**
 * Prepare an object proxy which takes each property of an object an returns
 * name of that field as a type-safe SQLPage URL Query param like $key.
 * @returns a read-only object proxy which takes the name of any key and returns the same key as $key
 */
export function safeUrlQueryParams<
  Shape extends Record<string, unknown>,
>() {
  type HandlebarsVars = {
    readonly [PropName in keyof Shape]: `$${string & PropName}`;
  };
  return new Proxy<HandlebarsVars>({} as HandlebarsVars, {
    get: (_, p) => `$${String(p)}`,
  });
}

export function typicalComponents<
  Href extends string,
  EmitContext extends SQLa.SqlEmitContext,
>() {
  const builder = new ComponentBuilder<
    Component<EmitContext>["name"],
    EmitContext
  >();

  const breadcrumbs = (
    init: Omit<Breadcrumbs<EmitContext>, "name" | "SQL">,
  ): Breadcrumbs<EmitContext> => {
    return {
      name: "breadcrumb",
      ...init,
      SQL: (ctx) => {
        const topLevel = builder.component("breadcrumb");
        // deno-fmt-ignore
        return `${topLevel.SQL(ctx)};\n` +
          Array.from(init.items).map((i) =>
            `SELECT ${builder.selectables(
                ctx,
                [i.caption, "title"],
                [i.href, "link"],
                i.active ? ["true", "active"] : undefined,
                [i.descr, "description"],
              )}`
          ).join(";\n");
      },
    };
  };

  const shell = (
    init: Omit<Shell<EmitContext>, "name" | "SQL">,
  ): Shell<EmitContext> => {
    return {
      ...init,
      ...builder.component(
        "shell",
        init.condition,
        ...builder.select(init, "title", "icon", "link"),
        ...(init.menuItems
          ? Array.from(init.menuItems).map((mi) =>
            [mi.caption, "menu_item"] as ComponentSelectExpr<EmitContext>
          )
          : []),
      ),
      name: "shell",
    };
  };

  const text = (
    init: Omit<Text<EmitContext>, "name" | "SQL">,
  ): Text<EmitContext> => {
    const { content } = init;
    const topLevel = builder.component(
      "text",
      init.condition,
      ...builder.select(init, "title", "width", "center"),
      content && "text" in content ? [content.text, "contents"] : undefined,
      content && "markdown" in content
        ? [content.markdown, "contents_md"]
        : undefined,
      content && "html" in content ? [content.html, "html"] : undefined,
    );
    return init.fragments
      ? {
        name: "text",
        ...init,
        SQL: (ctx) => {
          return `${topLevel.SQL(ctx)};\n` +
            Array.from(init.fragments!).map((i) => i.SQL(ctx)).join(";\n");
        },
      }
      : {
        ...init,
        ...topLevel,
        name: "text",
      };
  };

  const listItem = (
    init: Omit<ListItem<Href, EmitContext>, "SQL">,
  ): ListItem<Href, EmitContext> => {
    return {
      ...init,
      // deno-fmt-ignore
      SQL: (ctx) =>
        `SELECT ${builder.selectables(ctx,
            ...builder.select(init, "title", "link"),
            [init.descr, "description"],
          )}`,
    };
  };

  const list = (
    init: Omit<List<EmitContext>, "name" | "SQL">,
  ): List<EmitContext> => {
    const topLevel = builder.component(
      "list",
      init.condition,
      ...builder.select(init, "title"),
    );
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
    const topLevel = builder.select(init, "search", "sort");
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
        // deno-fmt-ignore
        return `${builder.component("table", init.condition, ...topLevel).SQL(ctx)};\n` +
          Array.from(init.rows).map((i) => i.SQL(ctx)).join(";\n");
      },
    };
  };

  return {
    builder,
    breadcrumbs,
    shell,
    text,
    list,
    listItem,
    table,
  };
}
