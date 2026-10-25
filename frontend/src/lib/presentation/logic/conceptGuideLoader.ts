import { FIXTURE_STATUS } from "$lib/core/entities/StatusConstants";
import type { PaginatedAsyncResult } from "$lib/core/types/Result";

import {
  COMPETITION_SELECTION,
  type CompetitionProgress,
  type CompetitionProgressState,
  type ConceptGuideSnapshot,
} from "./conceptGuideTypes";

type GuideRecord = { id: string } & Record<string, unknown>;

interface ListSource {
  list(filter?: Record<string, unknown>): PaginatedAsyncResult<GuideRecord>;
}

export interface ConceptGuideSources {
  organizations: ListSource;
  venues: ListSource;
  teams: ListSource;
  players: ListSource;
  officials: ListSource;
  competitions: ListSource;
  stages: ListSource;
  entries: ListSource;
  fixtures: ListSource;
  fixture_setups: ListSource;
  lineups: ListSource;
}

export interface GuideCompetition {
  id: string;
  name: string;
}

export async function list_guide_records(
  list_source: ListSource,
  filter: Record<string, unknown> = {},
): Promise<GuideRecord[]> {
  const result = await list_source.list(filter);
  if (result.success) return result.data.items;
  console.warn("[ConceptGuide] Could not load records", {
    event: "concept_guide_records_load_failed",
    error: result.error,
  });
  return [];
}

function count_ready(
  fixtures: GuideRecord[],
  is_ready: (fixture: GuideRecord) => boolean,
): number {
  return fixtures.filter(is_ready).length;
}

function has_both_lineups(
  fixture: GuideRecord,
  lineups: GuideRecord[],
): boolean {
  const team_ids = new Set(
    lineups
      .filter((lineup) => lineup.fixture_id === fixture.id)
      .map((lineup) => lineup.team_id),
  );
  return (
    team_ids.has(fixture.home_team_id) && team_ids.has(fixture.away_team_id)
  );
}

async function load_competition_progress(
  sources: ConceptGuideSources,
  organization_id: string,
  competition: GuideCompetition,
): Promise<CompetitionProgress> {
  const by_competition = { competition_id: competition.id };
  const by_organization = { organization_id };
  const [stages, entries, fixtures, setups, lineups] = await Promise.all([
    list_guide_records(sources.stages, by_competition),
    list_guide_records(sources.entries, by_competition),
    list_guide_records(sources.fixtures, by_competition),
    list_guide_records(sources.fixture_setups, by_organization),
    list_guide_records(sources.lineups, by_organization),
  ]);
  const with_status = (status: string): GuideRecord[] =>
    fixtures.filter((fixture) => fixture.status === status);
  const open_fixtures = with_status(FIXTURE_STATUS.SCHEDULED);
  const set_up_fixture_ids = new Set(setups.map((setup) => setup.fixture_id));
  return {
    name: competition.name,
    stage_count: stages.length,
    entered_team_count: entries.length,
    fixture_count: fixtures.length,
    open_fixture_count: open_fixtures.length,
    open_fixtures_with_setup: count_ready(open_fixtures, (fixture) =>
      set_up_fixture_ids.has(fixture.id),
    ),
    open_fixtures_with_lineups: count_ready(open_fixtures, (fixture) =>
      has_both_lineups(fixture, lineups),
    ),
    live_count: with_status(FIXTURE_STATUS.IN_PROGRESS).length,
    completed_count: with_status(FIXTURE_STATUS.COMPLETED).length,
  };
}

async function load_competition_state(
  sources: ConceptGuideSources,
  organization_id: string,
  competition: GuideCompetition | false,
): Promise<CompetitionProgressState> {
  if (!competition) return { status: COMPETITION_SELECTION.NONE };
  return {
    status: COMPETITION_SELECTION.SELECTED,
    progress: await load_competition_progress(
      sources,
      organization_id,
      competition,
    ),
  };
}

export async function load_concept_guide_snapshot(
  sources: ConceptGuideSources,
  organization_id: string,
  competition: GuideCompetition | false,
): Promise<ConceptGuideSnapshot> {
  const by_organization = { organization_id };
  const [organizations, venues, teams, players, officials, competitions] =
    await Promise.all([
      list_guide_records(sources.organizations),
      list_guide_records(sources.venues, by_organization),
      list_guide_records(sources.teams, by_organization),
      list_guide_records(sources.players, by_organization),
      list_guide_records(sources.officials, by_organization),
      list_guide_records(sources.competitions, by_organization),
    ]);
  return {
    organization_count: organizations.length,
    venue_count: venues.length,
    team_count: teams.length,
    player_count: players.length,
    official_count: officials.length,
    competition_count: competitions.length,
    competition_state: await load_competition_state(
      sources,
      organization_id,
      competition,
    ),
  };
}
