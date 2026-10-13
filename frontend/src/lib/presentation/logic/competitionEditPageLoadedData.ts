import type {
  Competition,
  UpdateCompetitionInput,
} from "$lib/core/entities/Competition";
import type { CompetitionFormat } from "$lib/core/entities/CompetitionFormat";
import type { CompetitionTeam } from "$lib/core/entities/CompetitionTeam";
import type { Organization } from "$lib/core/entities/Organization";
import type { Sport } from "$lib/core/entities/Sport";
import { ENTITY_STATUS } from "$lib/core/entities/StatusConstants";
import type { Team } from "$lib/core/entities/Team";
import type { Result } from "$lib/core/types/Result";

import type {
  CompetitionEditSelectedFormatState,
  CompetitionEditSelectedSportState,
} from "./competitionEditPageContracts";
import {
  type CompetitionEditPageSourceResults,
  extract_competition_edit_list_items,
} from "./competitionEditPageDataSources";
import { create_competition_update_form_data } from "./competitionEditPageState";

export interface CompetitionEditPageLoadedData {
  competition: Competition;
  organizations: Organization[];
  competition_formats: CompetitionFormat[];
  all_teams: Team[];
  competition_team_entries: CompetitionTeam[];
  form_data: UpdateCompetitionInput;
  selected_format_state: CompetitionEditSelectedFormatState;
  selected_sport_state: CompetitionEditSelectedSportState;
  is_customizing_scoring: boolean;
}

function build_competition_edit_selected_format_state(
  competition_formats: CompetitionFormat[],
  competition_format_id: string | undefined,
): CompetitionEditSelectedFormatState {
  const selected_format = competition_formats.find(
    (competition_format: CompetitionFormat) =>
      competition_format.id === competition_format_id,
  );

  if (!selected_format) {
    return { status: "missing" };
  }

  return { status: "present", competition_format: selected_format };
}

function build_competition_edit_selected_sport_state(
  selected_sport_result: Result<Sport>,
): CompetitionEditSelectedSportState {
  if (!selected_sport_result.success) {
    return { status: "missing" };
  }

  return { status: "present", sport: selected_sport_result.data };
}

export function build_competition_edit_loaded_data(
  competition: Competition,
  sources: CompetitionEditPageSourceResults,
  organizations: Organization[],
  selected_sport_result: Result<Sport>,
): CompetitionEditPageLoadedData {
  const competition_formats = extract_competition_edit_list_items(
    sources.formats_result,
  ).filter(
    (competition_format: CompetitionFormat) =>
      competition_format.status === ENTITY_STATUS.ACTIVE,
  );
  return {
    competition,
    organizations,
    competition_formats,
    all_teams: extract_competition_edit_list_items(sources.teams_result),
    competition_team_entries: extract_competition_edit_list_items(
      sources.competition_teams_result,
    ),
    form_data: create_competition_update_form_data(competition),
    selected_format_state: build_competition_edit_selected_format_state(
      competition_formats,
      competition.competition_format_id,
    ),
    selected_sport_state: build_competition_edit_selected_sport_state(
      selected_sport_result,
    ),
    is_customizing_scoring: !!(
      competition.rule_overrides?.points_config_override ||
      competition.rule_overrides?.tie_breakers_override
    ),
  };
}
