import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { build_competition_format_not_found_by_code_error } from "../interfaces/ports";
import { create_failure_result, create_success_result } from "../types/Result";
import {
  ensure_format_code_available,
  FORMAT_CODE_CLAIMANT_KIND,
} from "./CompetitionFormatCodeAvailability";

function repository_with(lookup: unknown): never {
  return { find_by_code: vi.fn().mockResolvedValue(lookup) } as never;
}

describe("ensure_format_code_available", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("accepts an unused code for a new format", async () => {
    const result = await ensure_format_code_available(
      repository_with(
        create_failure_result(
          build_competition_format_not_found_by_code_error("LG"),
        ),
      ),
      "LG",
      { kind: FORMAT_CODE_CLAIMANT_KIND.NEW_FORMAT },
    );

    expect(result).toEqual(create_success_result("LG"));
  });

  it("lets a format keep its own code", async () => {
    const result = await ensure_format_code_available(
      repository_with(create_success_result({ id: "format-1" })),
      "LG",
      {
        kind: FORMAT_CODE_CLAIMANT_KIND.EXISTING_FORMAT,
        format_id: "format-1",
      },
    );

    expect(result.success).toBe(true);
  });

  it("rejects a code owned by another format", async () => {
    const result = await ensure_format_code_available(
      repository_with(create_success_result({ id: "format-2" })),
      "LG",
      {
        kind: FORMAT_CODE_CLAIMANT_KIND.EXISTING_FORMAT,
        format_id: "format-1",
      },
    );

    expect(result).toEqual(
      create_failure_result("Format with code 'LG' already exists"),
    );
  });

  it("relays unexpected lookup failures", async () => {
    const result = await ensure_format_code_available(
      repository_with(create_failure_result("offline")),
      "LG",
      { kind: FORMAT_CODE_CLAIMANT_KIND.NEW_FORMAT },
    );

    expect(result).toEqual(create_failure_result("offline"));
  });
});
