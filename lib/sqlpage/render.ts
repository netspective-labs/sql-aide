import * as c from "./component.ts";

/**
 * Union type of all possible components
 */
type SqlPageComponent =
  | c.Alert
  | c.Authentication
  | c.Breadcrumb
  | c.Button
  | c.Card
  | c.Carousel
  | c.Chart
  | c.Code
  | c.Cookie
  | c.Csv
  | c.DataGrid
  | c.Debug
  | c.Divider
  | c.Dynamic
  | c.Form
  | c.Hero
  | c.Html
  | c.HttpHeader
  | c.Json
  | c.List
  | c.Map
  | c.Redirect
  | c.Rss
  | c.Shell
  | c.Steps
  | c.Tab
  | c.Table
  | c.Text
  | c.Timeline
  | c.Title
  | c.Tracking;

export function component<Component extends SqlPageComponent>(
  c: Component,
): string | string[] {
  const functionName = `${c.component}SQL`;
  // deno-lint-ignore no-explicit-any
  const renderComponentFn = (c as any)[functionName];

  if (typeof renderComponentFn === "function") {
    const result = renderComponentFn(c);
    if (typeof result === "object" && result.SQL) {
      const candidate = result.SQL;
      if (typeof candidate === "string") {
        return candidate as string;
      } else if (typeof candidate === "function") {
        return candidate();
      } else if (Array.isArray(candidate)) {
        return candidate as string[];
      } else {
        return String(candidate);
      }
    }
    return `/* '${functionName}' returned invalid result type '${typeof result}' in ComponentRenderer.SQL() */`;
  } else {
    return `/* no '${functionName}' found for component '${c.component}' in ComponentRenderer.SQL() */`;
  }
}

/**
 * ComponentRenderer is responsible for rendering SQL statements based on the given components.
 * It dynamically calls SQL generation functions for each component type.
 */
export class ComponentsRenderer {
  private components: SqlPageComponent[] = [];

  /**
   * Adds components to the renderer.
   *
   * @param components - The components to be rendered. These components should match the interface expected by SQL generator functions.
   * @returns The instance of ComponentRenderer for method chaining.
   */
  component<C extends SqlPageComponent>(...components: C[]): this {
    this.components.push(...components);
    return this;
  }

  /**
   * Generates SQL for all added components by dynamically calling the appropriate
   * SQL generation function called `componentXyzSQL()` in the ./components.ts module.
   * If a function corresponding to a component type is not found, it returns a
   * default SQL comment indicating the missing function.
   *
   * @returns A string containing all the generated SQL statements, joined by newline characters.
   */
  SQL(): string {
    return this.components.flatMap((component) => {
      const functionName = `${component.component}SQL`;
      // deno-lint-ignore no-explicit-any
      const renderComponentFn = (c as any)[functionName];

      if (typeof renderComponentFn === "function") {
        const result = renderComponentFn(component);
        if (typeof result === "object" && result.SQL) {
          const candidate = result.SQL;
          if (typeof candidate === "string") {
            return candidate as string;
          } else if (typeof candidate === "function") {
            return candidate();
          } else if (Array.isArray(candidate)) {
            return candidate as string[];
          }
        }
        return renderComponentFn(component);
      } else {
        return {
          component,
          SQL:
            `/* no '${functionName}' found for component '${component.component}' in ComponentRenderer.SQL() */`,
        };
      }
    }).join("\n");
  }
}
