import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";
import { TabularJson } from "../../lib/tabular-json/mod.ts";

// Define the FHIR Patient resource shape using Zod
const fhirPatientResourceShape = z.object({
  id: z.string(),
  identifier: z.array(z.object({
    use: z.string().optional(),
    type: z.object({
      coding: z.array(z.object({
        system: z.string().optional(),
        code: z.string().optional(),
        display: z.string().optional(),
      })).optional(),
      text: z.string().optional(),
    }).optional(),
    system: z.string().optional(),
    value: z.string().optional(),
  })),
  name: z.array(z.object({
    use: z.string().optional(),
    family: z.string().optional(),
    given: z.array(z.string()).optional(),
    prefix: z.array(z.string()).optional(),
    suffix: z.array(z.string()).optional(),
  })),
  gender: z.enum(["male", "female", "other", "unknown"]).optional(),
  birthDate: z.string().optional(),
  address: z.array(z.object({
    use: z.string().optional(),
    type: z.string().optional(),
    text: z.string().optional(),
    line: z.array(z.string()).optional(),
    city: z.string().optional(),
    district: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  })),
  contact: z.array(z.object({
    relationship: z.array(z.object({
      coding: z.array(z.object({
        system: z.string().optional(),
        code: z.string().optional(),
        display: z.string().optional(),
      })).optional(),
      text: z.string().optional(),
    })).optional(),
    name: z.object({
      family: z.string().optional(),
      given: z.array(z.string()).optional(),
    }).optional(),
    telecom: z.array(z.object({
      system: z.string().optional(),
      value: z.string().optional(),
      use: z.string().optional(),
    })).optional(),
    address: z.object({
      use: z.string().optional(),
      type: z.string().optional(),
      text: z.string().optional(),
      line: z.array(z.string()).optional(),
      city: z.string().optional(),
      district: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional(),
    }).optional(),
    gender: z.enum(["male", "female", "other", "unknown"]).optional(),
    organization: z.object({
      reference: z.string().optional(),
      display: z.string().optional(),
    }).optional(),
  })).optional(),
});

// Create an instance of TabularJson with the FHIR Patient resource shape
const tabularJson = new TabularJson(fhirPatientResourceShape);

// Flattening the JSON data into a tabular format
const flattenJs = tabularJson.tabularJs({ flattenArrays: true });
const flatData = flattenJs({
  id: "patient-123",
  identifier: [{
    use: "official",
    system: "http://hospital.org/mrn",
    value: "12345",
  }],
  name: [{
    family: "Doe",
    given: ["John"],
  }],
  gender: "male",
  birthDate: "1974-12-25",
  address: [{
    use: "home",
    line: ["123 Main St"],
    city: "Anytown",
    postalCode: "12345",
    country: "USA",
  }],
  contact: [{
    relationship: [{
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/v2-0131",
        code: "N",
        display: "Next of Kin",
      }],
      text: "Next of Kin",
    }],
    name: {
      family: "Smith",
      given: ["Jane"],
    },
    telecom: [{
      system: "phone",
      value: "555-1234",
      use: "home",
    }],
    address: {
      line: ["456 Another St"],
      city: "Somewhere",
      postalCode: "67890",
      country: "USA",
    },
    gender: "female",
  }],
});

console.log(flatData);

// Generating SQL view creation and deletion statements
const { createDDL, dropDDL } = tabularJson.tabularSqlView(
  "fhir_patient_view",
  "SELECT * FROM fhir_patients",
  "data",
  false,
);

console.log(dropDDL());
console.log(createDDL());
