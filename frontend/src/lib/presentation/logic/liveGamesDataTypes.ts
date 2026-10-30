import type { Fixture } from "$lib/core/entities/Fixture";
import type { Organization } from "$lib/core/entities/Organization";
import type { UserScopeProfile } from "$lib/core/interfaces/ports";

import type { LiveGamesPublicDataLoader } from "./liveGamesPublicData";
import type { PRESENCE_STATUS } from "./presenceStatus";

type ListResult<T> = Promise<{ success: boolean; data?: { items: T[] } }>;
type GetByIdResult<T> = Promise<{ success: boolean; data?: T }>;

export type LiveGamesProfileState =
  | { status: typeof PRESENCE_STATUS.MISSING }
  | { status: typeof PRESENCE_STATUS.PRESENT; profile: UserScopeProfile };

export interface LiveGamesDataDependencies extends LiveGamesPublicDataLoader {
  organization_use_cases: {
    list(filter: Record<string, string>): ListResult<Organization>;
    get_by_id(organization_id: string): GetByIdResult<{
      id: string;
      sport_id: string;
    }>;
  };
  fixture_use_cases: {
    list(filter: Record<string, string>): ListResult<Fixture>;
  };
  team_use_cases: {
    get_by_id(team_id: string): GetByIdResult<{
      id: string;
      name: string;
      logo_url?: string;
      logo_image_url?: string;
      logo?: string;
    }>;
  };
  competition_use_cases: {
    get_by_id(competition_id: string): GetByIdResult<{
      id: string;
      name: string;
      organization_id: string;
    }>;
  };
  sport_use_cases: {
    get_by_id(sport_id: string): GetByIdResult<{ id: string; name: string }>;
  };
}

export interface LiveGamesFixtureState {
  fixtures: Fixture[];
  team_names: Record<string, string>;
  team_logo_urls: Record<string, string>;
  competition_names: Record<string, string>;
  sport_names: Record<string, string>;
}
