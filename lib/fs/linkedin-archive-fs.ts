import * as zipFS from "./zip-fs.ts";
import * as tabFS from "./tabular-fs.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

/**
 * All LinkedIn Archive Entry names (senstive and non-sensitive).
 */
export const liaEntryNames = [
  "Ad_Targeting.csv",
  "Calendar.csv",
  "Connections.csv",
  "Contacts.csv",
  "Education.csv",
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
  "Skills.csv",
] as const;
export type LinkedInArchiveEntryName = typeof liaEntryNames[number];

/**
 * LinkedIn Archive Entry names which may contain sensitive (confidential) data.
 */
export const liaSensitiveEntryNames = [
  "Ad_Targeting.csv",
  "Calendar.csv",
  "Connections.csv",
  "Contacts.csv",
  "Endorsement_Given_Info.csv",
  "Events.csv",
  "Invitations.csv",
  "messages.csv",
  "PhoneNumbers.csv",
  "Recommendations_Given.csv",
] as const;
export type LinkedInArchiveSensitiveEntryName =
  typeof liaSensitiveEntryNames[number];

/**
 * Determine if the given LinkedInArchiveEntryName is potentially sensitive
 * @param name which LinedIn arvhive entry we're inquiring about
 * @returns true if name might have confidential data
 */
export function isLiaSensitiveEntryName(
  name: LinkedInArchiveEntryName,
): boolean {
  return liaSensitiveEntryNames.find((liasen) => name == liasen ? true : false)
    ? true
    : false;
}

export type LiaEndorsedSkillsSupplier = {
  "Endorsement_Received_Info.csv": Array<{
    "Endorsement Date": number;
    "Skill Name": string;
    "Endorser First Name": string;
    "Endorser Last Name": string;
    "Endorser Public Url": string;
    "Endorsement Status": string;
  }>;
  "Skills.csv": Array<{
    "Name": string;
    "Endorsements Count"?: number;
  }>;
};

export function countSkillsEndorsements(profile: LiaEndorsedSkillsSupplier) {
  if (!("Endorsement_Received_Info.csv" in profile)) {
    return;
  }

  // Create an endorsement counter map
  const endorsementCounts: { [key: string]: number } = {};

  // Count endorsements from 'Endorsement_Received_Info.csv'
  profile["Endorsement_Received_Info.csv"].forEach((endorsement) => {
    const skill = endorsement["Skill Name"];
    if (endorsementCounts[skill]) {
      endorsementCounts[skill] += 1;
    } else {
      endorsementCounts[skill] = 1;
    }
  });

  // Add the count to 'Skills.csv'
  profile["Skills.csv"].forEach((skill) => {
    skill["Endorsements Count"] = endorsementCounts[skill.Name] ?? 0;
  });
}

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

  async profile(options?: {
    filter?: (tableName: LinkedInArchiveEntryName) => boolean;
    transform?: (
      tableName: LinkedInArchiveEntryName,
      row: Record<string, Any>,
    ) => Record<string, Any>;
    endorsementsPrivate?: boolean;
  }) {
    const filter = options?.filter;
    const transform = options?.transform;

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
            Record<string, Any>[] | Error
          >
        > = {};
        for (const lian of liaEntryNames) {
          if (lian == "Profile.csv") continue;
          if (filter && !filter(lian)) continue;
          try {
            const eContent = entries[lian]?.tfTyped();
            if (eContent) {
              if (transform) {
                elaboration[lian] = await eContent.toArray(
                  await eContent.readable(),
                  (row) => transform(lian, row),
                );
              } else {
                elaboration[lian] = await eContent.toArray(
                  await eContent.readable(),
                );
              }
            }
          } catch (error) {
            elaboration[lian] = error;
          }
        }

        // the endorsements should be considered private
        countSkillsEndorsements(elaboration as LiaEndorsedSkillsSupplier);
        if (
          options?.endorsementsPrivate &&
          "Endorsement_Received_Info.csv" in (elaboration as Any)
        ) {
          // the endorsements should be considered private
          delete (elaboration as Any)["Endorsement_Received_Info.csv"];
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
