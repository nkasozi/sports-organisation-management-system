import { get_repository_container } from "$lib/infrastructure/container";
import { get_organization_use_cases } from "$lib/core/usecases/OrganizationUseCases";
import { get_competition_use_cases } from "$lib/core/usecases/CompetitionUseCases";
import { get_team_use_cases } from "$lib/core/usecases/TeamUseCases";
import { get_player_use_cases } from "$lib/core/usecases/PlayerUseCases";
import { get_player_team_membership_use_cases } from "$lib/core/usecases/PlayerTeamMembershipUseCases";
import { get_official_use_cases } from "$lib/core/usecases/OfficialUseCases";
import { get_fixture_use_cases } from "$lib/core/usecases/FixtureUseCases";
import { get_sport_use_cases } from "$lib/core/usecases/SportUseCases";
import { get_player_position_use_cases } from "$lib/core/usecases/PlayerPositionUseCases";
import { get_team_staff_use_cases } from "$lib/core/usecases/TeamStaffUseCases";
import { get_team_staff_role_use_cases } from "$lib/core/usecases/TeamStaffRoleUseCases";
import { get_competition_format_use_cases } from "$lib/core/usecases/CompetitionFormatUseCases";
import { get_game_official_role_use_cases } from "$lib/core/usecases/GameOfficialRoleUseCases";
import {
  seed_all_data_if_needed,
  is_seeding_already_complete,
} from "./seedingService";
import { initialize_audit_event_handlers } from "$lib/infrastructure/handlers/AuditEventHandler";
import { first_time_setup_store } from "$lib/presentation/stores/firstTimeSetup";

let initialized = false;

const FIRST_TIME_DETECTION_KEY = "sports_org_app_initialized";

function is_first_time_use(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(FIRST_TIME_DETECTION_KEY) !== "true";
}

function mark_app_initialized(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(FIRST_TIME_DETECTION_KEY, "true");
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function initialize_app_data(): Promise<boolean> {
  if (initialized) return true;
  if (typeof window === "undefined") return false;

  const is_first_time = is_first_time_use();

  if (is_first_time) {
    first_time_setup_store.set_first_time(true);
    first_time_setup_store.start_setup();
    await delay(500);
  }

  if (is_first_time) {
    first_time_setup_store.update_progress("Initializing audit system...", 10);
    await delay(300);
  }
  initialize_audit_event_handlers();

  if (is_first_time) {
    first_time_setup_store.update_progress(
      "Setting up data repositories...",
      20,
    );
    await delay(300);
  }
  get_repository_container();

  if (is_first_time) {
    first_time_setup_store.update_progress(
      "Loading sport configurations...",
      30,
    );
    await delay(200);
  }
  get_sport_use_cases();
  get_organization_use_cases();

  if (is_first_time) {
    first_time_setup_store.update_progress(
      "Configuring player positions...",
      40,
    );
    await delay(200);
  }
  get_player_position_use_cases();
  get_team_staff_role_use_cases();
  get_game_official_role_use_cases();
  get_competition_format_use_cases();

  if (is_first_time) {
    first_time_setup_store.update_progress("Setting up team management...", 50);
    await delay(200);
  }
  get_team_use_cases();
  get_player_use_cases();
  get_player_team_membership_use_cases();

  if (is_first_time) {
    first_time_setup_store.update_progress(
      "Configuring staff and officials...",
      60,
    );
    await delay(200);
  }
  get_team_staff_use_cases();
  get_official_use_cases();

  if (is_first_time) {
    first_time_setup_store.update_progress("Loading competition system...", 70);
    await delay(200);
  }
  get_competition_use_cases();
  get_fixture_use_cases();

  if (is_first_time) {
    first_time_setup_store.update_progress("Seeding demo data...", 80);
    await delay(300);
  }
  await seed_all_data_if_needed();

  if (is_first_time) {
    first_time_setup_store.update_progress("Finalizing setup...", 95);
    await delay(400);
    mark_app_initialized();
    first_time_setup_store.complete_setup();
    await delay(600);
  }

  initialized = true;
  return true;
}

export { is_seeding_already_complete };
