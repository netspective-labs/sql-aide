import { assertEquals, path } from "./deps-test.ts";
import * as tap from "./protocol.ts";
import * as mod from "./compliance.ts";

Deno.test("TAP compliance with untyped diagnostics", async () => {
  const tcb = new mod.TapComplianceBuilder();
  await tcb.subject("Requirements & Specifications", (c) => {
    c.ok("SCF Control ID: SYS.01 - Requirement #1234 completed");
    c.ok("SCF Control ID: SYS.02 - Requirement #1235 completed");
    c.notOk("SCF Control ID: SYS.03 - Requirement #1236 incomplete", {
      diagnostics: {
        "Audit Note":
          "Pending minor revisions. See comments in Jira ticket ABC-123",
        "Jira Ticket": "ABC-123",
        "Pull Request": "https://github.com/repo/pull/789",
      },
    });
  });

  assertEquals(
    await Deno.readTextFile(
      path.fromFileUrl(import.meta.resolve("./compliance_test-fixture-01.tap")),
    ),
    tap.stringify(tcb.tapContent()),
  );
});

Deno.test("TAP compliance with typed diagnostics", async () => {
  const fixture01 = await new mod.TapComplianceBuilder<string, {
    "Audit Note": string;
    "Jira Ticket"?: string;
    "Pull Request"?: string;
  }>().subject("Requirements & Specifications", (c) => {
    c.ok("SCF Control ID: SYS.01 - Requirement #1234 completed");
    c.ok("SCF Control ID: SYS.02 - Requirement #1235 completed");
    c.notOk("SCF Control ID: SYS.03 - Requirement #1236 incomplete", {
      diagnostics: {
        "Audit Note":
          "Pending minor revisions. See comments in Jira ticket ABC-123",
        "Jira Ticket": "ABC-123",
        "Pull Request": new URL("https://github.com/repo/pull/789").toString(),
      },
    });
  });

  assertEquals(
    await Deno.readTextFile(
      path.fromFileUrl(import.meta.resolve("./compliance_test-fixture-01.tap")),
    ),
    tap.stringify(fixture01.tapContent()),
  );
});
