import * as p from "./protocol.ts";

export interface TapContentHtmlOptions<
  Describable extends string,
  Diagnosable extends p.Diagnostics,
> {
  readonly preamble?: (tc: p.TapContent<Describable, Diagnosable>) => string;
  readonly title: (tc: p.TapContent<Describable, Diagnosable>) => string;
  readonly css: (tc: p.TapContent<Describable, Diagnosable>) => string;
  readonly diagnosticsHtml: (
    diagnostics: p.Diagnostics,
    tc: p.TapContent<Describable, Diagnosable>,
  ) => string;
}

export function tapContentDefaultHtmlOptions<
  Describable extends string,
  Diagnosable extends p.Diagnostics,
>(
  init?: Partial<TapContentHtmlOptions<Describable, Diagnosable>>,
): TapContentHtmlOptions<Describable, Diagnosable> {
  const title = () => `TAP Test Results`;

  const css = (): string => `
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f0f0f0; color: #333; }
    details { margin-bottom: 5px; border-left: 3px solid #ccc; padding-left: 15px; }
    details > summary { cursor: pointer; font-weight: bold; margin-bottom: 5px; }
    details > summary > strong { color: #0056b3; }
    .test-case { padding: 10px 0; }
    .ok { color: #28a745; }
    .not-ok { color: #dc3545; }
    table { border-collapse: collapse; background-color: white; margin-top: 10px; }
    th, td { border: 1px solid #ddd; padding: 4px; text-align: left; }
    th { background-color: #f2f2f2; }
    footer { margin-top: 20px; color: #777; }
    .comment { font-style: italic; color: #6c757d; }
  `;

  const diagnosticsHtml = (diagnostics: p.Diagnostics): string => {
    let tableHtml = "<table>";
    for (const [key, value] of Object.entries(diagnostics)) {
      tableHtml += `<tr><td>${key}</td><td>${
        typeof value === "object" ? JSON.stringify(value, null, 2) : value
      }</td></tr>`;
    }
    tableHtml += "</table>";
    return tableHtml;
  };

  return { title, css, diagnosticsHtml, ...init };
}

export function tapContentHTML<
  Describable extends string,
  Diagnosable extends p.Diagnostics,
>(
  tc: p.TapContent<Describable, Diagnosable>,
  options = tapContentDefaultHtmlOptions(),
) {
  const { title, css, diagnosticsHtml } = options;

  // Setup HTML document with dynamic CSS
  let html =
    `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${
      title(tc)
    }</title><style>${css}</style></head><body>`;

  // Recursive function to process test elements, including nested subtests
  html += processTestElements(tc.body);

  // Footers
  for (const footer of tc.footers) {
    html += `<footer>${footer.content}</footer>`;
  }

  // Close HTML document
  html += "</body></html>";
  return html;

  // Inner function for processing test elements, including subtests
  function processTestElements(
    body: Iterable<p.TestSuiteElement<string, p.Diagnostics>>,
    level = 0,
  ): string {
    let contentHtml = "";
    for (const element of body) {
      if (element.nature === "test-case") {
        const test = element as p.TestCase<string, p.Diagnostics>;
        const statusEmoji = test.ok
          ? '<span class="ok">✅</span>'
          : '<span class="not-ok">❌</span>';
        contentHtml +=
          `<details><summary>${statusEmoji} <strong>${test.description}</strong></summary><div class="test-case">`;

        if (test.directive) {
          contentHtml +=
            `<p><em>[${test.directive.nature}: ${test.directive.reason}]</em></p>`;
        }

        if (test.diagnostics) {
          contentHtml += `<div>${diagnosticsHtml(test.diagnostics, tc)}</div>`;
        }

        if (p.isParentTestCase(test)) {
          if (test.subtests) {
            contentHtml += processTestElements(test.subtests.body, level + 1);
          }
        }

        contentHtml += `</div></details>`;
      } else if (element.nature === "comment") {
        const comment = element as p.CommentNode;
        contentHtml += `<div class="comment">Comment: ${comment.content}</div>`;
      }
    }
    return contentHtml;
  }
}

export interface TapContentMarkdownOptions<
  Describable extends string,
  Diagnosable extends p.Diagnostics,
> {
  readonly preamble?: (tc: p.TapContent<Describable, Diagnosable>) => string;
  readonly diagnosticsMarkdown: (diagnostics: p.Diagnostics) => string;
}

