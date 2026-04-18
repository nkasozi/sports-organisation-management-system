import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const INITIAL_LOADING_STATE_DECLARATION =
  'let loading_state: LoadingState = "loading"';
const LEGACY_INITIAL_IDLE_STATE_DECLARATION =
  'let loading_state: LoadingState = "idle"';

function read_calendar_page_shell_controller_source(): string {
  return readFileSync(
    new URL("./CalendarPageShellController.svelte", import.meta.url),
    "utf8",
  );
}

describe("CalendarPageShellController source contract", () => {
  it("starts in the loading state before the first calendar fetch resolves", () => {
    const source = read_calendar_page_shell_controller_source();

    expect(source).toContain(INITIAL_LOADING_STATE_DECLARATION);
    expect(source).not.toContain(LEGACY_INITIAL_IDLE_STATE_DECLARATION);
  });
});
