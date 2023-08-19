import * as zipFS from "./zip-fs.ts";
import * as tabFS from "./tabular-fs.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export const liaEntryNames = [
  "Ad_Targeting.csv",
  "Calendar.csv",
  "Company",
  "Connections.csv",
  "Contacts.csv",
  "Education.csv",
  "Email",
  "Endorsement_Given_Info.csv",
  "Endorsement_Received_Info.csv",
  "Events.csv",
  "Invitations.csv",
  "Languages.csv",
  "Learning.csv",
  "messages.csv",
  "Patents.csv",
  "PhoneNumbers.csv",
  "Positions.csv",
  "Profile.csv",
  "Projects.csv",
  "Publications.csv",
  "Recommendations_Given.csv",
  "Recommendations_Received.csv",
  "Registration.csv",
  "Rich",
  "Services",
  "Skills.csv",
] as const;
export type LinkedInArchiveEntryName = typeof liaEntryNames[number];

export class LinkedInArchiveFS extends zipFS.ZipFS {
  readonly entryHandlers: Partial<
    Record<
      LinkedInArchiveEntryName,
      {
        readonly transform?: <Row extends Record<string, Any>>(
          parsed: Row,
        ) => Row;
      }
    >
  > = {
    "Profile.csv": {
      transform: (row) => {
        for (
          const transform of [
            "Websites",
            "Instant Messengers",
            "Twitter Handles",
          ]
        ) {
          // format: "[PERSONAL:http://www.ShahidShah.com,BLOG:http://www.HealthcareGuy.com,OTHER:http://shahidshah.brandy"
          // format: "[SKYPE:ShahidNShah]"
          let property = row[transform];
          if (
            property && typeof property === "string" &&
            property.startsWith("[") && property.endsWith("]")
          ) {
            property = Object.fromEntries(
              property.slice(1, -1).split(",").map(
                (pair) => {
                  const colonSepIdx = pair.indexOf(":");
                  return colonSepIdx == -1 ? [pair, pair] : [
                    pair.slice(0, colonSepIdx),
                    pair.slice(colonSepIdx + 1),
                  ];
                },
              ),
            );
            (row as Any)[transform] = property;
          }
        }
        return row;
      },
    },
  };

  liaFsFileEntry(path: LinkedInArchiveEntryName) {
    return new zipFS.ZipFileSystemEntry(this.jsZip.file(path), path);
  }

  // deno-lint-ignore require-await
  async liaEntries() {
    const entries: Partial<
      Record<
        LinkedInArchiveEntryName,
        {
          readonly tfRaw: () => tabFS.TabularFileRaw<
            zipFS.ZipFileSystemEntry,
            string[]
          >;
          readonly tfUntyped: () => tabFS.TabularFileUntyped<
            zipFS.ZipFileSystemEntry,
            string[] | Record<string, unknown>
          >;
          readonly tfTyped: <Row extends Record<string, Any>>() =>
            tabFS.TabularFile<zipFS.ZipFileSystemEntry, Row>;
        }
      >
    > = {} as Any;
    for (const lian of liaEntryNames) {
      const file = this.file(this.liaFsFileEntry(lian));
      if (file.fsEntry.exists()) {
        entries[lian] = {
          tfRaw: () =>
            tabFS.tabularFileRaw<zipFS.ZipFileSystemEntry, typeof file>(file),
          tfUntyped: () =>
            tabFS.tabularFileUntyped<zipFS.ZipFileSystemEntry, typeof file>(
              file,
            ),
          tfTyped: <Row extends Record<string, Any>>() =>
            tabFS.tabularFile<zipFS.ZipFileSystemEntry, typeof file, Row>(
              file,
              this.entryHandlers[lian]?.transform<Row>,
            ),
        };
      }
    }
    return entries;
  }

  async profile() {
    const entries = await this.liaEntries();
    const profileEntry = entries["Profile.csv"];
    if (profileEntry) {
      const profileContent = profileEntry.tfTyped();
      const profileRows = await profileContent.toArray(
        await profileContent.readable(),
      );

      if (profileRows.length == 1) {
        const profile = profileRows.length == 1 ? profileRows[0] : undefined;
        const elaboration: Partial<
          Record<
            LinkedInArchiveEntryName,
            { rows: Record<string, Any>[]; error?: Error }
          >
        > = {};
        for (const lian of liaEntryNames) {
          if (lian == "Profile.csv") continue;
          try {
            const eContent = entries[lian]?.tfTyped();
            if (eContent) {
              elaboration[lian] = {
                rows: await eContent.toArray(await eContent.readable()),
              };
            }
          } catch (error) {
            elaboration[lian] = { rows: [], error };
          }
        }

        return {
          ...profile,
          ...elaboration,
        };
      }

      return Error(
        `Single-row Profile.csv not found in LinkedIn Archive (${profileRows.length} rows found)`,
      );
    }

    return Error("Profile.csv not found in LinkedIn Archive");
  }

  static async fromPath(path: string): Promise<LinkedInArchiveFS> {
    const zfs = await zipFS.ZipFS.fromPath(path);
    return new LinkedInArchiveFS(zfs.jsZip);
  }
}
