import { describe, expect, it } from "vitest";

import {
  check_if_all_entities_selected,
  check_if_some_entities_selected,
  determine_if_bulk_actions_available,
  get_selected_entities_from_list,
  toggle_select_all_entities,
  toggle_single_entity_selection,
} from "./listSelectionLogic";

const entities = [{ id: "entity_1" }, { id: "entity_2" }] as never[];

describe("listSelectionLogic", () => {
  it("detects full and partial selections", () => {
    expect(
      check_if_all_entities_selected(
        entities,
        new Set(["entity_1", "entity_2"]),
      ),
    ).toBe(true);
    expect(
      check_if_all_entities_selected(entities, new Set(["entity_1"])),
    ).toBe(false);
    expect(check_if_some_entities_selected(new Set(["entity_1"]))).toBe(true);
    expect(check_if_some_entities_selected(null)).toBe(false);
  });

  it("toggles selections and derives selected entities", () => {
    expect(determine_if_bulk_actions_available(true, true)).toBe(true);
    expect(toggle_select_all_entities(entities, false)).toEqual(
      new Set(["entity_1", "entity_2"]),
    );
    expect(toggle_select_all_entities(entities, true)).toEqual(new Set());
    expect(
      toggle_single_entity_selection(new Set(["entity_1"]), "entity_2"),
    ).toEqual(new Set(["entity_1", "entity_2"]));
    expect(
      get_selected_entities_from_list(entities, new Set(["entity_2"])),
    ).toEqual([entities[1]]);
  });
});
