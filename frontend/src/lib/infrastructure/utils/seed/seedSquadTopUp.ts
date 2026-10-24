import type { Gender } from "../../../core/entities/Gender";
import type { Player } from "../../../core/entities/Player";
import type { PlayerTeamMembership } from "../../../core/entities/PlayerTeamMembership";
import type {
  ScalarInput,
  ScalarValueInput,
} from "../../../core/types/DomainScalars";
import {
  SEED_GENDER_IDS,
  SEED_ORGANIZATION_IDS,
  SEED_TEAM_IDS,
} from "./seedIds";
import type { PositionIds } from "./seedPlayerIds";
import {
  SEED_SQUAD_LAST_NAMES,
  SEED_SQUAD_MEN_FIRST_NAMES,
  SEED_SQUAD_WOMEN_FIRST_NAMES,
} from "./seedSquadNames";

export const SEED_SQUAD_SIZE = 16;

const TOP_UP_ID_PREFIX = "player_squad_";
const MEMBERSHIP_ID_PREFIX = "player_team_membership_squad_";
const MEMBERSHIP_START_DATE = "2024-01-01";
const ACTIVE_STATUS = "active";
const EMAIL_DOMAIN = "sportsync.ug";

const WOMEN_TEAM_IDS: ReadonlySet<string> = new Set([
  SEED_TEAM_IDS.WEATHERHEAD_HC_WOMEN,
  SEED_TEAM_IDS.KAMPALA_HC_WOMEN,
  SEED_TEAM_IDS.WANANCHI_HC_WOMEN,
  SEED_TEAM_IDS.ROCKETS_HC_WOMEN,
]);

type SquadSlot = {
  index: number;
  team_id: string;
  jersey_number: number;
  is_women_team: boolean;
};

type MembershipInput = ScalarInput<PlayerTeamMembership>;
type PlayerInput = ScalarInput<Player>;

function free_jersey_numbers(taken: number[], count: number): number[] {
  const used = new Set(taken);
  const free: number[] = [];
  for (let number = 1; free.length < count; number += 1)
    if (!used.has(number)) free.push(number);
  return free;
}

function build_squad_slots(base: readonly MembershipInput[]): SquadSlot[] {
  let index = 0;
  return Object.values(SEED_TEAM_IDS).flatMap((team_id) => {
    const members = base.filter(
      (m) => m.team_id === team_id && m.status === ACTIVE_STATUS,
    );
    const missing = Math.max(0, SEED_SQUAD_SIZE - members.length);
    const numbers = members.map((m) => Number(m.jersey_number));
    return free_jersey_numbers(numbers, missing).map((jersey_number) => {
      index += 1;
      const is_women_team = WOMEN_TEAM_IDS.has(team_id);
      return { index, team_id, jersey_number, is_women_team };
    });
  });
}

function name_for(slot: SquadSlot): { first_name: string; last_name: string } {
  const first_names = slot.is_women_team
    ? SEED_SQUAD_WOMEN_FIRST_NAMES
    : SEED_SQUAD_MEN_FIRST_NAMES;
  return {
    first_name: first_names[slot.index % first_names.length],
    last_name:
      SEED_SQUAD_LAST_NAMES[(slot.index * 7) % SEED_SQUAD_LAST_NAMES.length],
  };
}

function position_for(slot: SquadSlot, positions: PositionIds): string {
  const cycle = [
    positions.cb,
    positions.lb,
    positions.rb,
    positions.cm,
    positions.cdm,
    positions.lm,
    positions.rm,
    positions.lw,
    positions.rw,
    positions.cf,
    positions.gk,
  ];
  return String(cycle[slot.jersey_number % cycle.length]);
}

function player_for(
  slot: SquadSlot,
  positions: PositionIds,
  organization_id: ScalarValueInput<Player["organization_id"]>,
  now: string,
): PlayerInput {
  const { first_name, last_name } = name_for(slot);
  const phone_suffix = String(500 + slot.index).padStart(3, "0");
  return {
    id: `${TOP_UP_ID_PREFIX}${slot.index}`,
    first_name,
    last_name,
    email:
      `${first_name}.${last_name}${slot.index}@${EMAIL_DOMAIN}`.toLowerCase(),
    phone: `+256-701-200-${phone_suffix}`,
    date_of_birth: `${1994 + (slot.index % 10)}-0${1 + (slot.index % 9)}-1${slot.index % 10}`,
    height_cm: (slot.is_women_team ? 160 : 170) + (slot.index % 15),
    weight_kg: (slot.is_women_team ? 55 : 65) + (slot.index % 15),
    nationality: "Uganda",
    profile_image_url: "",
    emergency_contact_name: `${SEED_SQUAD_LAST_NAMES[(slot.index * 3) % SEED_SQUAD_LAST_NAMES.length]} ${last_name}`,
    emergency_contact_phone: `+256-701-300-${phone_suffix}`,
    medical_notes: "",
    status: ACTIVE_STATUS,
    position_id: position_for(slot, positions),
    organization_id,
    gender_id: (slot.is_women_team
      ? SEED_GENDER_IDS.FEMALE
      : SEED_GENDER_IDS.MALE) as Gender["id"],
    created_at: now,
    updated_at: now,
  } as PlayerInput;
}

export function create_seed_squad_top_up_players(
  base_memberships: readonly MembershipInput[],
  positions: PositionIds,
  organization_id: ScalarValueInput<Player["organization_id"]>,
  now: string,
): PlayerInput[] {
  return build_squad_slots(base_memberships).map((slot) =>
    player_for(slot, positions, organization_id, now),
  );
}

export function create_seed_squad_top_up_memberships(
  base_memberships: readonly MembershipInput[],
  now: string,
): MembershipInput[] {
  return build_squad_slots(base_memberships).map(
    (slot) =>
      ({
        id: `${MEMBERSHIP_ID_PREFIX}${slot.index}`,
        organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
        player_id: `${TOP_UP_ID_PREFIX}${slot.index}`,
        team_id: slot.team_id,
        start_date: MEMBERSHIP_START_DATE,
        jersey_number: slot.jersey_number,
        status: ACTIVE_STATUS,
        created_at: now,
        updated_at: now,
      }) as MembershipInput,
  );
}
