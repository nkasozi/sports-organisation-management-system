import type { Organization } from "../../core/entities/Organization";
import type { Sport } from "../../core/entities/Sport";
import {
  create_none_option,
  create_some_option,
  type Option,
} from "../../core/types/Option";
import type { Result } from "../../core/types/Result";
import { REGISTRY_LOG_EVENT } from "./registryConstants";

const SEED_SPORT_LOG_SCOPE =
  "[UseCaseFactories] Organization sport unavailable for defaults";

interface SportLookup {
  get_by_id: (sport_id: string) => Promise<Result<Sport>>;
}

export async function find_organization_seed_sport(
  organization: Organization,
  sport_lookup: SportLookup,
): Promise<Option<Sport>> {
  const sport_result = await sport_lookup.get_by_id(organization.sport_id);
  if (sport_result.success) return create_some_option(sport_result.data);
  console.warn(SEED_SPORT_LOG_SCOPE, {
    event: REGISTRY_LOG_EVENT.ORGANIZATION_SEED_SPORT_MISSING,
    organization_id: organization.id,
    sport_id: organization.sport_id,
    error: sport_result.error,
  });
  return create_none_option();
}
