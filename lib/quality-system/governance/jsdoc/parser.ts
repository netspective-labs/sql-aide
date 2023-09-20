import { parse } from "npm:comment-parser";
import { safeMerge } from "../../../universal/merge.ts";

// Define a function that processes the comments and returns the JSON string
export function sourceComments(
  content: string,
) {
  content = content.replace(/(\w+)\s*:/g, '"$1":');
  const parsedComments = parse(content);

  let mergedTagString1 = "";
  const tagStringArray: string[] = [];

  for (const obj of parsedComments) {
    let governanceData = {};
    let lineageData = {};
    let traceabilityData = {};
    let codeReviewData = {};

    for (const tag of obj.tags) {
      if (tag.tag === "governance") {
        governanceData = "{" + tag.type + "}";
      } else if (
        tag.tag === "lineage" || tag.tag === "lineage-hl7-edi" ||
        tag.tag === "lineage-xml"
      ) {
        lineageData = "{" + tag.type + "}";
      } else if (tag.tag === "traceability") {
        traceabilityData = "{" + tag.type + "}";
      } else if (tag.tag === "codeReview") {
        codeReviewData = "{" + tag.type + "}";
      }
    }

    const mergedData = safeMerge(
      { governance: governanceData },
      { lineage: lineageData },
      { codeReview: codeReviewData },
      { traceability: traceabilityData },
    );

    const mergedGovernanceTag = {
      lineage: mergedData.lineage || {},
      traceability: mergedData.traceability || {},
      codeReview: mergedData.codeReview || {},
    };

    const mergedTagString = `/** @governance ${
      JSON.stringify(mergedGovernanceTag)
        .replace(/\n/g, "")
        .replace(/\\"/g, '"')
        .replace(/"\{/g, "{")
        .replace(/\}"/g, "}")
        .replace(/\\"/g, '"')
    } */`;

    const tagString = `${
      JSON.stringify(mergedGovernanceTag)
        .replace(/\n/g, "")
        .replace(/\\"/g, '"')
        .replace(/"\{/g, "{")
        .replace(/\}"/g, "}")
        .replace(/\\"/g, '"')
    }`;

    tagStringArray.push(tagString);
    mergedTagString1 += `${mergedTagString}\n\n`;
  }

  // Function to process tagStringArray and generate dataGovernanceInput as JSON
  function generateDataGovernanceInputJSON(
    tagStringArray: string[],
  ): string {
    const dataGovernanceInput = tagStringArray.map((value) => {
      const parsedValue = JSON.parse(value);
      return parsedValue; // Remove the "parsedValue" key
    });

    return JSON.stringify(dataGovernanceInput);
  }

  // Generate dataGovernanceInput and convert it to JSON
  const dataGovernanceInputJson = generateDataGovernanceInputJSON(
    tagStringArray,
  );

  return dataGovernanceInputJson;
}
