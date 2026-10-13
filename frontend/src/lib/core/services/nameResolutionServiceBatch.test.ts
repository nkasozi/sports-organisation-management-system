import { describe, expect, it } from "vitest";

import {
  type NameResolutionInput,
  resolve_multiple_names_to_ids,
} from "./nameResolutionService";
import {
  create_mock_entity,
  create_mock_use_cases,
  expect_successful_resolution,
} from "./nameResolutionService.test_support";

describe("resolve_multiple_names_to_ids", () => {
  it("should resolve multiple names in batch", async () => {
    const org_entity = create_mock_entity("org_1", "Main Organization");
    const team_entity = create_mock_entity("team_1", "First Team");

    const org_use_cases = create_mock_use_cases({
      success: true,
      data: [org_entity],
    });
    const team_use_cases = create_mock_use_cases({
      success: true,
      data: [team_entity],
    });

    const requests = [
      {
        entity_name: "Main Organization",
        entity_type: "organization",
        use_cases: org_use_cases,
      },
      {
        entity_name: "First Team",
        entity_type: "team",
        use_cases: team_use_cases,
      },
    ] as NameResolutionInput[];

    const results = await resolve_multiple_names_to_ids(requests);
    const organization_result = results.get("organization:Main Organization");
    const team_result = results.get("team:First Team");

    expect(results.size).toBe(2);
    expect(organization_result).toBeDefined();
    expect(team_result).toBeDefined();

    if (!organization_result || !team_result) {
      expect(organization_result).toBeDefined();
      expect(team_result).toBeDefined();
      return;
    }

    expect_successful_resolution(organization_result, "org_1");
    expect_successful_resolution(team_result, "team_1");
  });

  it("should include failures in batch results", async () => {
    const org_entity = create_mock_entity("org_1", "Found Org");
    const org_use_cases = create_mock_use_cases({
      success: true,
      data: [org_entity],
    });
    const team_use_cases = create_mock_use_cases({
      success: true,
      data: [],
    });

    const requests = [
      {
        entity_name: "Found Org",
        entity_type: "organization",
        use_cases: org_use_cases,
      },
      {
        entity_name: "Missing Team",
        entity_type: "team",
        use_cases: team_use_cases,
      },
    ] as NameResolutionInput[];

    const results = await resolve_multiple_names_to_ids(requests);

    expect(results.get("organization:Found Org")?.success).toBe(true);
    expect(results.get("team:Missing Team")?.success).toBe(false);
  });
});
