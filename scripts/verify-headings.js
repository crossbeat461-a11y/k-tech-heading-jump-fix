"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const esbuild = require("esbuild");

const root = path.join(__dirname, "..");
const outfile = path.join(os.tmpdir(), "hjf-heading-from-text.cjs");

async function main() {
  await esbuild.build({
    entryPoints: [path.join(root, "src/heading-from-text.ts")],
    bundle: true,
    platform: "node",
    format: "cjs",
    outfile,
    external: ["obsidian"],
    logLevel: "silent",
  });
  const { headingsFromMarkdown, normalizeHeadingText } = require(outfile);

  assert.equal(normalizeHeadingText("  A   B  "), "A B");

  const parsed = headingsFromMarkdown(
    [
      "---",
      "title: skip",
      "# not a heading",
      "---",
      "# One",
      "body",
      "## Two",
      "```",
      "# inside fence",
      "```",
      "### Three ###",
      "",
      "## Two",
    ].join("\n")
  );

  assert.equal(parsed.length, 4);
  assert.equal(parsed[0].heading, "One");
  assert.equal(parsed[0].level, 1);
  assert.equal(parsed[0].position.start.line, 4);
  assert.equal(parsed[1].heading, "Two");
  assert.equal(parsed[1].level, 2);
  assert.equal(parsed[2].heading, "Three");
  assert.equal(parsed[2].level, 3);
  assert.equal(parsed[3].heading, "Two");
  assert.equal(parsed[3].position.start.line, 12);

  const empty = headingsFromMarkdown("#");
  assert.equal(empty.length, 0);

  fs.unlinkSync(outfile);
  console.log("ok   heading-from-text");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
