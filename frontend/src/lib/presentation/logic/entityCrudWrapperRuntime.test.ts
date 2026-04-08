import { describe, expect, it, vi } from "vitest";

import { create_entity_crud_wrapper_runtime } from "./entityCrudWrapperRuntime";

describe("entityCrudWrapperRuntime", () => {
  function create_command(
    overrides?: Partial<
      Parameters<typeof create_entity_crud_wrapper_runtime>[0]
    >,
  ) {
    return {
      after_save_redirect_url: null,
      dispatch: vi.fn(),
      entity_type: "Fixture Lineup",
      get_current_view: vi.fn(() => "list" as const),
      goto: vi.fn(async () => undefined),
      normalized_entity_type: "fixturelineup",
      set_current_entity_for_editing: vi.fn(),
      set_current_view: vi.fn(),
      set_total_entity_count: vi.fn(),
      ...overrides,
    };
  }

  it("navigates special create flows and switches views for normal entities", () => {
    const lineup_command = create_command();
    create_entity_crud_wrapper_runtime(
      lineup_command,
    ).handle_create_requested();
    expect(lineup_command.goto).toHaveBeenCalledWith("/fixture-lineups/create");

    const sport_command = create_command({ normalized_entity_type: "sport" });
    create_entity_crud_wrapper_runtime(sport_command).handle_create_requested();
    expect(sport_command.goto).toHaveBeenCalledWith("/sports/create");

    const team_command = create_command({ normalized_entity_type: "team" });
    create_entity_crud_wrapper_runtime(team_command).handle_create_requested();
    expect(team_command.set_current_view).toHaveBeenCalledWith("create");
    expect(team_command.dispatch).toHaveBeenCalledWith("view_changed", {
      current_view: "create",
      entity: undefined,
    });
  });

  it("tracks edit, delete, selection, and list-count events", () => {
    const command = create_command();
    const runtime = create_entity_crud_wrapper_runtime(command);
    const entity = { id: "entity-1" } as never;
    const selected_entities = [{ id: "entity-2" }, { id: "entity-3" }] as never;

    runtime.handle_edit_requested(entity);
    runtime.handle_entity_deleted(entity);
    runtime.handle_entities_batch_deleted(selected_entities);
    runtime.handle_list_count_updated(24);
    runtime.handle_selection_changed(selected_entities);

    expect(command.set_current_view).toHaveBeenCalledWith("edit");
    expect(command.set_current_entity_for_editing).toHaveBeenCalledWith(entity);
    expect(command.dispatch).toHaveBeenCalledWith("entity_deleted", { entity });
    expect(command.dispatch).toHaveBeenCalledWith("entities_deleted", {
      entities: selected_entities,
    });
    expect(command.set_total_entity_count).toHaveBeenCalledWith(24);
    expect(command.dispatch).toHaveBeenCalledWith("selection_changed", {
      selected_entities,
    });
  });

  it("dispatches save events and returns to the list or redirect target", () => {
    const list_command = create_command({ normalized_entity_type: "team" });
    const list_runtime = create_entity_crud_wrapper_runtime(list_command);
    const saved_entity = { id: "entity-1" } as never;

    list_runtime.handle_save_completed(saved_entity, true);
    list_runtime.handle_form_cancelled();
    list_runtime.navigate_back_to_list();

    expect(list_command.dispatch).toHaveBeenCalledWith("entity_created", {
      entity: saved_entity,
    });
    expect(list_command.set_current_view).toHaveBeenCalledWith("list");

    const redirect_command = create_command({
      after_save_redirect_url: "/teams",
      normalized_entity_type: "team",
    });
    create_entity_crud_wrapper_runtime(redirect_command).handle_save_completed(
      saved_entity,
      false,
    );
    expect(redirect_command.dispatch).toHaveBeenCalledWith("entity_updated", {
      entity: saved_entity,
    });
    expect(redirect_command.goto).toHaveBeenCalledWith("/teams");
  });
});
