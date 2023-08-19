import { assertEquals } from "./deps-test.ts";
import * as memFS from "../fs/memory-fs.ts";
import * as mod from "./tabular-fs.ts";

const csvFixture01 =
  `"First Name","Last Name",Age,"Email Address",City,"Favorite Quote",Salary,Date Joined,Is Active,Website
John,Doe,25,johndoe@example.com,New York,"Life is what happens when you're busy making other plans.",55000,2023-01-15,True,www.johndoe.com
Jane,Smith,30,janesmith@example.com,Los Angeles,"To be or not to be, that is the question.",60000,2022-05-10,False,www.janesmith.net
Henry,Adams,34,henrya@example.com,San Jose,"The best way to predict the future is to create it.",65000,2019-02-20,True,www.henryadams.org`;

const csvFile01 = new memFS.StringFile(
  { canonicalPath: "csvFixture01-inMemString.csv" },
  csvFixture01,
);

const csvArray01 = [
  [
    "First Name",
    "Last Name",
    "Age",
    "Email Address",
    "City",
    "Favorite Quote",
    "Salary",
    "Date Joined",
    "Is Active",
    "Website",
  ],
  [
    "John",
    "Doe",
    "25",
    "johndoe@example.com",
    "New York",
    "Life is what happens when you're busy making other plans.",
    "55000",
    "2023-01-15",
    "True",
    "www.johndoe.com",
  ],
  [
    "Jane",
    "Smith",
    "30",
    "janesmith@example.com",
    "Los Angeles",
    "To be or not to be, that is the question.",
    "60000",
    "2022-05-10",
    "False",
    "www.janesmith.net",
  ],
  [
    "Henry",
    "Adams",
    "34",
    "henrya@example.com",
    "San Jose",
    "The best way to predict the future is to create it.",
    "65000",
    "2019-02-20",
    "True",
    "www.henryadams.org",
  ],
];

const csvUntyped01 = [
  {
    "First Name": "John",
    "Last Name": "Doe",
    Age: "25",
    "Email Address": "johndoe@example.com",
    City: "New York",
    "Favorite Quote":
      "Life is what happens when you're busy making other plans.",
    Salary: "55000",
    "Date Joined": "2023-01-15",
    "Is Active": "True",
    Website: "www.johndoe.com",
  },
  {
    "First Name": "Jane",
    "Last Name": "Smith",
    Age: "30",
    "Email Address": "janesmith@example.com",
    City: "Los Angeles",
    "Favorite Quote": "To be or not to be, that is the question.",
    Salary: "60000",
    "Date Joined": "2022-05-10",
    "Is Active": "False",
    Website: "www.janesmith.net",
  },
  {
    "First Name": "Henry",
    "Last Name": "Adams",
    Age: "34",
    "Email Address": "henrya@example.com",
    City: "San Jose",
    "Favorite Quote": "The best way to predict the future is to create it.",
    Salary: "65000",
    "Date Joined": "2019-02-20",
    "Is Active": "True",
    Website: "www.henryadams.org",
  },
];

Deno.test("TabularFileUntyped (arrays)", async (tc) => {
  const tfr = mod.tabularFileRaw(csvFile01);

  await tc.step("readable", async () => {
    const encountered: string[][] = [];
    for await (const row of (await tfr.readable()).values()) {
      encountered.push(row);
    }
    assertEquals(encountered, csvArray01);
  });

  await tc.step("readableSync", async () => {
    const encountered: string[][] = [];
    for await (const row of tfr.readableSync().values()) {
      encountered.push(row);
    }
    assertEquals(encountered, csvArray01);
  });
});

Deno.test("TabularFileUntyped (objects)", async (tc) => {
  const tfu = mod.tabularFileUntyped(csvFile01);

  await tc.step("readable", async () => {
    const encountered: (string[] | Record<string, string | unknown>)[] = [];
    for await (const row of (await tfu.readable()).values()) {
      encountered.push(row);
    }
    assertEquals(encountered, csvUntyped01);
  });

  await tc.step("readableSync", async () => {
    const encountered: (string[] | Record<string, string | unknown>)[] = [];
    for await (const row of tfu.readableSync().values()) {
      encountered.push(row);
    }
    assertEquals(encountered, csvUntyped01);
  });
});

type RowFixture01 = {
  "First Name": string;
  "Last Name": string;
  Age: number;
  "Email Address": string;
  City: string;
  "Favorite Quote": string;
  Salary: number;
  "Date Joined": number; // Since we're using Date.parse, the date is represented as a number (milliseconds since epoch)
  "Is Active": boolean;
  Website: string;
};

const jsonFixture01: RowFixture01[] = [
  {
    "First Name": "John",
    "Last Name": "Doe",
    Age: 25,
    "Email Address": "johndoe@example.com",
    City: "New York",
    "Favorite Quote":
      "Life is what happens when you're busy making other plans.",
    Salary: 55000,
    "Date Joined": Date.parse("2023-01-15"),
    "Is Active": true,
    Website: "www.johndoe.com",
  },
  {
    "First Name": "Jane",
    "Last Name": "Smith",
    Age: 30,
    "Email Address": "janesmith@example.com",
    City: "Los Angeles",
    "Favorite Quote": "To be or not to be, that is the question.",
    Salary: 60000,
    "Date Joined": Date.parse("2022-05-10"),
    "Is Active": false,
    Website: "www.janesmith.net",
  },
  {
    "First Name": "Henry",
    "Last Name": "Adams",
    Age: 34,
    "Email Address": "henrya@example.com",
    City: "San Jose",
    "Favorite Quote": "The best way to predict the future is to create it.",
    Salary: 65000,
    "Date Joined": Date.parse("2019-02-20"),
    "Is Active": true,
    Website: "www.henryadams.org",
  },
];

Deno.test("TabularFile (typed objects)", async (tc) => {
  const tf = mod.tabularFile<
    typeof csvFile01["fsEntry"],
    typeof csvFile01,
    RowFixture01
  >(csvFile01);

  await tc.step("readable", async () => {
    const encountered: RowFixture01[] = [];
    for await (const row of (await tf.readable()).values()) {
      encountered.push(row);
    }
    assertEquals(encountered, jsonFixture01);
  });

  await tc.step("readableSync", async () => {
    const encountered: RowFixture01[] = [];
    for await (const row of tf.readableSync().values()) {
      encountered.push(row);
    }
    assertEquals(encountered, jsonFixture01);
  });
});
