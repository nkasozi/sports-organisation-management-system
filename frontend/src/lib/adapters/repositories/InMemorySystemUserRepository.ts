import type {
  SystemUser,
  CreateSystemUserInput,
  UpdateSystemUserInput,
} from "../../core/entities/SystemUser";
import { InMemoryBaseRepository } from "./InMemoryBaseRepository";
import type { BaseEntity } from "../../core/entities/BaseEntity";

const SYSTEM_USER_STORAGE_KEY = "sports_org_system_users";
const SYSTEM_USER_ID_PREFIX = "usr";

export class InMemorySystemUserRepository extends InMemoryBaseRepository<
  SystemUser,
  CreateSystemUserInput,
  UpdateSystemUserInput
> {
  constructor() {
    super(SYSTEM_USER_STORAGE_KEY, SYSTEM_USER_ID_PREFIX);
  }

  protected create_entity_from_input(
    input: CreateSystemUserInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): SystemUser {
    return {
      id,
      email: input.email.trim().toLowerCase(),
      first_name: input.first_name.trim(),
      last_name: input.last_name.trim(),
      role: input.role,
      status: input.status || "active",
      created_at: timestamps.created_at,
      updated_at: timestamps.updated_at,
    };
  }

  protected apply_updates_to_entity(
    entity: SystemUser,
    updates: UpdateSystemUserInput,
  ): SystemUser {
    return {
      ...entity,
      email: updates.email?.trim().toLowerCase() ?? entity.email,
      first_name: updates.first_name?.trim() ?? entity.first_name,
      last_name: updates.last_name?.trim() ?? entity.last_name,
      role: updates.role ?? entity.role,
      status: updates.status ?? entity.status,
    };
  }
}
