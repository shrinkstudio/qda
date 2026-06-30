// -----------------------------------------
// QDA — DEV DEPLOY HELPER
// -----------------------------------------
// Builds, commits, pushes, then prints a commit-hash-PINNED jsDelivr URL
// plus its SRI integrity hash — everything needed to register/update the
// bundle via the Webflow Scripts API during development.
//
// Why pinned (not @main) during dev:
//   Commit-SHA URLs are immutable on jsDelivr, so a fresh push is served
//   INSTANTLY with no purge lag or stale cache. At go-live we switch the
//   Webflow embed to plain @main (see README "Deploy").
//
// Usage:
//   npm run deploy            # commit msg defaults to "dev: bundle update"
//   npm run deploy -- "msg"   # custom commit message
// -----------------------------------------

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const REPO = "shrinkstudio/qda";
const FILE = "dist/index.min.js";

const run = (cmd) => execSync(cmd, { stdio: ["inherit", "pipe", "inherit"] }).toString().trim();
const log = (msg) => process.stdout.write(`${msg}\n`);

const msg = process.argv.slice(2).join(" ") || "dev: bundle update";

// 1. Build
log("▶ Building…");
execSync("node build.js", { stdio: "inherit" });

// 2. Commit (skip cleanly if nothing changed) + push
execSync("git add -A");
const dirty = run("git status --porcelain");
if (dirty) {
  execSync(`git commit -q -m ${JSON.stringify(msg)}`, { stdio: "inherit" });
  log(`▶ Committed: ${msg}`);
} else {
  log("▶ No changes to commit — re-pinning current HEAD.");
}
execSync("git push -q origin HEAD", { stdio: "inherit" });

// 3. Pinned URL + SRI integrity hash + SemVer version
const sha = run("git rev-parse HEAD");
const sri = "sha384-" + createHash("sha384").update(readFileSync(FILE)).digest("base64");
const url = `https://cdn.jsdelivr.net/gh/${REPO}@${sha}/${FILE}`;
// Webflow registerScript requires a UNIQUE SemVer per update — derive a
// monotonic patch from the total commit count so it always increments.
const version = `0.0.${run("git rev-list --count HEAD")}`;

log("\n─────────────────────────────────────────────");
log("  PINNED DEPLOY — register/update in Webflow Scripts API");
log("─────────────────────────────────────────────");
log(`  hostedLocation : ${url}`);
log(`  integrityHash  : ${sri}`);
log(`  version        : ${version}`);
log("─────────────────────────────────────────────");
log(`  Short SHA: ${sha.slice(0, 7)}`);
log("");
