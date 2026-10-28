export const LIVE_GAME_ACTOR = {
  MANAGER: "manager",
  TABLE_OFFICIAL: "table_official",
  WATCHER: "watcher",
} as const;

export type LiveGameActor =
  (typeof LIVE_GAME_ACTOR)[keyof typeof LIVE_GAME_ACTOR];

const GAME_MANAGER_ROLES: ReadonlySet<string> = new Set([
  "super_admin",
  "org_admin",
  "officials_manager",
]);
const OFFICIAL_ROLE = "official";
const NOT_ON_GAME_NOTICE =
  "You're following this game like a spectator. Only the table official assigned to it can start it and record events.";
const WATCHER_NOTICE =
  "You can follow this game live. Only its table official, officials managers and admins can run it.";

interface AssignedOfficial {
  official_id: string;
  role_id: string;
  role_name: string;
}

interface LiveGameControlInput {
  role: string;
  official_id: string;
  assigned_officials: ReadonlyArray<AssignedOfficial>;
  table_role_ids: ReadonlySet<string>;
}

interface LiveGameControl {
  actor: LiveGameActor;
  notice: string;
}

function decide_official_control(input: LiveGameControlInput): LiveGameControl {
  const assignments = input.official_id
    ? input.assigned_officials.filter(
        (assignment) => assignment.official_id === input.official_id,
      )
    : [];
  if (
    assignments.some((assignment) =>
      input.table_role_ids.has(assignment.role_id),
    )
  )
    return { actor: LIVE_GAME_ACTOR.TABLE_OFFICIAL, notice: "" };
  if (assignments.length === 0)
    return { actor: LIVE_GAME_ACTOR.WATCHER, notice: NOT_ON_GAME_NOTICE };
  return {
    actor: LIVE_GAME_ACTOR.WATCHER,
    notice: `You're assigned to this game as ${assignments[0].role_name}. Only the table official runs the live game, so you're following it like a spectator.`,
  };
}

export function decide_live_game_control(
  input: LiveGameControlInput,
): LiveGameControl {
  if (GAME_MANAGER_ROLES.has(input.role))
    return { actor: LIVE_GAME_ACTOR.MANAGER, notice: "" };
  if (input.role === OFFICIAL_ROLE) return decide_official_control(input);
  return { actor: LIVE_GAME_ACTOR.WATCHER, notice: WATCHER_NOTICE };
}

export interface LiveGameIdentity {
  role: string;
  official_id: string;
  display_name: string;
  role_label: string;
  table_role_ids: ReadonlySet<string>;
}

export function can_identity_run_fixture(
  identity: LiveGameIdentity,
  fixture: { assigned_officials?: ReadonlyArray<AssignedOfficial> },
): boolean {
  return (
    decide_live_game_control({
      ...identity,
      assigned_officials: fixture.assigned_officials ?? [],
    }).actor !== LIVE_GAME_ACTOR.WATCHER
  );
}
