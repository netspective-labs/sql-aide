/**
 * Represents the user ID, username, and the provenance of how they were obtained.
 */
export type OsUser<Provenance extends string> = {
  readonly userId: string;
  readonly userName?: string;
  readonly provenance: Provenance;
};

/**
 * Attempts to retrieve the username of the current user by checking environment variables
 * and falling back to OS commands if necessary. If no username is found, it calls the
 * `ifNotFound` function with an issue description, allowing it to determine the return value.
 *
 * Requires the `--allow-env` and `--allow-run` flags.
 *
 * @param ifNotFound - A function that returns a fallback value when an issue occurs. The issue parameter describes the type of issue.
 * @returns The user ID, username, and provenance, or the value returned by `ifNotFound`.
 */
export async function osUserName<
  Provenance extends string =
    | "environment variable"
    | "whoami command"
    | "id -un command"
    | "indeterminate",
>(
  ifNotFound?: (
    issue:
      | "Posix id -u failure"
      | "Posix id -un failure"
      | "Windows whoami failure"
      | "no OS user found",
  ) => Promise<OsUser<Provenance> | undefined>,
): Promise<OsUser<Provenance> | undefined> {
  // Attempt to get the username from environment variables
  const env = Deno.env.toObject();
  const envVariable = env.SUDO_USER ||
    env.C9_USER /* Cloud9 */ ||
    env.LOGNAME ||
    env.USER ||
    env.LNAME ||
    env.USERNAME;

  if (envVariable) {
    return {
      userId: envVariable,
      provenance: "environment variable" as Provenance,
    };
  }

  if (Deno.build.os === "windows") {
    try {
      // On Windows, use `whoami` command and clean up the output
      const whoamiCmd = new Deno.Command("whoami", {
        stdout: "piped",
      });
      const whoamiOutput = await whoamiCmd.output();
      const userName = new TextDecoder().decode(whoamiOutput.stdout)
        .trim().replace(/^.*\\/, "");
      return {
        userId: userName,
        userName,
        provenance: "whoami command" as Provenance,
      };
    } catch (_) {
      return await ifNotFound?.("Windows whoami failure");
    }
  }

  try {
    // On Unix-like systems, use `id -u` to get the user ID
    const userIdCmd = new Deno.Command("id", {
      args: ["-u"],
      stdout: "piped",
    });
    const userIdOutput = await userIdCmd.output();
    const userId = new TextDecoder().decode(userIdOutput.stdout).trim();

    try {
      // Attempt to get the username associated with the user ID using `id -un`
      const userNameCmd = new Deno.Command("id", {
        args: ["-un"],
        stdout: "piped",
      });
      const userNameOutput = await userNameCmd.output();
      const userName = new TextDecoder().decode(userNameOutput.stdout)
        .trim();
      return {
        userId,
        userName,
        provenance: "id -un command" as Provenance,
      };
    } catch (_) {
      return await ifNotFound?.("Posix id -un failure");
    }
  } catch (_) {
    return await ifNotFound?.("Posix id -u failure");
  }
}
