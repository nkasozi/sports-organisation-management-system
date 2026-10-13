import type {
  LiveGameDetailDerivedState,
  LiveGameDetailPageState,
} from "./liveGameDetailPageState";

type LiveGameDetailPresentationState = Pick<
  LiveGameDetailDerivedState,
  | "assigned_officials"
  | "team_names"
  | "venue_name"
  | "venue_location"
  | "home_team_short_name"
  | "away_team_short_name"
  | "home_team_color"
  | "away_team_color"
  | "officials_color"
>;

const DEFAULT_HOME_TEAM_COLOR = "#3b82f6";
const DEFAULT_AWAY_TEAM_COLOR = "#ef4444";
const DEFAULT_HOME_SHORT_NAME = "HOM";
const DEFAULT_AWAY_SHORT_NAME = "AWY";
const SHORT_NAME_LENGTH = 3;

function build_venue_location(page_state: LiveGameDetailPageState): string {
  const city = page_state.venue?.city || "";
  const country = page_state.venue?.country;
  if (!country) return city;
  return `${city}${city ? ", " : ""}${country}`;
}

function build_team_names(
  page_state: LiveGameDetailPageState,
): LiveGameDetailDerivedState["team_names"] {
  return {
    [page_state.fixture?.home_team_id || "home"]:
      page_state.home_team?.name || "Home",
    [page_state.fixture?.away_team_id || "away"]:
      page_state.away_team?.name || "Away",
  };
}

function build_short_team_name(
  team_name: string,
  fallback_short_name: string,
): string {
  return (
    team_name.slice(0, SHORT_NAME_LENGTH).toUpperCase() || fallback_short_name
  );
}

export function derive_live_game_detail_presentation_state(
  page_state: LiveGameDetailPageState,
): LiveGameDetailPresentationState {
  const fixture = page_state.fixture;
  return {
    assigned_officials: page_state.assigned_officials_data.map(
      (assignment) => ({
        name: `${assignment.official.first_name} ${assignment.official.last_name}`,
        role_name: assignment.role_name,
      }),
    ),
    team_names: build_team_names(page_state),
    venue_name: page_state.venue?.name || fixture?.venue || "",
    venue_location: build_venue_location(page_state),
    home_team_short_name: build_short_team_name(
      page_state.home_team?.name ?? "",
      DEFAULT_HOME_SHORT_NAME,
    ),
    away_team_short_name: build_short_team_name(
      page_state.away_team?.name ?? "",
      DEFAULT_AWAY_SHORT_NAME,
    ),
    home_team_color:
      fixture?.home_team_jersey?.main_color || DEFAULT_HOME_TEAM_COLOR,
    away_team_color:
      fixture?.away_team_jersey?.main_color || DEFAULT_AWAY_TEAM_COLOR,
    officials_color: fixture?.officials_jersey?.main_color || "",
  };
}
