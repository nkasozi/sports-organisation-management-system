import type {
  FixtureLineup,
  UpdateFixtureLineupInput,
} from "$lib/core/entities/FixtureLineup";
import type {
  AuthorizationPort,
  DataAction,
} from "$lib/core/interfaces/ports/external/iam/AuthorizationPort";
import { build_fixture_lineup_permission_info_message } from "$lib/presentation/logic/fixtureLineupDetailPageState";

type UpdateLineup = (
  lineup_id: string,
  update_data: UpdateFixtureLineupInput,
) => Promise<{ success: boolean; error?: string }>;
type SubmitLineup = (
  lineup_id: string,
) => Promise<{ success: boolean; error?: string }>;

export async function authorize_fixture_lineup_detail_page(
  authorization_adapter: AuthorizationPort,
  raw_token: string,
  entity_type: string,
  read_action: DataAction,
  update_action: DataAction,
  access_check_failed_message: string,
): Promise<
  | {
      success: true;
      can_modify_lineup: boolean;
      permission_info_message: string;
      is_read_authorized: boolean;
    }
  | { success: false; error_message: string }
> {
  const read_authorization_result =
    await authorization_adapter.check_entity_authorized(
      raw_token,
      entity_type,
      read_action,
    );
  if (!read_authorization_result.success)
    return { success: false, error_message: access_check_failed_message };
  const update_authorization_result =
    await authorization_adapter.check_entity_authorized(
      raw_token,
      entity_type,
      update_action,
    );
  return {
    success: true,
    can_modify_lineup:
      update_authorization_result.success &&
      update_authorization_result.data.is_authorized,
    permission_info_message:
      update_authorization_result.success &&
      !update_authorization_result.data.is_authorized
        ? build_fixture_lineup_permission_info_message(
            update_authorization_result.data.role,
          )
        : "",
    is_read_authorized: read_authorization_result.data.is_authorized,
  };
}

export async function save_fixture_lineup_changes(
  lineup_id: string,
  lineup: FixtureLineup,
  update_lineup: UpdateLineup,
  update_failed_message: string,
): Promise<{ success: true } | { success: false; error_message: string }> {
  const result = await update_lineup(lineup_id, {
    selected_players: lineup.selected_players,
    notes: lineup.notes,
  });
  return result.success
    ? { success: true }
    : { success: false, error_message: result.error || update_failed_message };
}

export async function submit_fixture_lineup_changes(
  lineup_id: string,
  submit_lineup: SubmitLineup,
  submit_failed_message: string,
): Promise<{ success: true } | { success: false; error_message: string }> {
  const result = await submit_lineup(lineup_id);
  return result.success
    ? { success: true }
    : { success: false, error_message: result.error || submit_failed_message };
}
