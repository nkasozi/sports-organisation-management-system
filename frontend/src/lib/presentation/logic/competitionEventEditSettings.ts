import { normalize_max_event_edits_per_game_input } from "$lib/core/entities/CompetitionEventEditLimit";

const NO_EVENT_EDITS_ALLOWED = 0;
const SINGLE_EVENT_EDIT = 1;
const MAX_EVENT_EDITS_FIELD = "max_event_edits_per_game";

export const COMPETITION_EVENT_EDIT_SETTINGS_TEXT = {
  label: "Event edits allowed per game",
  help: "The table official running a live game can fix mistakes in recorded events (wrong player, wrong minute, or remove an event) up to this many times per game. Each edit needs a reason and is shown in the match log. Set to 0 to stop officials editing events — officials managers and admins can still correct them. An officials manager can give a game a fresh set of edits.",
  no_edits_hint: "Officials won't be able to edit or remove events.",
} as const;

export function normalize_competition_event_edit_settings<
  FormData extends { max_event_edits_per_game?: number },
>(form_data: FormData): FormData {
  if (!(MAX_EVENT_EDITS_FIELD in form_data)) return form_data;
  return {
    ...form_data,
    max_event_edits_per_game: normalize_max_event_edits_per_game_input(
      form_data.max_event_edits_per_game,
    ),
  };
}

export function build_max_event_edits_hint(value: unknown): string {
  const edit_limit = normalize_max_event_edits_per_game_input(value);
  if (edit_limit === NO_EVENT_EDITS_ALLOWED)
    return COMPETITION_EVENT_EDIT_SETTINGS_TEXT.no_edits_hint;
  const edit_noun = edit_limit === SINGLE_EVENT_EDIT ? "edit" : "edits";
  return `Officials can make up to ${edit_limit} ${edit_noun} per game.`;
}
