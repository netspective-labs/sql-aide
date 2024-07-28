import * as c from "./component.ts";

/**
 * ComponentRenderer is responsible for rendering SQL statements based on the given components.
 * It dynamically calls SQL generation functions for each component type.
 */
export class ComponentRenderer {
  private components: c.Component[] = [];

  /**
   * Adds components to the renderer.
   *
   * @param components - The components to be rendered. These components should match the interface expected by SQL generator functions.
   * @returns The instance of ComponentRenderer for method chaining.
   */
  component<C extends c.Component>(...components: C[]): this {
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
