import { path } from "./deps.ts";
import { assertEquals } from "./deps-test.ts";
import * as mod from "./linkedin-archive-fs.ts";

/**
 * Given a file name, get its current location relative to this test script;
 * useful because unit tests can be run from any directory so we must find
 * the proper location automatically.
 */
const relativeFilePath = (name: string) => {
  const absPath = path.fromFileUrl(import.meta.resolve(name));
  return path.relative(Deno.cwd(), absPath);
};

const syntheticProfile = {
  "Birth Date": undefined,
  "First Name": "Shahid",
  "Last Name": "Shah",
  "Maiden Name": undefined,
  Headline:
    "Shahid Shah is a Digital Health/LifeSci Serial Entrepreneur and CTO focused on Care Delivery Innovation Lifecycle Management",
  Summary:
    "I’m a company builder. I love making products that require complex engineering skills but need to be easy to deploy and use. My passion is innovation that improves people’s lives in measurable ways. My experience has been in regulated, security-conscious, safety-critical industries such as Med Devices, Digital Health (health IT), and Gov 2.0 because they’re usually creating the most demanding products and services.  I'm a C-suite native that can easily blend in with technical and engineering teams that need to deliver revenue-generating solutions to the marketplace. I have years of leadership experience that have helped transform product teams from marginal to high performance. My strategic foresight, thinking, and execution capabilities help companies understand their technology strategy weaknesses and help renovate their architecture and engineering groups into business focused technology units that can deliver high margin, high revenue, and high value solutions.   My communications skills are top notch. I can easily explain complex technical topics to non-technical colleagues in board rooms as well as stand up and speak about industry trends or deep technology topics at public and private events in front of thousands of people. I’ve spoken at dozens of conferences and many of my presentations are publicly available at www.SpeakerDeck.com/shah. I love sharing my skills and knowledge as both a social media influencer (author, blogger) and a private consensus-builder (when leading projects).  My software/hardware engineering and cybersecurity body of knowledge is up to date because I roll up my sleeves to create code when appropriate & dive into system architecture and design when required. I also conduct technology due diligence exercises for corporate acquisition or product integration requirements. My deep engineering and communications skills are both on display at my blog www.HealthcareGuy.com.  See http://ShahidShah.com for my interactive bio.",
  Industry: "Software Development",
  "Zip Code": 20904,
  Address: undefined,
  "Geo Location": "Silver Spring, Maryland, United States",
  "Twitter Handles": {
    netspective: "netspective",
    netspectivegov: "netspectivegov",
    ShahidNShah: "ShahidNShah",
    netspectivehc: "netspectivehc",
  },
  Websites: {
    PERSONAL: "http://www.ShahidShah.com",
    BLOG: "http://www.HealthcareGuy.com",
    OTHER: "http://shahidshah.brandyourself.com",
  },
  "Instant Messengers": { "SKYPE": "ShahidNShah" },
};

Deno.test("LinkedInArchiveFS liaEntries", async () => {
  const liaFS = await mod.LinkedInArchiveFS.fromPath(
    relativeFilePath("./linkedin-archive-fs_test-fixture.zip"),
  );
  const entries = await liaFS.liaEntries();
  const profileContent = entries["Profile.csv"]!.tfTyped();
  const profile = await profileContent.toArray(await profileContent.readable());
  assertEquals(profile.length, 1);
  assertEquals(profile[0], syntheticProfile);
});

Deno.test("LinkedInArchiveFS profile", async () => {
  const liaFS = await mod.LinkedInArchiveFS.fromPath(
    relativeFilePath("./linkedin-archive-fs_test-fixture.zip"),
  );
  const profile = await liaFS.profile();
  console.dir(profile);
});
