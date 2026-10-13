import { describe, expect, it } from "vitest";

import {
  TRANSFER_STATUS,
  type TransferStatusValue,
} from "../entities/StatusConstants";
import {
  decide_transfer_resolution,
  TransferResolution,
  TransferResolutionOutcome,
  type TransferResolutionValue,
} from "./TransferResolutionStateMachine";

describe("decide_transfer_resolution", () => {
  it.each<[TransferResolutionValue, TransferStatusValue]>([
    [TransferResolution.CONFIRM, TRANSFER_STATUS.APPROVED],
    [TransferResolution.REJECT, TRANSFER_STATUS.DECLINED],
  ])("allows %s of a pending transfer", (resolution, next_status) => {
    expect(
      decide_transfer_resolution(TRANSFER_STATUS.PENDING, resolution),
    ).toEqual({ outcome: TransferResolutionOutcome.ALLOWED, next_status });
  });

  it.each<[TransferResolutionValue, TransferStatusValue, string]>([
    [
      TransferResolution.CONFIRM,
      TRANSFER_STATUS.APPROVED,
      "Transfer cannot be confirmed. Current status: approved",
    ],
    [
      TransferResolution.CONFIRM,
      TRANSFER_STATUS.DECLINED,
      "Transfer cannot be confirmed. Current status: declined",
    ],
    [
      TransferResolution.REJECT,
      TRANSFER_STATUS.APPROVED,
      "Transfer cannot be rejected. Current status: approved",
    ],
    [
      TransferResolution.REJECT,
      TRANSFER_STATUS.DECLINED,
      "Transfer cannot be rejected. Current status: declined",
    ],
  ])("rejects %s of a %s transfer", (resolution, status, reason) => {
    expect(decide_transfer_resolution(status, resolution)).toEqual({
      outcome: TransferResolutionOutcome.REJECTED,
      reason,
    });
  });
});
