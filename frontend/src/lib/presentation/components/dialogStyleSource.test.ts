import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const component_sources = import.meta.glob("./**/*.svelte", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const DIALOG_MARKERS = ['role="dialog"', 'role="alertdialog"', "aria-modal"];
const OFF_STANDARD_RADIUS_PATTERN =
  /(?<![\w-])(?:[a-z-]+:)*rounded(?:-(?:t|b|l|r|tl|tr|bl|br))?(?:-(?:sm|md|lg|xl|2xl|3xl))?(?![\w[-])/g;
const BROWN_SHADES = ["#b45309", "#92400e", "#78350f", "#451a03"];
const DARK_BROWN_FILL_PATTERN =
  /dark:(?:[a-z-]+:)*bg-(?:amber|yellow|orange)-(?:800|900|950)/;

function find_dialog_sources(): Array<[string, string]> {
  return Object.entries(component_sources).filter(([, source]) =>
    DIALOG_MARKERS.some((marker) => source.includes(marker)),
  );
}

describe("dialogs share one look", () => {
  it("finds the app's dialogs", () => {
    expect(find_dialog_sources().length).toBeGreaterThan(15);
  });

  it("round every dialog panel, box and button by the same 0.175rem", () => {
    const off_standard = find_dialog_sources().flatMap(([path, source]) =>
      (source.match(OFF_STANDARD_RADIUS_PATTERN) ?? []).map(
        (found) => `${path}: ${found}`,
      ),
    );
    expect(off_standard).toEqual([]);
  });
});

describe("the brown palette stays gone", () => {
  it("never uses amber for the primary colour", () => {
    const config = readFileSync(
      new URL("../../../../tailwind.config.js", import.meta.url),
      "utf8",
    );
    for (const shade of BROWN_SHADES) expect(config).not.toContain(shade);
  });

  it("never fills a surface with dark amber, yellow or orange", () => {
    const brown_fills = Object.entries(component_sources)
      .filter(([, source]) => DARK_BROWN_FILL_PATTERN.test(source))
      .map(([path]) => path);
    expect(brown_fills).toEqual([]);
  });
});
