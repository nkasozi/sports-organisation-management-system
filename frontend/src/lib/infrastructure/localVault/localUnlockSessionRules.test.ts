import { describe, expect, it } from "vitest";

import {
  can_resume_local_unlock_session,
  has_been_away_too_long,
  mark_local_unlock_session_seen,
} from "./localUnlockSessionRules";

const MINUTE = 60 * 1000;
const UNLOCKED_AT = 1_000_000;
const FRESH_TIMES = {
  last_seen_at: UNLOCKED_AT,
  last_in_sight_at: UNLOCKED_AT,
};

describe("when an unlock may be picked up", () => {
  it("picks it up on a refresh or a new tab while the app is open and in use", () => {
    expect(
      can_resume_local_unlock_session(FRESH_TIMES, UNLOCKED_AT + 10 * 1000),
    ).toBe(true);
  });

  it("picks it up right up to the closed limit", () => {
    expect(
      can_resume_local_unlock_session(FRESH_TIMES, UNLOCKED_AT + 5 * MINUTE),
    ).toBe(true);
  });

  it("asks again once the app has been closed for more than five minutes", () => {
    expect(
      can_resume_local_unlock_session(FRESH_TIMES, UNLOCKED_AT + 6 * MINUTE),
    ).toBe(false);
  });

  it("asks again after half an hour with the app open but out of sight", () => {
    const hidden_since_unlock = mark_local_unlock_session_seen(
      FRESH_TIMES,
      UNLOCKED_AT + 31 * MINUTE,
      false,
    );

    expect(
      can_resume_local_unlock_session(
        hidden_since_unlock,
        UNLOCKED_AT + 31 * MINUTE,
      ),
    ).toBe(false);
  });

  it("keeps the session for a tab that stayed in sight", () => {
    const in_sight = mark_local_unlock_session_seen(
      FRESH_TIMES,
      UNLOCKED_AT + 45 * MINUTE,
      true,
    );

    expect(
      can_resume_local_unlock_session(in_sight, UNLOCKED_AT + 46 * MINUTE),
    ).toBe(true);
  });
});

describe("how long the app has been away", () => {
  it("is not too long at exactly thirty minutes", () => {
    expect(has_been_away_too_long(FRESH_TIMES, UNLOCKED_AT + 30 * MINUTE)).toBe(
      false,
    );
  });

  it("is too long after thirty minutes out of sight", () => {
    expect(has_been_away_too_long(FRESH_TIMES, UNLOCKED_AT + 31 * MINUTE)).toBe(
      true,
    );
  });
});

describe("a heartbeat", () => {
  it("notes the tab as open and in sight when it is visible", () => {
    expect(
      mark_local_unlock_session_seen(FRESH_TIMES, UNLOCKED_AT + MINUTE, true),
    ).toEqual({
      last_seen_at: UNLOCKED_AT + MINUTE,
      last_in_sight_at: UNLOCKED_AT + MINUTE,
    });
  });

  it("notes only that the tab is open when it is hidden", () => {
    expect(
      mark_local_unlock_session_seen(FRESH_TIMES, UNLOCKED_AT + MINUTE, false),
    ).toEqual({
      last_seen_at: UNLOCKED_AT + MINUTE,
      last_in_sight_at: UNLOCKED_AT,
    });
  });

  it("never moves the times backwards", () => {
    expect(
      mark_local_unlock_session_seen(FRESH_TIMES, UNLOCKED_AT - MINUTE, true),
    ).toEqual(FRESH_TIMES);
  });
});
