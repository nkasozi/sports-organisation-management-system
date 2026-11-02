import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
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
const prefix = "cp-uha-2026-women-";
const source = JSON.parse(
  await readFile(directory + "women-source.json", "utf8"),
);
assert.equal(source.settings.id, "6a15aeea99a101a46e33f643");
const now = new Date().toISOString();
const common = (id) => ({ id, created_at: now, updated_at: now });
const client = new ConvexHttpClient(`https://${deployment}.convex.cloud`);
async function scoped(table) {
  const page = await client.query(
    makeFunctionReference("sync:get_records_page"),
    { table_name: table, organization_id: organization, page_size: 100 },
  );
  assert(page.success && !page.has_more);
  return page.records;
}
function run(fn, args) {
  const folder = mkdtempSync(join(tmpdir(), "uha-women-seed-"));
  const path = join(folder, "response.json");
  const fd = openSync(path, "w", 0o600);
  try {
    execFileSync(
      fileURLToPath(
        new URL("../../../node_modules/.bin/convex", import.meta.url),
      ),
      [
        "run",
        fn,
        JSON.stringify(args),
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
        stdio: ["ignore", fd, "pipe"],
        maxBuffer: 1000000,
      },
    );
  } finally {
    closeSync(fd);
  }
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
}
const genderId = `gender_default_female_${organization}`;
const gender = run("sync:get_record_by_local_id", {
  table_name: "genders",
  local_id: genderId,
});
assert.equal(gender.status, "found");
assert.equal(gender.record.name, "Female");
const competitions = await scoped("competitions");
const men = competitions.find(
  (competition) => competition.id === "comp-1793650662778-k7v3j92ur0d",
);
assert(men && men.organization_id === organization);
const competitionId = prefix + "competition";
const teams = Object.values(source.rooms.competitors.competitors);
assert.equal(teams.length, 8);
const records = {
  teams: [],
  competitions: [],
  competition_stages: [],
  competition_teams: [],
};
const existing = {};
for (const table of Object.keys(records)) existing[table] = await scoped(table);
for (const team of teams) {
  const id = prefix + "team-" + team.id;
  if (existing.teams.some((record) => record.id === id)) continue;
  assert(/^\/2026\/.*\/competitor\/[a-f0-9-]+\.jpg$/.test(team.img));
  const response = await fetch("https://static.challengeplace.com" + team.img, {
    signal: AbortSignal.timeout(30000),
  });
  assert(
    response.ok &&
      response.headers.get("content-type")?.startsWith("image/jpeg"),
  );
  const image = Buffer.from(await response.arrayBuffer());
  assert(image.length > 100 && image[0] === 255 && image[1] === 216);
  const name = team.name === "Kampala" ? "Kampala Swans" : team.name;
  records.teams.push({
    ...common(id),
    name,
    short_name: team.acronym,
    organization_id: organization,
    gender_id: genderId,
    description: `2026 Uganda Cup Women; Challenge Place team: ${team.name}`,
    logo_url: "data:image/jpeg;base64," + image.toString("base64"),
    status: "active",
    captain_player_id: "",
    vice_captain_player_id: "",
    home_venue_id: "",
    primary_color: "#3B82F6",
    secondary_color: "#FFFFFF",
    max_squad_size: 25,
    website: "",
  });
}
if (!existing.competitions.some((record) => record.id === competitionId)) {
  const data = {
    ...men,
    ...common(competitionId),
    name: "2026 Uganda Cup Women",
    description: `Imported from ${source.source}`,
    max_teams: 8,
    team_ids: teams.map((team) => prefix + "team-" + team.id),
  };
  for (const key of [
    "local_id",
    "version",
    "synced_at",
    "sync_sequence",
    "_id",
    "_creationTime",
  ])
    delete data[key];
  records.competitions.push(data);
}
const stage = Object.values(source.rooms.stages.stages)[0];
for (const round of Object.values(
  source.rooms["stage-details:" + stage.id].rounds,
)) {
  const id = prefix + "stage-" + round.id;
  if (!existing.competition_stages.some((record) => record.id === id))
    records.competition_stages.push({
      ...common(id),
      competition_id: competitionId,
      name: round.name,
      stage_order: round.order,
      stage_type: "knockout_stage",
      status: "active",
    });
}
for (const team of teams) {
  const id = prefix + "entry-" + team.id;
  if (!existing.competition_teams.some((record) => record.id === id))
    records.competition_teams.push({
      ...common(id),
      competition_id: competitionId,
      team_id: prefix + "team-" + team.id,
      registration_date: "",
      status: "active",
      points: 0,
      goals_for: 0,
      goals_against: 0,
      goal_difference: 0,
      matches_played: 0,
      matches_won: 0,
      matches_drawn: 0,
      matches_lost: 0,
    });
}
console.log(
  "Women's foundation plan:",
  Object.fromEntries(
    Object.entries(records).map(([table, rows]) => [table, rows.length]),
  ),
);
if (process.argv.includes("--apply")) {
  for (const [table, rows] of Object.entries(records)) {
    for (const row of rows) {
      const result = run("sync:batch_upsert", {
        table_name: table,
        records: [
          {
            local_id: row.id,
            data: row,
            version: 1,
            base_version: { kind: "unknown" },
          },
        ],
      });
      assert(
        result.success && !result.has_conflicts && result.results[0]?.success,
        JSON.stringify(result),
      );
      console.log("Created", table, row.name || row.id);
    }
  }
  for (const table of Object.keys(records)) {
    const saved = await scoped(table);
    for (const row of records[table])
      assert(saved.some((record) => record.id === row.id));
  }
  await writeFile(
    directory + "women-foundation.json",
    JSON.stringify(
      {
        source: source.source,
        competition_id: competitionId,
        verified_at: new Date().toISOString(),
        team_mapping: teams.map((team) => ({
          source_id: team.id,
          team_id: prefix + "team-" + team.id,
          name: team.name === "Kampala" ? "Kampala Swans" : team.name,
          source_name: team.name,
          gender: "Female",
        })),
      },
      null,
      2,
    ) + "\n",
  );
  console.log("Verified women's teams, competition, stages and entries.");
}
