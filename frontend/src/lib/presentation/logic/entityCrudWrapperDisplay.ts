import { ENTITY_CRUD_WRAPPER_VIEW } from "./entityCrudWrapperConstants";
import { format_entity_display_name } from "./entityDisplayFormatter";

export function build_page_title_for_current_view(
  view: string,
  type?: string,
): string {
  const type_display = format_entity_display_name(type || "");
  switch (view) {
    case ENTITY_CRUD_WRAPPER_VIEW.CREATE:
      return `Create New ${type_display}`;
    case ENTITY_CRUD_WRAPPER_VIEW.EDIT:
      return `Edit ${type_display}`;
    default:
      return `${type_display} Management`;
  }
}
