import type { CreateGameEventTypeInput } from "./GameEventTypeTypes";

export type DefaultGameEventType = Omit<
  CreateGameEventTypeInput,
  "organization_id" | "sport_id"
>;

const GLOBAL_GAME_EVENT_TYPE_SPORT_ID =
  "" as CreateGameEventTypeInput["sport_id"];

export function attach_global_sport_scope(
  event_types: ReadonlyArray<DefaultGameEventType>,
  organization_id: CreateGameEventTypeInput["organization_id"],
): CreateGameEventTypeInput[] {
  return event_types.map((event_type) => ({
    ...event_type,
    sport_id: GLOBAL_GAME_EVENT_TYPE_SPORT_ID,
    organization_id,
  }));
}