export function tapContentDefaultMarkdownOptions<
  Describable extends string,
  Diagnosable extends p.Diagnostics,
>(
  init?: Partial<TapContentMarkdownOptions<Describable, Diagnosable>>,
): TapContentMarkdownOptions<Describable, Diagnosable> {
  const diagnosticsMarkdown = (
    diagnostics: p.Diagnostics,
  ) => {
    return Object.entries(diagnostics)
      .map(([key, value]) =>
        `- ${key}: ${
          typeof value === "object" ? JSON.stringify(value, null, 2) : value
        }`
      )
      .join("\n");
  };

  return { diagnosticsMarkdown, ...init };
}

export function tapContentMarkdown<
  Describable extends string,
  Diagnosable extends p.Diagnostics,
>(
  tapContent: p.TapContent<Describable, Diagnosable>,
  options = tapContentDefaultMarkdownOptions<Describable, Diagnosable>(),
) {
  const { preamble, diagnosticsMarkdown } = options;

  let markdown = preamble?.(tapContent) ?? "";

  // Process tests and comments
  markdown += processTestElements(tapContent.body);

  // Footers
  for (const footer of tapContent.footers) {
    markdown += `---\n${footer.content}\n`;
  }

  return markdown;

  function processTestElements(
    body: Iterable<p.TestSuiteElement<string, p.Diagnostics>>,
    indent = "",
  ) {
    let contentMarkdown = "";
    for (const element of body) {
      if (element.nature === "test-case") {
        const test = element as p.TestCase<string, p.Diagnostics>;
        const status = test.ok ? "✅" : "❌";
        contentMarkdown += `${indent}- ${status} ${test.description}\n`;

        if (test.directive) {
          contentMarkdown +=
            `${indent}  - [${test.directive.nature}] ${test.directive.reason}\n`;
        }

        if (test.diagnostics) {
          contentMarkdown += `${indent}  - Diagnostics:\n${indent}${
            diagnosticsMarkdown(test.diagnostics).split("\n").map((line) =>
              `    ${line}`
            ).join("\n")
          }\n`;
        }

        if (p.isParentTestCase(test)) {
          if (test.subtests) {
            contentMarkdown += `${indent}  - Subtests:\n${
              processTestElements(test.subtests.body, indent + "    ")
            }\n`;
          }
        }
      } else if (element.nature === "comment") {
        const comment = element as p.CommentNode;
        contentMarkdown += `${indent}<!-- ${comment.content} -->\n`;
      }
    }
    return contentMarkdown;
  }
}

export function tapFormat<Canonical extends string, Aliases extends string>(
  identity: Canonical,
  emit: (tc: p.TapContent<string, p.Diagnostics>) => string,
  ...aliases: Aliases[]
) {
  return { identity, aliases, emit };
}

export const tapFormats = [
  tapFormat("canonical", (tc) => p.stringify(tc), "--text", "--tap", ".tap"),
  tapFormat("html", (tc) => tapContentHTML(tc), "--html", "HTML", ".html"),
  tapFormat(
    "markdown",
    (tc) => tapContentMarkdown(tc),
    "--md",
    "--markdown",
    ".md",
  ),
  tapFormat(
    "json",
    (tc) => JSON.stringify(tc, null, "  "),
    "--json",
    "--JSON",
    "JSON",
    ".json",
  ),
];

export type TapFormatCanonical = (typeof tapFormats)[number]["identity"];
export type TapFormat =
  | TapFormatCanonical
  | (typeof tapFormats)[number]["aliases"][number];

export function emittableTapContent<
  Describable extends string,
  Diagnosable extends p.Diagnostics,
>(
  tc: p.TapContent<Describable, Diagnosable>,
  format?: TapFormat | undefined,
  options?: {
    readonly defaultFmt?: ReturnType<typeof tapFormat>["emit"];
    readonly onUnknownFormat?: (
      format: TapFormat,
      tc: p.TapContent<Describable, Diagnosable>,
    ) => string | undefined;
  },
) {
  const {
    defaultFmt =
      ((tc: p.TapContent<Describable, Diagnosable>) => p.stringify(tc)),
    onUnknownFormat = ((format: TapFormat) => `Unknown format '${format}'.`),
  } = options ??
    {};
  if (!format) return defaultFmt(tc);

  for (const f of tapFormats) {
    if (f.identity == format || f.aliases.find((a) => a == format)) {
      return f.emit(tc);
    }
  }
  return onUnknownFormat(format, tc);
}
