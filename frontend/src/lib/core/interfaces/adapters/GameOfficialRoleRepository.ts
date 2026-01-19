import type { Repository } from "./Repository";
import type {
  GameOfficialRole,
  CreateGameOfficialRoleInput,
  UpdateGameOfficialRoleInput,
} from "../../entities/GameOfficialRole";

export interface GameOfficialRoleFilter {
  name_contains?: string;
  sport_id?: string | null;
  is_on_field?: boolean;
  is_head_official?: boolean;
  status?: GameOfficialRole["status"];
}

export interface GameOfficialRoleRepository extends Repository<
  GameOfficialRole,
  CreateGameOfficialRoleInput,
  UpdateGameOfficialRoleInput
> {
  find_by_sport(sport_id: string | null): Promise<GameOfficialRole[]>;
  find_head_officials(): Promise<GameOfficialRole[]>;
}

export type {
  GameOfficialRole,
  CreateGameOfficialRoleInput,
  UpdateGameOfficialRoleInput,
};
