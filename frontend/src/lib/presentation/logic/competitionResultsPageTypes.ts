import type { Competition } from "$lib/core/entities/Competition";
import type { CompetitionFormat } from "$lib/core/entities/CompetitionFormat";
import type { CompetitionStage } from "$lib/core/entities/CompetitionStage";
import type { CompetitionTeam } from "$lib/core/entities/CompetitionTeam";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { Organization } from "$lib/core/entities/Organization";
import type { Team } from "$lib/core/entities/Team";

import type {
  CompetitionResultsCompetitionFormatState,
  CompetitionResultsSelectedCompetitionState,
} from "./competitionResultsPageContracts";

export interface EntityListResult<EntityType> {
  success: boolean;
  data?: { items: EntityType[] };
  error?: string;
}

export interface EntityResult<EntityType> {
  success: boolean;
  data?: EntityType;
  error?: string;
}

export interface CompetitionResultsDependencies {
  organization_use_cases: {
    list: (
      filters?: Record<string, string>,
    ) => Promise<EntityListResult<Organization>>;
  };
  competition_use_cases: {
    list: (
      filters: Record<string, string>,
      pagination: { page_number: number; page_size: number },
    ) => Promise<EntityListResult<Competition>>;
    get_by_id: (competition_id: string) => Promise<EntityResult<Competition>>;
  };
  format_use_cases: {
    get_by_id: (
      competition_format_id: string,
    ) => Promise<EntityResult<CompetitionFormat>>;
  };
  competition_stage_use_cases: {
    list_stages_by_competition: (
      competition_id: string,
      pagination: { page_number: number; page_size: number },
    ) => Promise<EntityListResult<CompetitionStage>>;
  };
  competition_team_use_cases: {
    list_teams_in_competition: (
      competition_id: string,
      pagination: { page_number: number; page_size: number },
    ) => Promise<EntityListResult<CompetitionTeam>>;
  };
  team_use_cases: {
    get_by_id: (team_id: string) => Promise<EntityResult<Team>>;
  };
  fixture_use_cases: {
    list_fixtures_by_competition: (
      competition_id: string,
    ) => Promise<EntityListResult<Fixture>>;
  };
}

export interface CompetitionResultsCompetitionBundle {
  selected_competition_state: CompetitionResultsSelectedCompetitionState;
  competition_format_state: CompetitionResultsCompetitionFormatState;
  competition_stages: CompetitionStage[];
  teams: Team[];
  team_map: Map<string, Team>;
  fixtures: Fixture[];
}
