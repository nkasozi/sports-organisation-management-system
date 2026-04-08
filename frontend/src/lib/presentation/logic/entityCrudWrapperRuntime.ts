import type { BaseEntity } from "$lib/core/entities/BaseEntity";

export function create_entity_crud_wrapper_runtime(command: {
  after_save_redirect_url: string | null;
  dispatch: (event_name: string, detail: Record<string, unknown>) => void;
  entity_type: string;
  get_current_view: () => "list" | "create" | "edit";
  goto: (path: string) => Promise<unknown>;
  normalized_entity_type: string;
  set_current_entity_for_editing: (entity: BaseEntity | null) => void;
  set_current_view: (view: "list" | "create" | "edit") => void;
  set_total_entity_count: (count: number) => void;
}): {
  handle_create_requested: () => void;
  handle_edit_requested: (entity: BaseEntity) => void;
  handle_entities_batch_deleted: (entities: BaseEntity[]) => void;
  handle_entity_deleted: (entity: BaseEntity) => void;
  handle_form_cancelled: () => void;
  handle_list_count_updated: (count: number) => void;
  handle_save_completed: (entity: BaseEntity, is_new: boolean) => void;
  handle_selection_changed: (selected: BaseEntity[]) => void;
  navigate_back_to_list: () => void;
  switch_to_view: (
    view: "list" | "create" | "edit",
    entity?: BaseEntity,
  ) => void;
} {
  const switch_to_view = (
    new_view: "list" | "create" | "edit",
    entity?: BaseEntity,
  ): void => {
    console.debug("[EntityCrudWrapper] Switching view:", {
      from: command.get_current_view(),
      to: new_view,
      entity_type: command.entity_type,
    });
    command.set_current_view(new_view);
    command.set_current_entity_for_editing(
      new_view === "edit" && entity ? entity : null,
    );
    command.dispatch("view_changed", { current_view: new_view, entity });
  };
  return {
    switch_to_view,
    navigate_back_to_list: (): void => switch_to_view("list"),
    handle_create_requested: (): void => {
      console.debug(
        "[EntityCrudWrapper] Create requested for:",
        command.entity_type,
      );
      if (command.normalized_entity_type === "fixturelineup") {
        void command.goto("/fixture-lineups/create");
        return;
      }
      if (command.normalized_entity_type === "sport") {
        void command.goto("/sports/create");
        return;
      }
      switch_to_view("create");
    },
    handle_edit_requested: (entity: BaseEntity): void => {
      console.debug(
        "[EntityCrudWrapper] Edit requested for:",
        command.entity_type,
        entity.id,
      );
      switch_to_view("edit", entity);
    },
    handle_save_completed: (entity: BaseEntity, is_new: boolean): void => {
      console.debug("[EntityCrudWrapper] Save completed:", {
        entity_type: command.entity_type,
        entity_id: entity.id,
        is_new,
      });
      command.dispatch(is_new ? "entity_created" : "entity_updated", {
        entity,
      });
      if (command.after_save_redirect_url) {
        void command.goto(command.after_save_redirect_url);
        return;
      }
      switch_to_view("list");
    },
    handle_form_cancelled: (): void => {
      console.debug("[EntityCrudWrapper] Form cancelled");
      switch_to_view("list");
    },
    handle_entity_deleted: (entity: BaseEntity): void => {
      console.debug("[EntityCrudWrapper] Entity deleted:", entity.id);
      command.dispatch("entity_deleted", { entity });
    },
    handle_entities_batch_deleted: (entities: BaseEntity[]): void => {
      console.debug(
        "[EntityCrudWrapper] Entities batch deleted:",
        entities.length,
      );
      command.dispatch("entities_deleted", { entities });
    },
    handle_list_count_updated: (count: number): void => {
      command.set_total_entity_count(count);
    },
    handle_selection_changed: (selected: BaseEntity[]): void => {
      command.dispatch("selection_changed", { selected_entities: selected });
    },
  };
}
