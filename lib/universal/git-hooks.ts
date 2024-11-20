
import { parse } from "https://deno.land/std/flags/mod.ts";
import { Command } from "https://deno.land/x/cliffy/command/mod.ts";

async function initHooks() {
  const gitHooksDir = '.githooks';
  await Deno.mkdir(gitHooksDir, { recursive: true });

  const hooks = {
    'pre-commit': preCommit,
    'pre-push': prePush,
    'prepare-commit-message': prepareCommitMessage,
  };

  for (const [name, handler] of Object.entries(hooks)) {
    const script = `#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env
import { ${name} } from "https://raw.githubusercontent.com/netspective-labs/sql-aide/vX.Y.Z/lib/universal/git-hooks.ts";
await ${name}();`;

    await Deno.writeTextFile(`${gitHooksDir}/${name}`, script, { mode: 0o755 });
  }
}

async function preCommit() {
  if (Deno.env.get("GITHOOK_BYPASS")) return;

  console.log("Running pre-commit checks...");

  await runDenoCommand(["deno", "lint"], "Linting code...");

  await runDenoCommand(["deno", "test"], "Running unit tests...");

  console.log("Pre-commit checks passed.");
}

async function prePush() {
  if (Deno.env.get("GITHOOK_BYPASS")) return;

  console.log("Running pre-push checks...");

  await runDenoCommand(["deno", "check"], "Type checking...");

  console.log("Pre-push checks passed.");
}

async function prepareCommitMessage(args: string[]) {
  if (Deno.env.get("GITHOOK_BYPASS")) return;

  console.log("Preparing commit message...");

  const commitMessageFilePath = args[0];
  let commitMessage = await Deno.readTextFile(commitMessageFilePath);
  commitMessage = "Prefix: " + commitMessage;
  await Deno.writeTextFile(commitMessageFilePath, commitMessage);

  console.log("Commit message prepared.");
}

async function runDenoCommand(cmd: string[], taskDescription: string) {
  console.log(taskDescription);
  const process = Deno.run({
    cmd,
    stdout: "piped",
    stderr: "piped",
  });

  const { code } = await process.status();

  if (code !== 0) {
    const rawError = await process.stderrOutput();
    const errorString = new TextDecoder().decode(rawError);
    console.error(`${taskDescription} failed:\n`, errorString);
    Deno.exit(code);
  }
}

async function main() {
  const { _: [hookName], ...args } = parse(Deno.args);

  switch (hookName) {
    case "pre-commit":
      await preCommit();
      break;
    case "pre-push":
      await prePush();
      break;
    case "prepare-commit-msg":
      await prepareCommitMessage(args._ as string[]);
      break;
    default:
      console.error(`Unsupported hook: ${hookName}`);
      Deno.exit(1);
  }
}

if (import.meta.main) {
  await main();
}

if (import.meta.main) {
  new Command()
    .name("git-hooks")
    .description("Manage Git hooks.")
    .action(initHooks)
    .parse(Deno.args);
}

export { preCommit, prePush, prepareCommitMessage };