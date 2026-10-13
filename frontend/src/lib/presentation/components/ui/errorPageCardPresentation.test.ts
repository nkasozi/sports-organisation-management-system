import { describe, expect, it } from "vitest";

import { get_error_config } from "$lib/presentation/logic/errorPageState";

import {
  ERROR_PAGE_ICON,
  ERROR_PAGE_PRIMARY_ACTION_ICON,
  ERROR_PAGE_SECONDARY_ACTION,
  resolve_error_page_card_view,
  resolve_error_page_secondary_action,
} from "./errorPageCardPresentation";

const NOT_FOUND = 404;
const UNAUTHORIZED = 401;
const FORBIDDEN = 403;
const SERVER_ERROR = 500;

describe("resolve_error_page_card_view", () => {
  it("maps the not-found config to a search icon, home action and primary palette", () => {
    const view = resolve_error_page_card_view(get_error_config(NOT_FOUND));
    expect(view.icon).toBe(ERROR_PAGE_ICON.SEARCH);
    expect(view.primary_action_icon).toBe(ERROR_PAGE_PRIMARY_ACTION_ICON.HOME);
    expect(view.show_secondary_back_icon).toBe(true);
    expect(view.palette.bar).toBe("bg-primary-500");
  });

  it("maps the unauthorized config to a lock icon and sign-in action", () => {
    const view = resolve_error_page_card_view(get_error_config(UNAUTHORIZED));
    expect(view.icon).toBe(ERROR_PAGE_ICON.LOCK);
    expect(view.primary_action_icon).toBe(
      ERROR_PAGE_PRIMARY_ACTION_ICON.SIGN_IN,
    );
    expect(view.show_secondary_back_icon).toBe(false);
  });

  it("maps the forbidden config to a shield icon and the red palette", () => {
    const view = resolve_error_page_card_view(get_error_config(FORBIDDEN));
    expect(view.icon).toBe(ERROR_PAGE_ICON.SHIELD);
    expect(view.palette.bar).toBe("bg-secondary-500");
  });

  it("maps the server error config to an alert icon and retry action", () => {
    const view = resolve_error_page_card_view(get_error_config(SERVER_ERROR));
    expect(view.icon).toBe(ERROR_PAGE_ICON.ALERT);
    expect(view.primary_action_icon).toBe(ERROR_PAGE_PRIMARY_ACTION_ICON.RETRY);
  });
});

describe("resolve_error_page_secondary_action", () => {
  it.each([
    [NOT_FOUND, ERROR_PAGE_SECONDARY_ACTION.GO_BACK],
    [UNAUTHORIZED, ERROR_PAGE_SECONDARY_ACTION.GO_HOME],
    [FORBIDDEN, ERROR_PAGE_SECONDARY_ACTION.CONTACT_SUPPORT],
    [SERVER_ERROR, ERROR_PAGE_SECONDARY_ACTION.GO_HOME],
  ])("maps status %s to %s", (status, expected_action) => {
    expect(
      resolve_error_page_secondary_action(
        get_error_config(status).secondary_action_label,
      ),
    ).toBe(expected_action);
  });
});
