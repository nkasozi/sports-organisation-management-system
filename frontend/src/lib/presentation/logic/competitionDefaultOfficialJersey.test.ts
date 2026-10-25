import { describe, expect, it, type Mock, vi } from "vitest";

import {
  assign_default_official_jersey,
  type DefaultOfficialJerseyUseCases,
} from "./competitionDefaultOfficialJersey";

const STANDARD_GRAY = {
  id: "jersey_1",
  holder_type: "competition_official",
  holder_id: "competition_old",
  nickname: "Standard Gray",
  main_color: "#6B7280",
  secondary_color: "#FFFFFF",
  tertiary_color: "",
  status: "active",
};

function jersey_use_cases(items: unknown[]): DefaultOfficialJerseyUseCases & {
  list: Mock;
  create: Mock;
} {
  return {
    list: vi.fn().mockResolvedValue({ success: true, data: { items } }),
    create: vi.fn().mockResolvedValue({ success: true, data: {} }),
  };
}

describe("new competitions get the first officials' jersey", () => {
  it("copies the first official jersey onto the new competition", async () => {
    const use_cases = jersey_use_cases([STANDARD_GRAY]);
    expect(
      await assign_default_official_jersey("competition_new", use_cases),
    ).toBe(true);
    expect(use_cases.list).toHaveBeenCalledWith(
      { holder_type: "competition_official" },
      expect.anything(),
    );
    expect(use_cases.create).toHaveBeenCalledWith({
      holder_type: "competition_official",
      holder_id: "competition_new",
      nickname: "Standard Gray",
      main_color: "#6B7280",
      secondary_color: "#FFFFFF",
      tertiary_color: "",
      status: "active",
    });
  });

  it("prefers the earliest standard officials' kit over alternates", async () => {
    const use_cases = jersey_use_cases([
      {
        ...STANDARD_GRAY,
        id: "j_green",
        nickname: "Alternate Green",
        created_at: "2026-01-01",
      },
      {
        ...STANDARD_GRAY,
        id: "j_gray",
        nickname: "Standard Gray",
        created_at: "2026-01-02",
      },
      {
        ...STANDARD_GRAY,
        id: "j_black",
        nickname: "Standard Black",
        main_color: "#1F2937",
        created_at: "2026-01-02",
      },
    ]);
    await assign_default_official_jersey("competition_new", use_cases);
    expect(use_cases.create).toHaveBeenCalledWith(
      expect.objectContaining({
        nickname: "Standard Black",
        main_color: "#1F2937",
      }),
    );
  });

  it("does nothing when there is no official jersey yet", async () => {
    const use_cases = jersey_use_cases([]);
    expect(
      await assign_default_official_jersey("competition_new", use_cases),
    ).toBe(false);
    expect(use_cases.create).not.toHaveBeenCalled();
  });

  it("does nothing when the competition already has one", async () => {
    const use_cases = jersey_use_cases([
      { ...STANDARD_GRAY, holder_id: "competition_new" },
    ]);
    expect(
      await assign_default_official_jersey("competition_new", use_cases),
    ).toBe(false);
    expect(use_cases.create).not.toHaveBeenCalled();
  });
});
