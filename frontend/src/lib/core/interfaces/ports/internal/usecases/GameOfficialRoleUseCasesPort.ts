import type {
  CreateGameOfficialRoleInput,
  GameOfficialRole,
  UpdateGameOfficialRoleInput,
} from "../../../../entities/GameOfficialRole";
import type { AsyncResult } from "../../../../types/Result";
import type { GameOfficialRoleFilter } from "../../external/repositories/GameOfficialRoleRepository";
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
