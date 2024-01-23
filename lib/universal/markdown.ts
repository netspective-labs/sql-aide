import * as ws from "./whitespace.ts";

export function typicalMarkdownTags(options: {
  readonly toc?: {
    heading: (text: string, level: number) => string;
  };
} = {}) {
  const wrap = (wrapper: string, str: string) => `${wrapper}${str}${wrapper}`;
  const spaces = (...text: string[]) => text.join(" ");
  const times = <T>(callback: (index: number) => T, length: number) =>
    [...new Array(length)].map((_, index) => callback(index));
  const joinWith = (separator: string, stringArray: Array<string>) =>
    stringArray.join(separator);
  const lines = (stringArray: Array<string>) => stringArray.join("\n");
  const postfix = (str1: string, str2: string) => `${str2}${str1}`;
  const prefix = (str1: string, str2: string) => `${str1}${str2}`;
  const always = <T>(value: T) => () => value;
  const join = (stringArray: Array<string>) => stringArray.join("");
  const lineBreak = () => "  \n";

  const italic = (str: string) => wrap("***", str);
  const code = (language: string, str: string) =>
    `\`\`\`${language}\n${str}\n\`\`\``;

  const inlineCode = (str: string) => wrap("`", str);

  // table reference
  // | parameter | type   | description |
  // | --------- | ------ | ----------- |
  // | `x`       | number |             |
  // | `y`       | number |             |
  // | `alpha`   | number |             |

  const columnSeparator = "|";
  const headerSeparator = "-";

  const table = (header: string[], ...rows: Array<Array<string>>) => {
    //   TODO: format output
    //   const columnLengths = rows.reduce((lengths, column) => {
    //     return lengths.map(co)
    //   }, )

    const rowsWithHeader: Array<Array<string>> = [
      header,
      header.map((heading) =>
        heading
          .split("")
          .map(() => headerSeparator)
          .join("")
      ),
      ...rows,
    ];

    return rowsWithHeader
      .map((columns) => {
        return ["", ...columns, ""].join(columnSeparator);
      })
      .join("\n");
  };

  const strike = (str: string) => wrap("~~", str);

  const unordered = (stringArray: Array<string>) =>
    prefix(lineBreak(), lines(stringArray.map((str) => prefix("* ", str))));

  const bold = (str: string) => wrap("**", str);

  const heading = (level: number, str: string) => {
    // in case table of contents rewriting is required, do it now
    const rewrittenText = options?.toc?.heading(str, level);
    return spaces(join(times(always("#"), level)), rewrittenText ?? str);
  };

  const h1 = (str: string) => heading(1, str);
  const h2 = (str: string) => heading(2, str);
  const h3 = (str: string) => heading(3, str);
  const h4 = (str: string) => heading(4, str);
  const h5 = (str: string) => heading(5, str);
  const h6 = (str: string) => heading(6, str);

  const image = (alt: string) => (url: string) => `![${alt}](${url})`;

  const quote = (str: string) => prefix("> ", str);
  const link = (label: string, url: string) => `[${label}](${url})`;

  const ordered = (stringArray: Array<string>) =>
    lineBreak().concat(
      lines(stringArray.map((str, index) => prefix(`${index + 1}. `, str))),
    );

  // creates a simplified identifier suitable for use within an HTML anchor tag's `name` attribute.
  const anchorName = (str: string) => {
    const name = str.trim().toLowerCase() // Remove any leading and trailing whitespace and convert to lowercase
      .replace(/[^a-z0-9]+/g, "-") // Replace any sequence of non-alphanumeric characters with a dash
      .replace(/^-+/, ""); // Remove any leading dashes that may have been created

    // If the string starts with a number, prepend an underscore
    return name.match(/^\d/) ? "_" + name : name;
  };

  return {
    wrap,
    spaces,
    times,
    joinWith,
    lines,
    postfix,
    prefix,
    always,
    join,
    italic,
    code,
    inlineCode,
    table,
    strike,
    unordered,
    bold,
    heading,
    h1,
    h2,
    h3,
    h4,
    h5,
    h6,
    image,
    quote,
    link,
    ordered,
    anchorName,
  };
}

export class MarkdownDocument<
  Expressable,
  Tags extends ReturnType<typeof typicalMarkdownTags>,
> {
  readonly content: string[] = [];
  readonly tableOfContents: {
    readonly headings: {
      level: number;
      heading: string;
      anchorName: string;
      anchorText: string;
      tocItemText: string;
    }[];
  } = { headings: [] };

  constructor(
    readonly tags: Tags = typicalMarkdownTags({
      toc: {
        heading: (text, level) => {
          const anchorName = this.tags.anchorName(text);
          const state = {
            heading: text,
            level,
            anchorName,
            anchorText: text,
            tocItemText: `[${text}](#${anchorName})`,
          };
          this.tableOfContents.headings.push(state);
          return state.anchorText;
        },
      },
    }) as Tags,
  ) {
  }

  tocHtmlLists(): string {
    let html = "";
    let currentLevel = 0;

    this.tableOfContents.headings.forEach((heading) => {
      if (heading.level > currentLevel) {
        while (heading.level > currentLevel) {
          html += "<ol>";
          currentLevel++;
        }
      } else if (heading.level < currentLevel) {
        while (heading.level < currentLevel) {
          html += "</ol>";
          currentLevel--;
        }
      }
      html += `<li>${heading.tocItemText}</li>`;
    });

    while (currentLevel > 0) {
      html += "</ol>";
      currentLevel--;
    }

    return html;
  }

  tocMarkdownLists(numbered?: boolean) {
    const { headings } = this.tableOfContents;
    let markdown = "";
    let currentNumber = 1;

    // Find the minimum level in the headings array
    const minLevel = Math.min(...headings.map((h) => h.level));

    headings.forEach((heading) => {
      const levelDifference = heading.level - minLevel;
      const indentation = "  ".repeat(levelDifference);

      let marker: string;
      if (levelDifference === 0) {
        marker = numbered ? `${currentNumber++}.` : "-"; // Numeric for first level
      } else {
        marker = `-`; // Bullets for all other levels
      }

      markdown += `${indentation}${marker} ${heading.tocItemText}\n`;
    });

    return markdown;
  }

  markdownText(preamble?: () => string) {
    const content = this.content.join("\n");
    return preamble ? preamble() + content : content;
  }

  // create a string template literal which accepts a series of literals and
  // typed expressions (markdown text) and returns the Markdown fragment.
  fragment(literals: TemplateStringsArray, ...expressions: Expressable[]) {
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
  }

  // create a string template literal which accepts a series of literals and
  // typed expressions (markdown text) and appends it to our document.
  append(literals: TemplateStringsArray, ...expressions: Expressable[]) {
    const content = this.fragment(literals, ...expressions);
    this.content.push(content);
    return content;
  }
}
