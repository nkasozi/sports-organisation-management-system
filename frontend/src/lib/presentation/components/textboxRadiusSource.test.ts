import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const TEXTBOX_RADIUS_DECLARATION = "border-radius: 0.175rem;";
const LEGACY_INPUT_RADIUS_CLASS_PATTERN =
  /<(?:input|textarea)(?:.|\n){0,220}?\brounded-(?:md|lg|xl)\b/;
const SHARED_INPUT_CLASS_PATTERN =
  /\.input\s*\{[\s\S]*?border-radius:\s*0\.175rem;/;

const SOURCE_FILES = [
  "./ui/FormField.svelte",
  "./calendar/CalendarActivityFormFields.svelte",
  "./calendar/CalendarSubscriptionFeedCard.svelte",
  "./dynamicEntityList/DynamicEntityListAdvancedFilters.svelte",
  "./dynamicForm/DynamicFormFileField.svelte",
] as const;

function read_component_source(relative_path: string): string {
  return readFileSync(new URL(relative_path, import.meta.url), "utf8");
}

function read_shared_style_source(): string {
  return readFileSync(
    new URL("../../../styles/app-base.css", import.meta.url),
    "utf8",
  );
}

describe("textbox radius source contract", () => {
  it("uses the shared 0.175rem radius for the input utility", () => {
    const source = read_shared_style_source();

    expect(source).toContain(TEXTBOX_RADIUS_DECLARATION);
    expect(source).toMatch(SHARED_INPUT_CLASS_PATTERN);
  });

  it("does not leave legacy rounded textbox classes in inline input or textarea markup", () => {
    for (const source_file of SOURCE_FILES) {
      const source = read_component_source(source_file);

      expect(source).not.toMatch(LEGACY_INPUT_RADIUS_CLASS_PATTERN);
    }
  });
});
