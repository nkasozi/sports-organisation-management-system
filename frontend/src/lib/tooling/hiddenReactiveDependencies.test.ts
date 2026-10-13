import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { find_hidden_reactive_dependencies } from "./hiddenReactiveDependencies";

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

describe("find_hidden_reactive_dependencies", () => {
  it("flags a reactive statement that reads state only through a zero-argument local function", () => {
    const source = [
      "<script>",
      "  let count = 0;",
      "  function get_input() {",
      "    return { count };",
      "  }",
      "  $: doubled = double_value(",
      "    get_input(),",
      "  );",
      "</script>",
    ].join("\n");

    expect(find_hidden_reactive_dependencies(source)).toEqual([
      { line_number: 6, function_name: "get_input" },
    ]);
  });

  it("allows reactive statements that reference their inputs directly", () => {
    const source = [
      "<script>",
      "  let count = 0;",
      "  function get_input() {",
      "    return { count };",
      "  }",
      "  $: doubled = double_value({ count });",
      "  const handler = () => get_input();",
      "</script>",
    ].join("\n");

    expect(find_hidden_reactive_dependencies(source)).toEqual([]);
  });

  it("flags zero-argument local calls whose value is read inside a condition", () => {
    const source = [
      "<script>",
      "  function get_signature() {",
      "    return build_signature(events);",
      "  }",
      "  $: if (instance && get_signature() !== previous_signature) {",
      "    refresh();",
      "  }",
      "</script>",
    ].join("\n");

    expect(find_hidden_reactive_dependencies(source)).toEqual([
      { line_number: 5, function_name: "get_signature" },
    ]);
  });

  it("allows zero-argument local calls used as standalone actions after explicit triggers", () => {
    const source = [
      "<script>",
      "  function clear_timer() {}",
      "  function start_timer() {}",
      "  $: if (is_visible) clear_timer();",
      "  $: if (is_visible && auto_dismiss) {",
      "    clear_timer();",
      "    start_timer();",
      "  }",
      "  $: {",
      "    if (team_id) start_timer();",
      "  }",
      "</script>",
    ].join("\n");

    expect(find_hidden_reactive_dependencies(source)).toEqual([]);
  });

  it("allows zero-argument calls to functions that are not declared in the component", () => {
    const source = [
      "<script>",
      "  $: now = create_timestamp();",
      "</script>",
    ].join("\n");

    expect(find_hidden_reactive_dependencies(source)).toEqual([]);
  });

  it("allows local functions that take parameters", () => {
    const source = [
      "<script>",
      "  function build_label(count) {",
      "    return String(count);",
      "  }",
      "  $: label = build_label(count);",
      "</script>",
    ].join("\n");

    expect(find_hidden_reactive_dependencies(source)).toEqual([]);
  });

  it("finds no hidden reactive dependencies in any Svelte component", () => {
    const violations = collect_svelte_files(SOURCE_ROOT).flatMap(
      (file_path: string) =>
        find_hidden_reactive_dependencies(readFileSync(file_path, "utf8")).map(
          (violation) =>
            `${file_path.replace(SOURCE_ROOT, "")}:${violation.line_number} ${violation.function_name}()`,
        ),
    );

    expect(violations).toEqual([]);
  });
});
