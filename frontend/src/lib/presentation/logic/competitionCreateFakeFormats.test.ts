import { describe, expect, it } from "vitest";

import type { CompetitionFormat } from "$lib/core/entities/CompetitionFormat";
import { FORMAT_TYPE } from "$lib/core/entities/StatusConstants";

import { select_fake_friendly_formats } from "./competitionCreateFakeFormats";

function format(id: string, format_type: string): CompetitionFormat {
  return { id, name: id, format_type } as unknown as CompetitionFormat;
}

describe("fake competitions use a format that suits any team count", () => {
  it("prefers league and round robin formats", () => {
    const formats = [
      format("world_cup", FORMAT_TYPE.GROUPS_KNOCKOUT),
      format("league", FORMAT_TYPE.LEAGUE),
      format("cup", FORMAT_TYPE.STRAIGHT_KNOCKOUT),
      format("round_robin", FORMAT_TYPE.ROUND_ROBIN),
    ];
    expect(select_fake_friendly_formats(formats).map((f) => f.id)).toEqual([
      "league",
      "round_robin",
    ]);
  });

  it("falls back to every format when none is a league", () => {
    const formats = [format("cup", FORMAT_TYPE.STRAIGHT_KNOCKOUT)];
    expect(select_fake_friendly_formats(formats)).toEqual(formats);
  });
});
