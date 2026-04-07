import {
  build_profile_management_options,
  type ProfileManagementConfiguration,
  type ProfileManagementEntity,
  type ProfileManagementOption,
} from "$lib/presentation/logic/profileManagementPageState";

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
  if (!profiles_result.success)
    return {
      success: false,
      error_message: profiles_result.error || load_failed_message,
    };
  const related_entities_result =
    await configuration.related_entity_use_cases.list(authorization_filter);
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
