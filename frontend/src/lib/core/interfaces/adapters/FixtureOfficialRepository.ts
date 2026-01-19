import type {
  FixtureOfficial,
  CreateFixtureOfficialInput,
  UpdateFixtureOfficialInput,
} from "../../entities/FixtureOfficial";
import type {
  EntityOperationResult,
  EntityListResult,
} from "../../entities/BaseEntity";

export interface FixtureOfficialFilter {
  fixture_id?: string;
  official_id?: string;
  role_id?: string;
  confirmation_status?: "pending" | "confirmed" | "declined" | "replaced";
}

export interface FixtureOfficialRepository {
  create_fixture_official(
    input: CreateFixtureOfficialInput,
  ): Promise<EntityOperationResult<FixtureOfficial>>;

  get_fixture_official_by_id(
    id: string,
  ): Promise<EntityOperationResult<FixtureOfficial>>;

  update_fixture_official(
    id: string,
    input: UpdateFixtureOfficialInput,
  ): Promise<EntityOperationResult<FixtureOfficial>>;

  delete_fixture_official(id: string): Promise<EntityOperationResult<boolean>>;

  find_by_filter(
    filter?: FixtureOfficialFilter,
    pagination?: { page: number; page_size: number },
  ): Promise<EntityListResult<FixtureOfficial>>;

  get_officials_for_fixture(
    fixture_id: string,
  ): Promise<EntityListResult<FixtureOfficial>>;

  get_fixtures_for_official(
    official_id: string,
  ): Promise<EntityListResult<FixtureOfficial>>;

  get_official_assignment_for_fixture(
    fixture_id: string,
    official_id: string,
  ): Promise<EntityOperationResult<FixtureOfficial>>;
}
