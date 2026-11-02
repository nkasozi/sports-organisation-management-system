import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  closeSync,
  mkdtempSync,
  openSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";

const directory = fileURLToPath(new URL(".", import.meta.url));
const organization = "org-1793650098381-cxp1tfz5na";
const deployment = "animated-squirrel-109";
const client = new ConvexHttpClient(`https://${deployment}.convex.cloud`);
const source = JSON.parse(await readFile(directory + "source.json", "utf8"));
const normalize = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, "");
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
async function teams() {
  const page = await client.query(
    makeFunctionReference("sync:get_records_page"),
    {
      table_name: "teams",
      organization_id: organization,
      page_size: 100,
    },
  );
  assert(
    page.success && !page.has_more,
    "Expected complete organization team page",
  );
  return page.records;
}
const existing = await teams();
const images = [];
for (const team of Object.values(source.rooms.competitors.competitors)) {
  assert(
    /^\/2026\/5\/26\/11\/competitor\/[a-f0-9-]+\.jpg$/.test(team.img),
    "Unexpected logo path",
  );
  const matches = existing.filter(
    (record) => normalize(record.name) === normalize(team.name),
  );
  assert.equal(matches.length, 1, `Ambiguous destination team: ${team.name}`);
  assert.equal(matches[0].organization_id, organization);
  const url = "https://static.challengeplace.com" + team.img;
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  assert(
    response.ok,
    `Logo download failed for ${team.name}: ${response.status}`,
  );
  assert(
    response.headers.get("content-type")?.startsWith("image/jpeg"),
    "Expected original JPEG",
  );
  const bytes = Buffer.from(await response.arrayBuffer());
  assert(bytes.length > 100 && bytes.length < 750000, "Unexpected image size");
  assert(
    bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
    "Invalid JPEG signature",
  );
  images.push({
    team,
    record: matches[0],
    url,
    bytes,
    data: "data:image/jpeg;base64," + bytes.toString("base64"),
  });
}
assert.equal(images.length, 11);
const report = {
  source: source.source,
  organization_id: organization,
  checked_at: new Date().toISOString(),
  status: "planned",
  logos: images.map(({ team, record, url, bytes, data }) => ({
    team: team.name,
    team_id: record.id,
    source_url: url,
    bytes: bytes.length,
    sha256: digest(bytes),
    changed: record.logo_url !== data,
  })),
};
await writeFile(
  directory + "logo-verification.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
if (process.argv.includes("--apply")) {
  for (const { team, record, data } of images) {
    if (record.logo_url === data) continue;
    const clean = {
      ...record,
      logo_url: data,
      updated_at: new Date().toISOString(),
    };
    for (const key of [
      "_id",
      "_creationTime",
      "local_id",
      "version",
      "sync_sequence",
      "synced_at",
    ])
      delete clean[key];
    const temporary = mkdtempSync(join(tmpdir(), "uha-logo-response-"));
    const path = join(temporary, "response.json");
    const descriptor = openSync(path, "w", 0o600);
    try {
      execFileSync(
        fileURLToPath(
          new URL("../../../node_modules/.bin/convex", import.meta.url),
        ),
        [
          "run",
          "sync:batch_upsert",
          JSON.stringify({
            table_name: "teams",
            records: [
              {
                local_id: record.id,
                data: clean,
                version: record.version + 1,
                base_version: { kind: "known", version: record.version },
              },
            ],
          }),
          "--deployment-name",
          deployment,
          "--identity",
          JSON.stringify({
            subject: "admin_seed_nkasozi_gmail_com",
            email: "nkasozi@gmail.com",
            emailVerified: true,
          }),
          "--codegen",
          "disable",
        ],
        {
          cwd: fileURLToPath(new URL("../../../", import.meta.url)),
          stdio: ["ignore", descriptor, "pipe"],
          maxBuffer: 1000000,
        },
      );
    } finally {
      closeSync(descriptor);
    }
    try {
      const result = JSON.parse(readFileSync(path, "utf8"));
      assert(
        result.success &&
          !result.has_conflicts &&
          result.results.length === 1 &&
          result.results[0].success,
        `Logo update rejected: ${team.name}`,
      );
    } finally {
      rmSync(temporary, { recursive: true, force: true });
    }
    console.log("Imported logo:", team.name);
  }
  const saved = await teams();
  for (const { team, record, data, bytes } of images) {
    const actual = saved.find((entry) => entry.id === record.id);
    assert.equal(actual.logo_url, data, `Saved logo differs: ${team.name}`);
    assert.equal(
      digest(Buffer.from(actual.logo_url.split(",")[1], "base64")),
      digest(bytes),
    );
    for (const [key, value] of Object.entries(record)) {
      if (
        ![
          "logo_url",
          "updated_at",
          "version",
          "sync_sequence",
          "synced_at",
        ].includes(key)
      )
        assert.deepEqual(
          actual[key],
          value,
          `Unexpected team change: ${team.name}.${key}`,
        );
    }
  }
  report.status = "verified";
  report.verified_at = new Date().toISOString();
  report.saved_logos = saved.filter((entry) =>
    images.some(({ record }) => record.id === entry.id),
  ).length;
  await writeFile(
    directory + "logo-verification.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(
    "VERIFIED: all 11 stored logos match the original source bytes; other team fields are unchanged.",
  );
}
