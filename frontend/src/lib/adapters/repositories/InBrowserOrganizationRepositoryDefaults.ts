import type { Organization } from "../../core/entities/Organization";
import type { Sport } from "../../core/entities/Sport";
import { ENTITY_STATUS } from "../../core/entities/StatusConstants";
import type { ScalarInput } from "../../core/types/DomainScalars";
import type { Result } from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";

const FIELD_HOCKEY_SPORT_CODE = "FIELD_HOCKEY";
const DEFAULT_SPORT_MISSING_MESSAGE =
  "Failed to prepare default organizations because the default sport is missing";

function find_sport_id_by_code(
  seeded_sports: Sport[],
  sport_code: string,
): Result<Sport["id"]> {
  const matched_sport = seeded_sports.find(
    (sport) => sport.code.toUpperCase() === sport_code.toUpperCase(),
  );
  if (matched_sport) return create_success_result(matched_sport.id);
  console.error("[OrganizationRepository] Sport not found in seeded sports", {
    event: "sport_lookup_failed",
    sport_code,
    available_codes: seeded_sports.map((sport) => sport.code),
  });
  return create_failure_result(DEFAULT_SPORT_MISSING_MESSAGE);
}

export function create_default_organizations(
  seeded_sports: Sport[],
): Result<ScalarInput<Organization>[]> {
  const sport_id_result = find_sport_id_by_code(
    seeded_sports,
    FIELD_HOCKEY_SPORT_CODE,
  );
  if (!sport_id_result.success) return sport_id_result;
  const now = new Date().toISOString();
  return create_success_result([
    {
      id: "org_default_1",
      name: "Uganda Hockey Association",
      description:
        "The governing body for field hockey in Uganda - organizing national competitions, developing players, and promoting hockey across the country",
      sport_id: sport_id_result.data,
      founded_date: "1972-06-15",
      contact_email: "info@ugandahockey.org",
      contact_phone: "+256-700-123-456",
      address: "Lugogo Hockey Stadium, Kampala, Uganda",
      website: "https://ugandahockey.org",
      status: ENTITY_STATUS.ACTIVE,
      created_at: now,
      updated_at: now,
    },
  ]);
}
