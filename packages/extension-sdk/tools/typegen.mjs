#!/usr/bin/env node
import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const kitRoot = resolve(repoRoot, process.env.IRODORI_KIT ?? "../..");
const generatedFile = "src/generated/irodori-extension-api.ts";
const generatedPath = resolve(repoRoot, generatedFile);

const options = parseArgs(process.argv.slice(2));

if (options.help) {
  printHelp();
  process.exit(0);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

async function main() {
  console.log("Generating extension SDK TypeScript bindings...");
  await run(
    "cargo",
    [
      "test",
      "--manifest-path",
      resolve(kitRoot, "Cargo.toml"),
      "-p",
      "irodori-extension",
      "export_typescript_bindings",
    ],
    {
      cwd: repoRoot,
      env: generatorEnv(process.env),
    },
  );

  await normalizeGeneratedFile(generatedPath);

  if (options.check) {
    await checkGeneratedFile();
    return;
  }

  console.log(`Generated ${generatedFile}.`);
}

async function normalizeGeneratedFile(path) {
  const source = await readFile(path, "utf8");
  let normalized = source.replace(/\r\n/g, "\n").replace(/[ \t]+$/gm, "");
  if (!normalized.endsWith("\n")) {
    normalized += "\n";
  }
  if (normalized !== source) {
    await writeFile(path, normalized);
  }
}

async function checkGeneratedFile() {
  const hasHead = await runCapture("git", ["rev-parse", "--verify", "HEAD"], {
    cwd: repoRoot,
  });
  if (hasHead.code !== 0) {
    console.log("Generated TypeScript bindings are up to date.");
    return;
  }

  const diff = await runCapture("git", ["diff", "--no-ext-diff", "HEAD", "--", generatedFile], {
    cwd: repoRoot,
  });

  if (diff.code === 0 && diff.stdout.trim().length === 0) {
    console.log("Generated TypeScript bindings are up to date.");
    return;
  }

  if (diff.code !== 0 && diff.code !== 1) {
    process.stderr.write(diff.stderr);
    throw new Error(`git diff failed with exit code ${diff.code}.`);
  }

  console.error(
    [
      "Generated TypeScript bindings are out of date.",
      "",
      "Run `npm run typegen` from packages/extension-sdk and commit:",
      `  - ${generatedFile}`,
      "",
      "Diff:",
    ].join("\n"),
  );
  process.stderr.write(diff.stdout);
  process.stderr.write(diff.stderr);
  process.exit(1);
}

function parseArgs(argv) {
  const parsed = {
    check: false,
    help: false,
  };

  for (const arg of argv) {
    if (arg === "--check" || arg === "-c") {
      parsed.check = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
      continue;
    }

    console.error(`Unknown argument: ${arg}`);
    printHelp();
    process.exit(1);
  }

  return parsed;
}

function printHelp() {
  console.log(
    [
      "Usage: node tools/typegen.mjs [--check]",
      "",
      "Regenerates the extension SDK TypeScript bindings from irodori-kit.",
      "",
      "Environment:",
      `  IRODORI_KIT  Path to irodori-kit (default: ${relative(repoRoot, kitRoot)})`,
      "",
      "Options:",
      "  --check, -c   Regenerate, then fail if generated files differ from git.",
      "  --help, -h    Show this help.",
    ].join("\n"),
  );
}

function generatorEnv(env) {
  const next = { ...env };
  delete next.CI;
  next.CARGO_TARGET_DIR = resolve(repoRoot, ".irodori-local/target");
  next.IRODORI_EXTENSION_SDK_GENERATED = generatedPath;
  return next;
}

function run(command, args, options) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      ...options,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`${command} terminated by ${signal}`));
        return;
      }

      if (code === 0) {
        resolvePromise();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code}`));
    });
  });
}

function runCapture(command, args, options) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      ...options,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const stdout = [];
    const stderr = [];

    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`${command} terminated by ${signal}`));
        return;
      }

      resolvePromise({
        code,
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8"),
      });
    });
  });
}
