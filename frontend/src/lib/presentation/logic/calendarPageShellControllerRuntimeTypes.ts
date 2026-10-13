import type { ActivityCategory } from "$lib/core/entities/ActivityCategory";
import type { Competition } from "$lib/core/entities/Competition";
import type { Organization } from "$lib/core/entities/Organization";
import type { Team } from "$lib/core/entities/Team";
import type { CalendarEvent } from "$lib/core/interfaces/ports/internal/usecases/ActivityUseCasesPort";
import type { CalendarProfileState } from "$lib/presentation/logic/calendarPageData";
import type { LoadingState } from "$lib/presentation/logic/calendarPageShellControllerHelpers";

import type {
  CalendarShellActivityActions,
  CalendarShellActivityContext,
} from "./calendarPageShellControllerRuntimeActivityTypes";

export interface CalendarPageShellRuntimeContext extends Omit<
  CalendarShellActivityContext,
  "get_can_user_add_activities"
> {
  get_current_auth_profile_state: () => CalendarProfileState;
  get_organizations: () => Organization[];
  get_selected_organization_name: () => string;
  get_url_org_id: () => string;
  set_error_message: (value: string) => void;
  set_filter_category_id: (value: string) => void;
  set_filter_competition_id: (value: string) => void;
  set_filter_loading: (value: boolean) => void;
  set_filter_team_id: (value: string) => void;
  set_is_using_cached_data: (value: boolean) => void;
  set_loading_state: (value: LoadingState) => void;
  set_organizations: (value: Organization[]) => void;
  set_selected_organization_id: (value: string) => void;
}

export interface CalendarShellBundle {
  teams: Team[];
  competitions: Competition[];
  categories: ActivityCategory[];
  calendar_events: CalendarEvent[];
}

export interface CalendarPageShellLoadingActions {
  clear_filters: () => Promise<void>;
  handle_filter_change: () => Promise<void>;
  handle_organization_change: () => Promise<void>;
  initialize: () => Promise<void>;
}

export type CalendarPageShellRuntime = CalendarPageShellLoadingActions &
  CalendarShellActivityActions;
