import { describe, expect, it } from "vitest";

import { TransferResolution } from "$lib/core/usecases/TransferResolutionStateMachine";

import {
  build_transfer_form_data_for_save,
  plan_transfer_form_submission,
  TRANSFER_FORM_PLAN,
} from "./dynamicEntityFormTransferPlan";

const TRANSFER_ENTITY = "playerteamtransferhistory";

function plan_edit(previous_status: string, next_status: string): unknown {
  return plan_transfer_form_submission({
    entity_type: TRANSFER_ENTITY,
    is_edit_mode: true,
    entity_data: { id: "t1", status: previous_status } as never,
    form_data: { status: next_status },
  });
}

describe("plan_transfer_form_submission", () => {
  it("ignores entities that are not transfers", () => {
    expect(
      plan_transfer_form_submission({
        entity_type: "team",
        is_edit_mode: true,
        entity_data: { id: "x" } as never,
        form_data: { status: "approved" },
      }),
    ).toEqual({ kind: TRANSFER_FORM_PLAN.SAVE_ONLY });
  });

  it("saves other edits when the status does not change", () => {
    expect(plan_edit("approved", "approved")).toEqual({
      kind: TRANSFER_FORM_PLAN.SAVE_ONLY,
    });
  });

  it.each([
    ["approved", TransferResolution.CONFIRM],
    ["declined", TransferResolution.REJECT],
  ])(
    "routes pending to %s through the transfer resolution",
    (status, resolution) => {
      expect(plan_edit("pending", status)).toEqual({
        kind: TRANSFER_FORM_PLAN.SAVE_THEN_RESOLVE,
        resolution,
      });
    },
  );

  it.each([
    ["declined", "approved"],
    ["approved", "declined"],
    ["approved", "pending"],
    ["declined", "pending"],
  ])("blocks moving a %s transfer to %s", (previous_status, next_status) => {
    const plan = plan_edit(previous_status, next_status) as {
      kind: string;
      reason: string;
    };
    expect(plan.kind).toBe(TRANSFER_FORM_PLAN.BLOCKED);
    expect(plan.reason.length).toBeGreaterThan(0);
  });

  it.each(["approved", "declined"])(
    "blocks creating a transfer that is already %s",
    (status) => {
      const plan = plan_transfer_form_submission({
        entity_type: TRANSFER_ENTITY,
        is_edit_mode: false,
        entity_data: {} as never,
        form_data: { status },
      });
      expect(plan.kind).toBe(TRANSFER_FORM_PLAN.BLOCKED);
    },
  );

  it("allows creating a pending transfer", () => {
    expect(
      plan_transfer_form_submission({
        entity_type: TRANSFER_ENTITY,
        is_edit_mode: false,
        entity_data: {} as never,
        form_data: { status: "pending" },
      }),
    ).toEqual({ kind: TRANSFER_FORM_PLAN.SAVE_ONLY });
  });
});

describe("plan_transfer_form_submission with missing statuses", () => {
  it("saves normally when the form does not set a status", () => {
    expect(
      plan_transfer_form_submission({
        entity_type: TRANSFER_ENTITY,
        is_edit_mode: false,
        entity_data: {} as never,
        form_data: {},
      }),
    ).toEqual({ kind: TRANSFER_FORM_PLAN.SAVE_ONLY });
  });

  it("treats a stored transfer without a status as pending", () => {
    expect(
      plan_transfer_form_submission({
        entity_type: TRANSFER_ENTITY,
        is_edit_mode: true,
        entity_data: { id: "t1" } as never,
        form_data: { status: "approved" },
      }),
    ).toEqual({
      kind: TRANSFER_FORM_PLAN.SAVE_THEN_RESOLVE,
      resolution: TransferResolution.CONFIRM,
    });
  });

  it("blocks statuses it does not recognise", () => {
    expect(plan_edit("pending", "teleported")).toMatchObject({
      kind: TRANSFER_FORM_PLAN.BLOCKED,
    });
  });
});

describe("build_transfer_form_data_for_save", () => {
  it("keeps the transfer pending until the resolution use case runs", () => {
    expect(
      build_transfer_form_data_for_save(
        { status: "approved", notes: "ok" },
        {
          kind: TRANSFER_FORM_PLAN.SAVE_THEN_RESOLVE,
          resolution: TransferResolution.CONFIRM,
        },
      ),
    ).toEqual({ status: "pending", notes: "ok" });
  });

  it("leaves form data untouched for plain saves", () => {
    const form_data = { status: "approved" };
    expect(
      build_transfer_form_data_for_save(form_data, {
        kind: TRANSFER_FORM_PLAN.SAVE_ONLY,
      }),
    ).toBe(form_data);
  });
});
