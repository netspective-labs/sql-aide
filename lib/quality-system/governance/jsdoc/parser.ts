import { Block, parse } from "npm:comment-parser";
import { safeMerge } from "../../../universal/merge.ts";

// Define a function that processes the comments and returns the JSON string
export async function processCommentsAndGenerateJSON(
  filePath: string,
): Promise<string> {
  let parsedComments: Block[] = [];
  let fileContent = "";

  try {
    fileContent = await Deno.readTextFile(filePath);
    fileContent = fileContent.replace(/(\w+)\s*:/g, '"$1":');
    parsedComments = parse(fileContent);
  } catch (error) {
    console.error("Error reading or parsing the file:", error);
  }

  let mergedTagString1: string = "";
  let tagStringArray: string[] = [];

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
    const dataGovernanceInput = tagStringArray.map((value, index) => {
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
