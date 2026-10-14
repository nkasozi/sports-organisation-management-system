import { describe, expect, it } from "vitest";

import {
  plan_transfer_form_submission,
  TRANSFER_FORM_PLAN,
} from "./dynamicEntityFormTransferPlan";

const TRANSFER_ENTITY = "playerteamtransferhistory";

const STORED_TRANSFER = {
  id: "t1",
  player_id: "player-1",
  from_team_id: "team-a",
  to_team_id: "team-b",
};

function plan_resolved_edit(
  status: string,
  form_changes: Record<string, unknown>,
): ReturnType<typeof plan_transfer_form_submission> {
  return plan_transfer_form_submission({
    entity_type: TRANSFER_ENTITY,
    is_edit_mode: true,
    entity_data: { ...STORED_TRANSFER, status } as never,
    form_data: { ...STORED_TRANSFER, status, ...form_changes },
  });
}

describe("plan_transfer_form_submission for resolved transfers", () => {
  it.each([
    ["approved", "player_id"],
    ["approved", "from_team_id"],
    ["declined", "to_team_id"],
  ])("blocks changing %s transfer field %s", (status, field_name) => {
    const plan = plan_resolved_edit(status, { [field_name]: "changed" });
    expect(plan.kind).toBe(TRANSFER_FORM_PLAN.BLOCKED);
  });

  it("allows changing notes on an approved transfer", () => {
    expect(plan_resolved_edit("approved", { notes: "fee paid" })).toEqual({
      kind: TRANSFER_FORM_PLAN.SAVE_ONLY,
    });
  });

  it("allows changing the parties of a pending transfer", () => {
    expect(plan_resolved_edit("pending", { player_id: "player-2" })).toEqual({
      kind: TRANSFER_FORM_PLAN.SAVE_ONLY,
    });
  });
});
