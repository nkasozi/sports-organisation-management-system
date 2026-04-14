import type {
  CreateGameOfficialRoleInput,
  GameOfficialRole,
  UpdateGameOfficialRoleInput,
} from "../../../../entities/GameOfficialRole";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
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
    sport_id: ScalarValueInput<GameOfficialRole["sport_id"]>,
  ): AsyncResult<GameOfficialRole[]>;
}
