import { describe, expect, it } from "vitest";

import {
  CONFIRMATION_MODAL_DISMISS_TRIGGER,
  should_dismiss_confirmation_modal,
} from "./confirmationModalLogic";

const ESCAPE = "Escape";
const ENTER = "Enter";

describe("should_dismiss_confirmation_modal", () => {
  it("dismisses when the backdrop itself is clicked while idle", () => {
    expect(
      should_dismiss_confirmation_modal({
        trigger: {
          kind: CONFIRMATION_MODAL_DISMISS_TRIGGER.BACKDROP_CLICK,
          target_is_backdrop: true,
        },
        is_processing: false,
      }),
    ).toBe(true);
  });

  it("does not dismiss when a click bubbles up from inside the dialog panel", () => {
    expect(
      should_dismiss_confirmation_modal({
        trigger: {
          kind: CONFIRMATION_MODAL_DISMISS_TRIGGER.BACKDROP_CLICK,
          target_is_backdrop: false,
        },
        is_processing: false,
      }),
    ).toBe(false);
  });

  it("does not dismiss on backdrop click while processing", () => {
    expect(
      should_dismiss_confirmation_modal({
        trigger: {
          kind: CONFIRMATION_MODAL_DISMISS_TRIGGER.BACKDROP_CLICK,
          target_is_backdrop: true,
        },
        is_processing: true,
      }),
    ).toBe(false);
  });

  it("dismisses on Escape while idle", () => {
    expect(
      should_dismiss_confirmation_modal({
        trigger: {
          kind: CONFIRMATION_MODAL_DISMISS_TRIGGER.KEY_PRESS,
          key: ESCAPE,
        },
        is_processing: false,
      }),
    ).toBe(true);
  });

  it("does not dismiss on Escape while processing", () => {
    expect(
      should_dismiss_confirmation_modal({
        trigger: {
          kind: CONFIRMATION_MODAL_DISMISS_TRIGGER.KEY_PRESS,
          key: ESCAPE,
        },
        is_processing: true,
      }),
    ).toBe(false);
  });

  it("does not dismiss on other keys such as Enter on the confirm button", () => {
    expect(
      should_dismiss_confirmation_modal({
        trigger: {
          kind: CONFIRMATION_MODAL_DISMISS_TRIGGER.KEY_PRESS,
          key: ENTER,
        },
        is_processing: false,
      }),
    ).toBe(false);
  });
});
