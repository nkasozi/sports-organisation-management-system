import {
  create_game_event,
  type QuickEventButton,
} from "$lib/core/entities/Fixture";
import { get_fixture_use_cases } from "$lib/infrastructure/registry/useCaseFactories";

type FixtureUseCases = ReturnType<typeof get_fixture_use_cases>;

export async function record_live_game_detail_event(
  fixture_id: string,
  selected_event_type: QuickEventButton,
  event_minute: number,
  selected_team_side: "home" | "away",
  event_player_name: string,
  event_description: string,
  secondary_player_name: string,
  fixture_use_cases: FixtureUseCases,
): Promise<Awaited<ReturnType<FixtureUseCases["record_game_event"]>>> {
  return fixture_use_cases.record_game_event(
    fixture_id,
    create_game_event(
      selected_event_type.id,
      event_minute,
      selected_team_side,
      event_player_name,
      secondary_player_name
        ? `${event_player_name} ON for ${secondary_player_name}`
        : event_description || selected_event_type.label,
      secondary_player_name || "",
    ),
  );
}

export async function record_live_game_extra_time_event(
  fixture_id: string,
  elapsed_minutes: number,
  minutes_added: number,
  period_label: string,
  fixture_use_cases: FixtureUseCases,
): Promise<Awaited<ReturnType<FixtureUseCases["record_game_event"]>>> {
  return fixture_use_cases.record_game_event(
    fixture_id,
    create_game_event(
      "period_start",
      elapsed_minutes,
      "match",
      "",
      `${minutes_added} min added time - ${period_label}`,
    ),
  );
}
