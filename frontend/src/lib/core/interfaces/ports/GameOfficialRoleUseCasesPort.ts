import type {
  GameOfficialRole,
  CreateGameOfficialRoleInput,
  UpdateGameOfficialRoleInput,
} from "../../entities/GameOfficialRole";
import type { GameOfficialRoleFilter } from "../adapters/GameOfficialRoleRepository";
import type { AsyncResult } from "../../types/Result";
import type { BaseUseCasesPort } from "./BaseUseCasesPort";

export interface GameOfficialRoleUseCasesPort extends BaseUseCasesPort<
  GameOfficialRole,
  CreateGameOfficialRoleInput,
  UpdateGameOfficialRoleInput,
  GameOfficialRoleFilter
> {
  list_roles_for_sport(
    sport_id: string | null,
  ): AsyncResult<GameOfficialRole[]>;
}
