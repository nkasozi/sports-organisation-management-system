import { describe, expect, it } from "vitest";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import {
  build_csv_content,
  build_csv_filename,
  create_present_csv_metadata_state,
} from "./dynamicListLogic";
import {
  create_test_entity,
  create_test_entity_metadata,
  create_test_field_metadata,
} from "./dynamicListLogic.test_support";

describe("build_csv_content", () => {
  const metadata = create_test_entity_metadata([
    create_test_field_metadata("name", "text", { display_name: "Name" }),
    create_test_field_metadata("status", "text", { display_name: "Status" }),
  ]);

  it("should return empty string for empty entities", () => {
    const result = build_csv_content(
      [],
      ["name"],
      create_present_csv_metadata_state(metadata),
      {},
    );
    expect(result).toBe("");
  });

  it("should return empty string for empty column list", () => {
    const entities = [create_test_entity("1", "Test")];
    const result = build_csv_content(
      entities,
      [],
      create_present_csv_metadata_state(metadata),
      {},
    );
    expect(result).toBe("");
  });

  it("should build CSV with headers from metadata display names", () => {
    const entities = [create_test_entity("1", "Entity A", "active")];
    const result = build_csv_content(
      entities,
      ["name", "status"],
      create_present_csv_metadata_state(metadata),
      {},
    );
    const lines = result.split("\n");
    expect(lines[0]).toBe("Name,Status");
  });

  it("should build CSV with properly escaped values", () => {
    const entities = [
      {
        id: "1",
        name: 'Value with "quotes"',
        status: "active",
      } as unknown as BaseEntity,
    ];
    const result = build_csv_content(
      entities,
      ["name", "status"],
      create_present_csv_metadata_state(metadata),
      {},
    );
    const lines = result.split("\n");
    expect(lines[1]).toContain('""');
  });

  it("should handle multiple rows", () => {
    const entities = [
      create_test_entity("1", "A", "active"),
      create_test_entity("2", "B", "inactive"),
    ];
    const result = build_csv_content(
      entities,
      ["name", "status"],
      create_present_csv_metadata_state(metadata),
      {},
    );
    const lines = result.split("\n");
    expect(lines).toHaveLength(3);
  });
});

describe("build_csv_filename", () => {
  it("should build filename with entity type and date", () => {
    const date = new Date("2024-06-15T12:00:00Z");
    const result = build_csv_filename("teams", date);
    expect(result).toBe("teams_export_2024-06-15.csv");
  });

  it("should handle different entity types", () => {
    const date = new Date("2024-01-01");
    const result = build_csv_filename("player_positions", date);
    expect(result).toContain("player_positions_export_");
  });
});
