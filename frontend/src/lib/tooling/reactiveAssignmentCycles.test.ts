import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { find_reactive_assignment_cycles } from "./reactiveAssignmentCycles";

const SOURCE_ROOT = new URL("../../", import.meta.url).pathname;
const SVELTE_EXTENSION = ".svelte";

function collect_svelte_files(directory: string): string[] {
  return readdirSync(directory).flatMap((entry_name: string): string[] => {
    const entry_path = join(directory, entry_name);
    if (statSync(entry_path).isDirectory()) {
      return collect_svelte_files(entry_path);
    }
    return entry_path.endsWith(SVELTE_EXTENSION) ? [entry_path] : [];
  });
}

function build_component_source(script_lines: string[]): string {
  return ["<script>", ...script_lines, "</script>"].join("\n");
}

describe("find_reactive_assignment_cycles", () => {
  it("flags two reactive statements that write each other's source", () => {
    const source = build_component_source([
      "  let a = {};",
      "  $: a = b ?? a;",
      "  $: b = a;",
    ]);

    expect(find_reactive_assignment_cycles(source)).toEqual([
      {
        first_line_number: 3,
        first_target: "a",
        second_line_number: 4,
        second_target: "b",
      },
    ]);
  });

  it("flags a local mirror of a bound prop member", () => {
    const source = build_component_source([
      "  let local_overrides = {};",
      "  $: local_overrides =",
      "    form_data.rule_overrides ?? local_overrides;",
      "  $: form_data.rule_overrides = local_overrides;",
    ]);

    expect(find_reactive_assignment_cycles(source)).toEqual([
      {
        first_line_number: 3,
        first_target: "local_overrides",
        second_line_number: 5,
        second_target: "form_data.rule_overrides",
      },
    ]);
  });

  it("allows one-directional reactive chains", () => {
    const source = build_component_source([
      "  $: doubled = count * 2;",
      "  $: label = `${doubled}`;",
    ]);

    expect(find_reactive_assignment_cycles(source)).toEqual([]);
  });

  it("does not confuse identifiers that only share a prefix", () => {
    const source = build_component_source([
      "  $: total = count_label;",
      "  $: count = total_items;",
    ]);

    expect(find_reactive_assignment_cycles(source)).toEqual([]);
  });

  it("ignores property reads with the same name as a target", () => {
    const source = build_component_source([
      "  $: value = settings.label;",
      "  $: label = value;",
    ]);

    expect(find_reactive_assignment_cycles(source)).toEqual([]);
  });

  it("ignores reactive blocks and comparisons that are not assignments", () => {
    const source = build_component_source([
      "  $: if (a === b) refresh(a);",
      "  $: b == a;",
      "  $: {",
      "    a = b;",
      "  }",
    ]);

    expect(find_reactive_assignment_cycles(source)).toEqual([]);
  });

  it("finds no reactive assignment cycles in any Svelte component", () => {
    const violations = collect_svelte_files(SOURCE_ROOT).flatMap(
      (file_path: string) =>
        find_reactive_assignment_cycles(readFileSync(file_path, "utf8")).map(
          (cycle) =>
            `${file_path.replace(SOURCE_ROOT, "")}:${cycle.first_line_number} ${cycle.first_target} <-> ${cycle.second_target}`,
        ),
    );

    expect(violations).toEqual([]);
  });
});
