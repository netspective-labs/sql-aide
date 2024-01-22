import { testingAsserts as ta } from "../../deps-test.ts";
import * as mod from "./markdown.ts";

const golden1 = `# Markdown test

This is a test document which should prepare **some bold text** and ***some italic text***.

## Second level heading

This is a test section which should prepare code block:

\`\`\`sql
select x from y
\`\`\`

### Third level heading

This is a test section which should prepare a table:

|h-column1|h-column2|
|---------|---------|
|r1-column1|r1-column2|`;

Deno.test("Generated Markdown", () => {
  const md = new mod.MarkdownDocument();
  const { tags: t, tags: { bold, italic, h1, h2, h3 } } = md;

  // deno-fmt-ignore
  md.append`
    ${h1("Markdown test")}

    This is a test document which should prepare ${bold("some bold text")} and ${italic(`some italic text`)}.

    ${h2('Second level heading')}

    This is a test section which should prepare code block:

    ${t.code('sql', 'select x from y')}

    ${h3('Third level heading')}

    This is a test section which should prepare a table:

    ${t.table(["h-column1", "h-column2"], ["r1-column1", "r1-column2"])}`;

  ta.assertEquals(md.markdownText(), golden1);
  ta.assertEquals(md.tableOfContents, {
    headings: [
      {
        level: 1,
        heading: "Markdown test",
        anchorName: "markdown-test",
        anchorText: `<a name="markdown-test">Markdown test</a>`,
        tocItemText: `[Markdown test](#markdown-test)`,
      },
      {
        level: 2,
        heading: "Second level heading",
        anchorName: "second-level-heading",
        anchorText: `<a name="second-level-heading">Second level heading</a>`,
        tocItemText: `[Second level heading](#second-level-heading)`,
      },
      {
        level: 3,
        heading: "Third level heading",
        anchorName: "third-level-heading",
        anchorText: `<a name="third-level-heading">Third level heading</a>`,
        tocItemText: `[Third level heading](#third-level-heading)`,
      },
    ],
  });
});
