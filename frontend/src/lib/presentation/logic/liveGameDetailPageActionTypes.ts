import {
  get_fixture_lineup_use_cases,
  get_fixture_use_cases,
  get_player_team_membership_use_cases,
  get_player_use_cases,
} from "$lib/infrastructure/registry/useCaseFactories";
import type { LiveGameDetailDataDependencies } from "$lib/presentation/logic/liveGameDetailData";

export type FixtureLineupUseCases = ReturnType<
  typeof get_fixture_lineup_use_cases
>;
export type FixtureUseCases = ReturnType<typeof get_fixture_use_cases>;
export type PlayerMembershipUseCases = ReturnType<
  typeof get_player_team_membership_use_cases
>;
export type PlayerUseCases = ReturnType<typeof get_player_use_cases>;

export interface LiveGameDetailPageActionDependencies extends LiveGameDetailDataDependencies {
  player_membership_use_cases: PlayerMembershipUseCases;
  player_use_cases: PlayerUseCases;
}
