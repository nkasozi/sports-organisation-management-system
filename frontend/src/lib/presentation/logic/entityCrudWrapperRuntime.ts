import type { BaseEntity } from "$lib/core/entities/BaseEntity";

import {
  ENTITY_CRUD_WRAPPER_VIEW,
  type EntityCrudWrapperView,
} from "./entityCrudWrapperConstants";

type EntityCrudWrapperRuntimeCommand = {
  after_save_redirect_url: string;
  dispatch: (event_name: string, detail: Record<string, unknown>) => void;
  entity_type: string;
  get_current_view: () => EntityCrudWrapperView;
  goto: (path: string) => Promise<unknown>;
  normalized_entity_type: string;
  set_current_entity_for_editing: (entity: BaseEntity | undefined) => void;
  set_current_view: (view: EntityCrudWrapperView) => void;
  set_total_entity_count: (count: number) => void;
};

type EntityCrudWrapperRuntime = {
  handle_create_requested: () => void;
  handle_edit_requested: (entity: BaseEntity) => void;
  handle_entities_batch_deleted: (entities: BaseEntity[]) => void;
  handle_entity_deleted: (entity: BaseEntity) => void;
  handle_form_cancelled: () => void;
  handle_list_count_updated: (count: number) => void;
  handle_save_completed: (entity: BaseEntity, is_new: boolean) => void;
  handle_selection_changed: (selected: BaseEntity[]) => void;
  navigate_back_to_list: () => void;
  switch_to_view: (view: EntityCrudWrapperView, entity?: BaseEntity) => void;
};

const DEDICATED_CREATE_ROUTES: ReadonlyMap<string, string> = new Map([
  ["fixturelineup", "/fixture-lineups/create"],
  ["sport", "/sports/create"],
]);

function switch_entity_crud_wrapper_view(
  command: EntityCrudWrapperRuntimeCommand,
  new_view: EntityCrudWrapperView,
  entity?: BaseEntity,
): void {
  console.debug("[EntityCrudWrapper] Switching view", {
    event: "entity_crud_wrapper_view_switched",
    from: command.get_current_view(),
    to: new_view,
    entity_type: command.entity_type,
  });
  command.set_current_view(new_view);
  command.set_current_entity_for_editing(
    new_view === ENTITY_CRUD_WRAPPER_VIEW.EDIT && entity ? entity : void 0,
  );
  command.dispatch("view_changed", { current_view: new_view, entity });
}

function handle_entity_crud_wrapper_create_requested(
  command: EntityCrudWrapperRuntimeCommand,
): void {
  console.debug("[EntityCrudWrapper] Create requested", {
    event: "entity_crud_wrapper_create_requested",
    entity_type: command.entity_type,
  });
  const dedicated_route =
    DEDICATED_CREATE_ROUTES.get(command.normalized_entity_type) ?? "";
  if (dedicated_route) {
    void command.goto(dedicated_route);
    return;
  }
  switch_entity_crud_wrapper_view(command, ENTITY_CRUD_WRAPPER_VIEW.CREATE);
}

function handle_entity_crud_wrapper_edit_requested(
  command: EntityCrudWrapperRuntimeCommand,
  entity: BaseEntity,
): void {
  console.debug("[EntityCrudWrapper] Edit requested", {
    event: "entity_crud_wrapper_edit_requested",
    entity_type: command.entity_type,
    entity_id: entity.id,
  });
  switch_entity_crud_wrapper_view(
    command,
    ENTITY_CRUD_WRAPPER_VIEW.EDIT,
    entity,
  );
}

function handle_entity_crud_wrapper_save_completed(
  command: EntityCrudWrapperRuntimeCommand,
  entity: BaseEntity,
  is_new: boolean,
): void {
  console.debug("[EntityCrudWrapper] Save completed", {
    event: "entity_crud_wrapper_save_completed",
    entity_type: command.entity_type,
    entity_id: entity.id,
    is_new,
  });
  command.dispatch(is_new ? "entity_created" : "entity_updated", { entity });
  if (command.after_save_redirect_url) {
    void command.goto(command.after_save_redirect_url);
    return;
  }
  switch_entity_crud_wrapper_view(command, ENTITY_CRUD_WRAPPER_VIEW.LIST);
}

function handle_entity_crud_wrapper_form_cancelled(
  command: EntityCrudWrapperRuntimeCommand,
): void {
  console.debug("[EntityCrudWrapper] Form cancelled", {
    event: "entity_crud_wrapper_form_cancelled",
    entity_type: command.entity_type,
  });
  switch_entity_crud_wrapper_view(command, ENTITY_CRUD_WRAPPER_VIEW.LIST);
}

function handle_entity_crud_wrapper_entity_deleted(
  command: EntityCrudWrapperRuntimeCommand,
  entity: BaseEntity,
): void {
  console.debug("[EntityCrudWrapper] Entity deleted", {
    event: "entity_crud_wrapper_entity_deleted",
    entity_type: command.entity_type,
    entity_id: entity.id,
  });
  command.dispatch("entity_deleted", { entity });
}

function handle_entity_crud_wrapper_batch_deleted(
  command: EntityCrudWrapperRuntimeCommand,
  entities: BaseEntity[],
): void {
  console.debug("[EntityCrudWrapper] Entities batch deleted", {
    event: "entity_crud_wrapper_entities_batch_deleted",
    entity_type: command.entity_type,
    deleted_count: entities.length,
  });
  command.dispatch("entities_deleted", { entities });
}

export function create_entity_crud_wrapper_runtime(
  command: EntityCrudWrapperRuntimeCommand,
): EntityCrudWrapperRuntime {
  return {
    switch_to_view: (view: EntityCrudWrapperView, entity?: BaseEntity): void =>
      switch_entity_crud_wrapper_view(command, view, entity),
    navigate_back_to_list: (): void =>
      switch_entity_crud_wrapper_view(command, ENTITY_CRUD_WRAPPER_VIEW.LIST),
    handle_create_requested: (): void =>
      handle_entity_crud_wrapper_create_requested(command),
    handle_edit_requested: (entity: BaseEntity): void =>
      handle_entity_crud_wrapper_edit_requested(command, entity),
    handle_save_completed: (entity: BaseEntity, is_new: boolean): void =>
      handle_entity_crud_wrapper_save_completed(command, entity, is_new),
    handle_form_cancelled: (): void =>
      handle_entity_crud_wrapper_form_cancelled(command),
    handle_entity_deleted: (entity: BaseEntity): void =>
      handle_entity_crud_wrapper_entity_deleted(command, entity),
    handle_entities_batch_deleted: (entities: BaseEntity[]): void =>
      handle_entity_crud_wrapper_batch_deleted(command, entities),
    handle_list_count_updated: (count: number): void =>
      command.set_total_entity_count(count),
    handle_selection_changed: (selected: BaseEntity[]): void =>
      command.dispatch("selection_changed", { selected_entities: selected }),
  };
}
