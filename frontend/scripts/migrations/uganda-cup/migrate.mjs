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
import { isDeepStrictEqual } from "node:util";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";

const directory = fileURLToPath(new URL(".", import.meta.url));
const women = process.argv.includes("--women");
const outputName = (name) => (women ? "women-" : "") + name;
const organization = "org-1793650098381-cxp1tfz5na";
const deployment = "animated-squirrel-109";
const client = new ConvexHttpClient(`https://${deployment}.convex.cloud`);
const identity = {
  subject: "admin_seed_nkasozi_gmail_com",
  email: "nkasozi@gmail.com",
  emailVerified: true,
};
const sourceText = await readFile(
  directory + outputName("source.json"),
  "utf8",
);
const source = JSON.parse(sourceText);
const dateOverrides = JSON.parse(
  await readFile(directory + "date-overrides.json", "utf8"),
);
const sourceHash = createHash("sha256").update(sourceText).digest("hex");
const prefix = women ? "cp-uha-2026-women-" : "cp-uha-2026-";
const localId = (kind, id) => prefix + kind + "-" + id;
const normalize = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, "");
const isoDate = (value) =>
  new Date(value).toLocaleDateString("en-CA", { timeZone: "Africa/Kampala" });
const localTime = (value) =>
  new Date(value).toLocaleTimeString("en-GB", {
    timeZone: "Africa/Kampala",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
const now = source.captured_at;
const common = (id) => ({ id, created_at: now, updated_at: now });
async function scopedRead(table) {
  const records = [];
  let cursor = "";
  do {
    const result = await client.query(
      makeFunctionReference("sync:get_records_page"),
      {
        table_name: table,
        organization_id: organization,
        after_local_id: cursor,
        page_size: 100,
      },
    );
    assert(
      result.success,
      `Scoped read failed for ${table}: ${JSON.stringify(result)}`,
    );
    records.push(...result.records);
    cursor = result.has_more ? result.next_cursor : "";
  } while (cursor);
  return records;
}
const rooms = source.rooms;
const sourceTeams = Object.values(rooms.competitors.competitors);
const sourceRosters = sourceTeams.map((team) => ({
  team,
  roster: rooms["competitor-details:" + team.id],
}));
const sourcePlayers = new Map();
for (const { team, roster } of sourceRosters) {
  assert.equal(
    Object.keys(roster.players).length,
    team.playerCount,
    `Incomplete roster: ${team.name}`,
  );
  for (const player of Object.values(roster.players)) {
    const existing = sourcePlayers.get(player.id);
    assert(
      !existing || existing.name === player.name,
      "Conflicting source player identity",
    );
    sourcePlayers.set(player.id, player);
    assert(
      rooms["player-details:" + player.id],
      `Missing profile ${player.name}`,
    );
  }
}
assert.equal(
  sourcePlayers.size,
  women ? 200 : 317,
  "Expected complete source player snapshot",
);
const existing = {};
for (const table of [
  "teams",
  "competitions",
  "competition_stages",
  "players",
  "fixtures",
  "player_team_memberships",
  "competition_teams",
]) {
  existing[table] = await scopedRead(table);
}
const competition = existing.competitions.find(
  (record) =>
    record.id ===
    (women
      ? "cp-uha-2026-women-competition"
      : "comp-1793650662778-k7v3j92ur0d"),
);
assert(
  competition && competition.organization_id === organization,
  "Existing Uganda Cup not found",
);
const competitionId = competition.id || competition.local_id;
const teamMap = new Map(
  sourceTeams.map((team) => {
    const matches = existing.teams.filter((record) =>
      women
        ? record.id === localId("team", team.id)
        : normalize(record.name) === normalize(team.name) &&
          record.gender_id === `gender_default_male_${organization}`,
    );
    assert.equal(
      matches.length,
      1,
      `Ambiguous/missing destination team ${team.name}`,
    );
    assert(
      competition.team_ids.includes(matches[0].id),
      `Team not entered in Uganda Cup: ${team.name}`,
    );
    return [team.id, matches[0]];
  }),
);
const stages = existing.competition_stages.filter(
  (stage) => stage.competition_id === competitionId,
);
const stageMap = new Map(stages.map((stage) => [stage.stage_order, stage]));
assert.equal(stageMap.size, women ? 3 : 4, "Expected existing knockout rounds");
const playerMap = new Map();
const planned = {
  players: [],
  player_team_memberships: [],
  fixtures: [],
  competition_teams: [],
};
for (const [id, player] of sourcePlayers) {
  const expectedId = localId("player", id);
  const exact = existing.players.find((record) => record.id === expectedId);
  // Names are not identifiers: three source name pairs belong to distinct IDs.
  const candidates = exact ? [exact] : [];
  assert(candidates.length <= 1, `Ambiguous existing player ${player.name}`);
  const destinationId = candidates[0]?.id || expectedId;
  playerMap.set(id, destinationId);
  if (!candidates.length) {
    const parts = player.name.trim().split(/\s+/);
    assert(parts[0], "Player name is missing: " + player.id);
    planned.players.push({
      ...common(destinationId),
      organization_id: organization,
      first_name: parts.length > 1 ? parts.slice(0, -1).join(" ") : parts[0],
      last_name: parts.length > 1 ? parts.at(-1) : "",
      gender_id: teamMap.get(player.competitorId).gender_id,
      date_of_birth: "",
      nationality: "",
      position_id: "",
      email: "",
      phone: "",
      height_cm: 0,
      weight_kg: 0,
      profile_image_url: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      medical_notes: "",
      status: "active",
    });
  }
  const profile = rooms["player-details:" + id];
  const membershipId = localId("membership", id);
  const teamId = teamMap.get(profile.competitorId).id;
  const membership = existing.player_team_memberships.find(
    (record) => record.id === membershipId,
  );
  if (
    !membership ||
    membership.player_id !== destinationId ||
    membership.team_id !== teamId
  )
    planned.player_team_memberships.push({
      ...common(membershipId),
      ...(membership
        ? { version: membership.version, created_at: membership.created_at }
        : {}),
      organization_id: organization,
      player_id: destinationId,
      team_id: teamId,
      start_date: "",
      jersey_number: 0,
      status: "active",
    });
}
const eventTypes = {
  goal: "goal",
  goalConceded: "goal_conceded",
  assist: "assist",
  greenCard: "green_card",
  yellowCard: "yellow_card",
  redCard: "red_card",
  penaltyCorner: "penalty_corner",
  penaltyStroke: "penalty_stroke",
};
assert.equal(
  new Set(playerMap.values()).size,
  sourcePlayers.size,
  "Distinct source player IDs must remain distinct",
);
const roundNumbers = women
  ? { Quarterfinals: 1, Semifinals: 2, Finals: 3 }
  : {
      "Round of 16": 1,
      Quarterfinals: 2,
      Semifinals: 3,
      Finals: 4,
    };
const sourceMatches = Object.entries(rooms).filter(([key]) =>
  key.startsWith("match-details:"),
);
const expectedMatchIds = new Set(
  Object.entries(rooms)
    .filter(([key]) => key.startsWith("series-details:"))
    .flatMap(([, series]) => Object.keys(series.matches)),
);
assert.equal(
  sourceMatches.length,
  expectedMatchIds.size,
  "Missing source match detail pages",
);
const resultAudit = [];
const omittedPlaceholders = [];
const allFixtures = [];
const totals = new Map(
  [...teamMap.values()].map((team) => [
    team.id,
    {
      matches_played: 0,
      matches_won: 0,
      matches_drawn: 0,
      matches_lost: 0,
      goals_for: 0,
      goals_against: 0,
      goal_difference: 0,
      points: 0,
    },
  ]),
);
for (const [key, match] of sourceMatches) {
  const sourceId = key.split(":")[1];
  const dateOverride = dateOverrides[sourceId];
  assert(expectedMatchIds.has(sourceId));
  if (!match.homeCompetitorId || !match.awayCompetitorId) {
    assert(
      match.homeScore == null &&
        match.awayScore == null &&
        !Object.keys(match.events).length,
      "Placeholder has results",
    );
    omittedPlaceholders.push(sourceId);
    continue;
  }
  assert(!match.live, "Cannot import a live match snapshot");
  const completed =
    Number.isInteger(match.homeScore) && Number.isInteger(match.awayScore);
  const home = teamMap.get(match.homeCompetitorId),
    away = teamMap.get(match.awayCompetitorId);
  assert(
    home && away && home.id !== away.id,
    "Invalid fixture team references",
  );
  const goals = { home: 0, away: 0 };
  const events = Object.values(match.events)
    .sort((a, b) => a.order - b.order)
    .map((event) => {
      assert(
        eventTypes[event.eventSettingsId],
        "Unmapped event " + event.eventSettingsId,
      );
      const side =
        event.competitorId === match.homeCompetitorId
          ? "home"
          : event.competitorId === match.awayCompetitorId
            ? "away"
            : "match";
      assert(side !== "match", "Event team is outside fixture");
      if (event.eventSettingsId === "goal") {
        assert.equal(event.inputValue, 1);
        goals[side]++;
      }
      const playerId = event.playerIds?.[0];
      if (playerId)
        assert(playerMap.has(playerId), `Missing event player ${playerId}`);
      const assist = Object.values(match.events).find(
        (child) =>
          child.parentId === event.id && child.eventSettingsId === "assist",
      );
      const assistId = assist?.playerIds?.[0];
      const period = match.partials[event.partialId];
      const periodId = period
        ? [
            "",
            "first_quarter",
            "second_quarter",
            "third_quarter",
            "fourth_quarter",
          ][period.order]
        : "";
      const eventLabel = {
        goal: "Goal",
        goalConceded: "Goal conceded",
        assist: "Assist",
        greenCard: "Green card",
        yellowCard: "Yellow card",
        redCard: "Red card",
        penaltyCorner: "Penalty corner",
        penaltyStroke: "Penalty stroke",
      }[event.eventSettingsId];
      return {
        id: localId("event", event.id),
        event_type: eventTypes[event.eventSettingsId],
        minute: 0,
        stoppage_time_minute: 0,
        team_side: side,
        player_id: playerId ? playerMap.get(playerId) : "",
        player_name: playerId ? sourcePlayers.get(playerId).name : "",
        secondary_player_id: assistId ? playerMap.get(assistId) : "",
        secondary_player_name: assistId ? sourcePlayers.get(assistId).name : "",
        description: period?.name
          ? `${eventLabel} · ${period.name}`
          : eventLabel,
        recorded_at: "",
        points_awarded: event.eventSettingsId === "goal" ? 1 : 0,
        ...(periodId ? { period_id: periodId } : {}),
      };
    });
  if (completed) {
    if (!women || events.length > 0)
      assert.equal(
        goals.home,
        match.homeScore,
        `Source home score/events mismatch: ${sourceId}`,
      );
    if (!women || events.length > 0)
      assert.equal(
        goals.away,
        match.awayScore,
        `Source away score/events mismatch: ${sourceId}`,
      );
    for (const [team, scored, conceded] of [
      [home, match.homeScore, match.awayScore],
      [away, match.awayScore, match.homeScore],
    ]) {
      const total = totals.get(team.id);
      total.matches_played++;
      total.goals_for += scored;
      total.goals_against += conceded;
      total[
        scored > conceded
          ? "matches_won"
          : scored < conceded
            ? "matches_lost"
            : "matches_drawn"
      ]++;
      total.goal_difference = total.goals_for - total.goals_against;
      total.points += scored > conceded ? 3 : scored === conceded ? 1 : 0;
    }
  } else assert(!events.length, "Unscored fixture has source events");
  const round = roundNumbers[match.roundName];
  assert(stageMap.has(round), "Unknown round " + match.roundName);
  const fixtureId = localId("fixture", sourceId);
  const sourceSeries = rooms["series-details:" + match.seriesId];
  assert(sourceSeries, "Missing source series");
  const fixture = {
    ...common(fixtureId),
    organization_id: organization,
    competition_id: competitionId,
    stage_id: stageMap.get(round).id,
    round_number: round,
    round_name: match.roundName,
    home_team_id: home.id,
    away_team_id: away.id,
    home_team_name: home.name,
    away_team_name: away.name,
    venue: "Lugogo Hockey Pitch",
    scheduled_date:
      dateOverride?.scheduled_date ?? (match.date ? isoDate(match.date) : ""),
    scheduled_time:
      dateOverride?.scheduled_time ?? (match.date ? localTime(match.date) : ""),
    ...(completed
      ? { home_team_score: match.homeScore, away_team_score: match.awayScore }
      : {}),
    game_events: events,
    assigned_officials: [],
    status: completed ? "completed" : "scheduled",
    current_period: completed ? "finished" : "pre_game",
    current_minute: 0,
    clock_status: "stopped",
    clock_elapsed_seconds: 0,
    clock_added_seconds: 0,
    clock_started_at: "",
    clock_break_started_at: "",
    match_day: match.order,
    notes: JSON.stringify({
      source: `${source.source}/match/${sourceId}`,
      source_match_id: sourceId,
      stage: match.stageName,
      round: match.roundName,
      series_id: match.seriesId,
      series: match.seriesName,
      leg: match.order,
      source_date_timestamp: match.date,
      source_winner: match.winnerSlot || "",
      series_winner: match.seriesWinnerSlot || "",
      series_home_score: sourceSeries.homeScore ?? null,
      series_away_score: sourceSeries.awayScore ?? null,
      quarter_scores: Object.values(match.partials),
      source_stats: match.stats || {},
      import_note:
        "Unknown match minutes, recording times and lineup details were not invented.",
    }),
  };
  allFixtures.push(fixture);
  const stored = existing.fixtures.find((record) => record.id === fixtureId);
  if (!stored) planned.fixtures.push(fixture);
  else {
    assert.equal(
      stored.home_team_score,
      fixture.home_team_score,
      "Existing imported score differs",
    );
    assert.equal(
      stored.away_team_score,
      fixture.away_team_score,
      "Existing imported score differs",
    );
    assert.equal(
      stored.game_events.length,
      fixture.game_events.length,
      "Existing imported event count differs",
    );
    if (!isDeepStrictEqual(stored.game_events, fixture.game_events)) {
      // Presentation cleanup must never replace an edited event or match field.
      for (let index = 0; index < fixture.game_events.length; index++) {
        assert.deepEqual(
          { ...stored.game_events[index], description: "" },
          { ...fixture.game_events[index], description: "" },
          "Imported event changed outside its display description",
        );
      }
      planned.fixtures.push({
        ...stored,
        game_events: fixture.game_events,
        updated_at: new Date().toISOString(),
      });
    }
  }
  resultAudit.push({
    source_id: sourceId,
    home: home.name,
    away: away.name,
    home_score: match.homeScore ?? null,
    away_score: match.awayScore ?? null,
    status: fixture.status,
    date: fixture.scheduled_date,
    time: fixture.scheduled_time,
    round: match.roundName,
    events: events.length,
  });
}
assert.equal(
  resultAudit.filter((match) => match.status === "completed").length,
  women ? 12 : 20,
);
assert.equal(
  resultAudit.filter((match) => match.status === "scheduled").length,
  1,
);
for (const team of teamMap.values()) {
  const entry = existing.competition_teams.find(
    (record) =>
      record.competition_id === competitionId && record.team_id === team.id,
  );
  assert(entry, "Missing competition entry: " + team.name);
  const stats = totals.get(team.id);
  if (Object.entries(stats).some(([key, value]) => entry[key] !== value))
    planned.competition_teams.push({ ...entry, ...stats, updated_at: now });
}
const summary = {
  source: source.source,
  source_sha256: sourceHash,
  captured_at: source.captured_at,
  organization_id: organization,
  competition_id: competitionId,
  players: sourcePlayers.size,
  memberships: sourcePlayers.size,
  completed_matches: women ? 12 : 20,
  scheduled_matches: 1,
  source_events: allFixtures.reduce(
    (sum, fixture) => sum + fixture.game_events.length,
    0,
  ),
  omitted_empty_match_slots: omittedPlaceholders,
  matches: resultAudit,
  pending_records: Object.fromEntries(
    Object.entries(planned).map(([table, records]) => [table, records.length]),
  ),
};
await writeFile(
  directory + outputName("plan.json"),
  JSON.stringify({ summary, records: planned }, null, 2) + "\n",
);
console.log(JSON.stringify(summary, null, 2));
if (process.argv.includes("--apply")) {
  for (const [table, records] of Object.entries(planned)) {
    const batchSize = table === "fixtures" ? 2 : 25;
    for (let offset = 0; offset < records.length; offset += batchSize) {
      const batch = records.slice(offset, offset + batchSize).map((data) => {
        const clean = { ...data };
        for (const field of [
          "_id",
          "_creationTime",
          "local_id",
          "sync_sequence",
          "synced_at",
          "version",
        ])
          delete clean[field];
        return {
          local_id: data.id,
          data: clean,
          version: (data.version || 0) + 1,
          base_version: data.version
            ? { kind: "known", version: data.version }
            : { kind: "unknown" },
        };
      });
      // The CLI can truncate large piped stdout on exit; a regular file makes
      // response writes synchronous, so verification never relies on a fragment.
      const temporary = mkdtempSync(join(tmpdir(), "uha-import-response-"));
      const responsePath = join(temporary, "response.json");
      const descriptor = openSync(responsePath, "w", 0o600);
      let response;
      try {
        execFileSync(
          fileURLToPath(
            new URL("../../../node_modules/.bin/convex", import.meta.url),
          ),
          [
            "run",
            "sync:batch_upsert",
            JSON.stringify({ table_name: table, records: batch }),
            "--deployment-name",
            deployment,
            "--identity",
            JSON.stringify(identity),
            "--codegen",
            "disable",
          ],
          {
            cwd: fileURLToPath(new URL("../../../", import.meta.url)),
            encoding: "utf8",
            stdio: ["ignore", descriptor, "pipe"],
            maxBuffer: 10 * 1024 * 1024,
          },
        );
        closeSync(descriptor);
        response = JSON.parse(readFileSync(responsePath, "utf8"));
      } finally {
        rmSync(temporary, { recursive: true, force: true });
      }
      assert(
        response.success &&
          !response.has_conflicts &&
          response.results.length === batch.length &&
          response.results.every((result) => result.success),
        "Import batch failed: " + JSON.stringify(response),
      );
      console.log(
        `Imported ${table}: ${Math.min(offset + batch.length, records.length)}/${records.length}`,
      );
    }
  }
  const importedFixtures = (await scopedRead("fixtures")).filter(
    (fixture) =>
      fixture.competition_id === competitionId && fixture.id.startsWith(prefix),
  );
  const importedPlayers = await scopedRead("players");
  const importedMemberships = await scopedRead("player_team_memberships");
  assert.equal(
    importedPlayers.filter((player) => player.id.startsWith(prefix + "player-"))
      .length,
    sourcePlayers.size,
    "Unexpected imported player count",
  );
  assert.equal(
    importedMemberships.filter((membership) =>
      membership.id.startsWith(prefix + "membership-"),
    ).length,
    sourcePlayers.size,
    "Unexpected imported membership count",
  );
  for (const fixture of allFixtures) {
    const saved = importedFixtures.find((record) => record.id === fixture.id);
    assert(saved, "Missing saved fixture " + fixture.id);
    for (const key of [
      "home_team_score",
      "away_team_score",
      "home_team_id",
      "away_team_id",
      "scheduled_date",
      "scheduled_time",
      "stage_id",
      "status",
    ])
      assert.equal(saved[key], fixture[key], "Saved fixture mismatch: " + key);
    assert.deepEqual(
      saved.game_events,
      fixture.game_events,
      "Saved events differ from import",
    );
  }
  for (const [sourceId, playerId] of playerMap) {
    const player = importedPlayers.find((record) => record.id === playerId);
    assert(
      player &&
        (player.first_name + " " + player.last_name).trim() ===
          sourcePlayers.get(sourceId).name,
      "Saved player mismatch",
    );
    assert(
      importedMemberships.some(
        (record) =>
          record.player_id === playerId &&
          record.team_id ===
            teamMap.get(sourcePlayers.get(sourceId).competitorId).id,
      ),
      "Missing saved membership",
    );
  }
  await writeFile(
    directory + outputName("verification.json"),
    JSON.stringify(
      {
        ...summary,
        verified_at: new Date().toISOString(),
        status: "verified",
        saved_players: playerMap.size,
        saved_memberships: playerMap.size,
        saved_fixtures: importedFixtures.length,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    "VERIFIED: every player, team membership, fixture score, date and event matches the migration plan.",
  );
}
