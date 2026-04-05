import type { BaseEntity } from "$lib/core/entities/BaseEntity";
import type { EntityTypeKey } from "./entityUseCasesRegistry";

function to_record(entity: BaseEntity): Record<string, unknown> {
  return entity as unknown as Record<string, unknown>;
}

function get_name_or_id(entity: BaseEntity): string {
  return (to_record(entity).name as string) || entity.id;
}

function get_full_name_or_id(entity: BaseEntity): string {
  const record = to_record(entity);
  return (
    `${record.first_name || ""} ${record.last_name || ""}`.trim() || entity.id
  );
}

export const ENTITY_DISPLAY_NAME_GETTERS: Record<
  string,
  (entity: BaseEntity) => string
> = {
  organization: get_name_or_id,
  competition: get_name_or_id,
  team: get_name_or_id,
  player: get_full_name_or_id,
  playerteammembership: (e) => e.id,
  playerteamtransferhistory: (e) => e.id,
  official: get_full_name_or_id,
  fixture: (e) => {
    const f = to_record(e);
    return (
      `${f.venue || "Fixture"} - Round ${f.round_number || ""}`.trim() || e.id
    );
  },
  fixturedetailssetup: (e) => e.id,
  competitionformat: get_name_or_id,
  competitionstage: get_name_or_id,
  gameeventtype: get_name_or_id,
  gameofficialrole: get_name_or_id,
  teamstaffrole: get_name_or_id,
  teamstaff: get_full_name_or_id,
  fixturelineup: (e) => e.id,
  sport: get_name_or_id,
  playerposition: get_name_or_id,
  qualification: get_name_or_id,
  venue: get_name_or_id,
  identificationtype: get_name_or_id,
  gender: get_name_or_id,
  identification: (e) => e.id,
  jerseycolor: (e) => (to_record(e).nickname as string) || e.id,
  systemuser: get_full_name_or_id,
  auditlog: (e) => e.id,
  playerprofile: (e) => (to_record(e).profile_slug as string) || e.id,
  profilelink: (e) => {
    const l = to_record(e);
    return (l.title as string) || (l.platform as string) || e.id;
  },
  livegamelog: (e) => {
    const g = to_record(e);
    return `Game ${g.fixture_id || e.id} - ${g.game_status || "unknown"}`;
  },
  gameeventlog: (e) => {
    const ev = to_record(e);
    return `${ev.event_type || "Event"} at ${ev.minute || 0}'`;
  },
};

export function get_entity_display_name(
  entity_type: string,
  entity: BaseEntity,
): string {
  const getter = ENTITY_DISPLAY_NAME_GETTERS[entity_type];
  return getter ? getter(entity) : entity.id;
}
