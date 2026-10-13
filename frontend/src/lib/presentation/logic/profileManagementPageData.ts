import {
  build_profile_management_options,
  type ProfileManagementConfiguration,
  type ProfileManagementEntity,
  type ProfileManagementOption,
} from "$lib/presentation/logic/profileManagementPageState";

import { PROFILE_MANAGEMENT_PAGE_EVENT } from "./profileManagementPageConstants";

type ProfileManagementDataResult =
  | {
      success: true;
      profiles: ProfileManagementEntity[];
      related_entity_options: ProfileManagementOption[];
    }
  | { success: false; error_message: string };

export async function load_profile_management_page_data(
  configuration: ProfileManagementConfiguration,
  authorization_filter: Record<string, string>,
  load_failed_message: string,
): Promise<ProfileManagementDataResult> {
  const profiles_result =
    await configuration.profile_use_cases.list(authorization_filter);
  if (!profiles_result.success) {
    console.error("[ProfileManagement] Profiles load failed", {
      event: PROFILE_MANAGEMENT_PAGE_EVENT.PROFILES_LOAD_FAILED,
      entity_type: configuration.normalized_entity_type,
      error: profiles_result.error,
    });
    return { success: false, error_message: load_failed_message };
  }
  const related_entities_result =
    await configuration.related_entity_use_cases.list(authorization_filter);
  if (!related_entities_result.success)
    console.warn("[ProfileManagement] Related entities unavailable", {
      event: PROFILE_MANAGEMENT_PAGE_EVENT.RELATED_ENTITIES_LOAD_FAILED,
      entity_type: configuration.normalized_entity_type,
      error: related_entities_result.error,
    });
  const related_entity_options = related_entities_result.success
    ? build_profile_management_options(
        related_entities_result.data?.items || [],
        configuration.get_related_entity_label,
      )
    : [];
  return {
    success: true,
    profiles: profiles_result.data?.items || [],
    related_entity_options,
  };
}
