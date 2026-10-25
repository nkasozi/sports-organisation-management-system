import type { GameEvent } from "$lib/core/entities/Fixture";
import type { LineupPlayer } from "$lib/core/entities/FixtureLineup";
import { GAME_EVENT_LOG_TYPE } from "$lib/core/entities/GameEventLogTypes";
import type { GameEventCorrection } from "$lib/core/usecases/FixtureGameEventCorrections";

interface LiveGameEventEditForm {
  player_id: string;
  minute: number;
  description: string;
}

const MINIMUM_MINUTE = 0;

export function can_change_event_player(event: GameEvent): boolean {
  return event.event_type !== GAME_EVENT_LOG_TYPE.SUBSTITUTION;
}

export function create_event_edit_form(
  event: GameEvent,
): LiveGameEventEditForm {
  return {
    player_id: String(event.player_id ?? ""),
    minute: Number(event.minute),
    description: String(event.description ?? ""),
  };
}

function player_fields(
  form: LiveGameEventEditForm,
  players: readonly LineupPlayer[],
): GameEventCorrection {
  const player = players.find(
    (candidate) => String(candidate.id) === form.player_id,
  );
  if (!player) return {};
  return {
    player_id: player.id,
    player_name: `${player.first_name} ${player.last_name}`,
  } as GameEventCorrection;
}

export function build_event_correction(
  event: GameEvent,
  form: LiveGameEventEditForm,
  players: readonly LineupPlayer[],
): GameEventCorrection {
  const minute = Math.max(MINIMUM_MINUTE, Math.round(Number(form.minute) || 0));
  return {
    ...(can_change_event_player(event) ? player_fields(form, players) : {}),
    minute,
    description: form.description.trim(),
  } as GameEventCorrection;
}
