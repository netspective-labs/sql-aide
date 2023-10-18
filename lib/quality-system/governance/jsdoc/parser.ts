import { parse as commentParser } from "npm:comment-parser";
import { path, zod as z } from "../../../../deps.ts";
import { Any } from "https://deno.land/std@0.198.0/yaml/_utils.ts";

const lineageSchema = z.object({
  input: z.object({
    source: z.string(),
    columns: z.array(z.string()),
  }),
  transformations: z.object({
    type: z.string(),
    description: z.string(),
  }).optional(),
  output: z.object({
    target: z.string(),
    columns: z.array(z.string()),
  }).optional(),
});

const traceabilitySchema = z.object({
  jiraIssue: z.string().optional(),
});
const returnsSchema = z.object({
  full_name: z.string().optional(),
});
const paramSchema = z.object({
  employee_id: z.string().optional(),
});
const codeReviewSchema = z.object({
  isReviewed: z.boolean().optional(),
});
const schemaSchema = z.object({
  table: z.string().optional(),
  description: z.string().optional(),
  columns: z.record(z.string()).optional(),
});
const governanceSchema = z.object({
  dataSteward: z.string().optional(),
  dataOwner: z.string().optional(),
  classification: z.string().optional(),
  lineage: lineageSchema.optional(),
  traceability: traceabilitySchema.optional(),
});
const parsedCommentSchema = z.object({
  governance: governanceSchema.optional(),
  lineage: lineageSchema.optional(),
  traceability: traceabilitySchema.optional(),
  function: z.string().optional(),
  arguments: z.record(z.string()).optional(),
  returns: returnsSchema.optional(), //z.string().optional(),
  param: paramSchema.optional(),
  codeReview: codeReviewSchema.optional(),
  schema: schemaSchema.optional(),
});

type TagData = z.infer<typeof parsedCommentSchema>;

export function unsafeSourceComments(content: string): TagData[] {
  content = content.replace(/(\w+)\s*:/g, '"$1":');
  const parsedComments = commentParser(content);
  const tagDataResult: TagData[] = [];

  for (const obj of parsedComments) {
    const tagData: Partial<TagData> = {
      governance: { lineage: { input: { columns: [], source: "" } } },
      lineage: { input: { source: "", columns: [] } },
      codeReview: {},
      traceability: {},
      schema: {},
      param: {},
      returns: {},
    };

    for (const tag of obj.tags) {
      const tagKey = tag.tag.toLowerCase();
      (tagData as Any)[tagKey] = JSON.parse(`{${tag.type}}`);
    }
    tagDataResult.push(tagData);
  }
  return tagDataResult;
}

export function validatedSourceComments(content: string): TagData[] {
  const vsc = unsafeSourceComments(content);
  const tagDataResult: TagData[] = [];

  for (const block of vsc) {
    const result = parsedCommentSchema.safeParse(block);

    if (result.success) {
      tagDataResult.push(result.data);
    } else {
      console.error("Validation errors:", result.error);
    }
  }
  return tagDataResult;
}

export function governedSourceComments(content: string): TagData[] {
  const vsc = validatedSourceComments(content);
  const tagDataResult: TagData[] = [];

  for (const block of vsc) {
    // Merge the lineage information into the governance object
    if (block.governance && block.lineage) {
      block.governance.lineage = block.lineage;
      delete block.lineage;
    }
    tagDataResult.push(block);
  }
  return tagDataResult;
}
