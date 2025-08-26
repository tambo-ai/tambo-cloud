"use strict";

const fs = require("fs");
const path = require("path");

function parseArgs(argv) {
  const args = { src: "/src", dst: process.cwd(), dryRun: false };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--dry-run") {
      args.dryRun = true;
      continue;
    }
    if ((a === "--src" || a === "-s") && argv[i + 1]) {
      args.src = argv[i + 1];
      i += 1;
      continue;
    }
    if ((a === "--dst" || a === "-d") && argv[i + 1]) {
      args.dst = argv[i + 1];
      i += 1;
      continue;
    }
  }
  return args;
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function copyFile(fromAbs, toAbs, dryRun) {
  const rel = `${path.relative("/", fromAbs)} -> ${path.relative("/", toAbs)}`;
  if (!fs.existsSync(fromAbs)) {
    console.log(`[skip] ${rel} (source missing)`);
    return;
  }
  console.log(`[copy] ${rel}`);
  if (dryRun) return;
  ensureDir(path.dirname(toAbs));
  fs.copyFileSync(fromAbs, toAbs);
}

function listDirs(absBase) {
  try {
    return fs
      .readdirSync(absBase, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    return [];
  }
}

function normalizeWorkspacePatterns(workspaces) {
  if (!workspaces) return [];
  if (Array.isArray(workspaces)) return workspaces;
  if (typeof workspaces === "object" && Array.isArray(workspaces.packages)) {
    return workspaces.packages;
  }
  return [];
}

function main() {
  const { src, dst, dryRun } = parseArgs(process.argv);
  const rootPkgPath = path.join(src, "package.json");
  if (!fs.existsSync(rootPkgPath)) {
    console.error(`Root package.json not found at ${rootPkgPath}`);
    process.exit(1);
  }
  const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, "utf8"));
  const patterns = normalizeWorkspacePatterns(rootPkg.workspaces);

  // Always include root manifests first
  copyFile(
    path.join(src, "package.json"),
    path.join(dst, "package.json"),
    dryRun,
  );
  copyFile(
    path.join(src, "package-lock.json"),
    path.join(dst, "package-lock.json"),
    dryRun,
  );

  for (const pat of patterns) {
    if (!pat || typeof pat !== "string") continue;
    // Simple one-level wildcard support: e.g., apps/* or packages/*
    if (pat.includes("*")) {
      const baseDir = pat.split("*")[0].replace(/\/$/, "");
      const absBase = path.join(src, baseDir);
      for (const entry of listDirs(absBase)) {
        const relDir = path.join(baseDir, entry);
        copyFile(
          path.join(src, relDir, "package.json"),
          path.join(dst, relDir, "package.json"),
          dryRun,
        );
        copyFile(
          path.join(src, relDir, "package-lock.json"),
          path.join(dst, relDir, "package-lock.json"),
          dryRun,
        );
      }
    } else {
      copyFile(
        path.join(src, pat, "package.json"),
        path.join(dst, pat, "package.json"),
        dryRun,
      );
      copyFile(
        path.join(src, pat, "package-lock.json"),
        path.join(dst, pat, "package-lock.json"),
        dryRun,
      );
    }
  }
}

if (require.main === module) {
  main();
}
