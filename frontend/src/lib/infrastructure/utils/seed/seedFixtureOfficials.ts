import type { Fixture } from "../../../core/entities/Fixture";

const UMPIRE_ROLE_NAME = "Umpire";
const TECHNICAL_TABLE_ROLE_NAME = "Technical Table";

interface SeedFixtureOfficialPair {
  umpire_official_id: string;
  technical_table_official_id: string;
  referee_role_id: string;
  assistant_referee_role_id: string;
}

export function create_seed_fixture_official_pair(
  pair: SeedFixtureOfficialPair,
): import("$lib/core/types/DomainScalars").ScalarInput<Fixture>["assigned_officials"] {
  return [
    {
      official_id: pair.umpire_official_id,
      role_id: pair.referee_role_id,
      role_name: UMPIRE_ROLE_NAME,
    },
    {
      official_id: pair.technical_table_official_id,
      role_id: pair.assistant_referee_role_id,
      role_name: TECHNICAL_TABLE_ROLE_NAME,
    },
  ];
}
