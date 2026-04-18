import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const INCLUDED_FILE_EXTENSIONS = new Set([".js", ".svelte", ".ts"]);
const EXCLUDED_DIRECTORY_NAMES = new Set([
  ".git",
  ".svelte-kit",
  ".vercel",
  "build",
  "coverage",
  "dist",
  "node_modules",
]);
const EXCLUDED_RELATIVE_PATH_PREFIXES = [
  "frontend/convex/_generated/",
  "frontend/src/lib/generated/",
];

const TYPE_BLOCK_OPEN_PATTERNS = [
  {
    block_kind: "interface",
    matcher: /\binterface\b[^{]*\{/,
  },
  {
    block_kind: "type",
    matcher: /\btype\b[^=]*=\s*\{/,
  },
  {
    block_kind: "class",
    matcher: /\bclass\b[^{]*\{/,
  },
];

const FIELD_DECLARATION_PATTERN =
  /^(?:(?:public|private|protected|readonly|static|abstract|declare|override)\s+)*(?:[A-Za-z_$][\w$]*[?!]?|\[[^\]]+\])\s*:/;
const INLINE_TYPE_BLOCK_NULLABLE_FIELD_PATTERN =
  /\{[^}]*:\s*[^}]*\b(?:null|undefined)\b/;
const NAMED_FUNCTION_RETURN_TYPE_PATTERN =
  /^(?:export\s+)?(?:default\s+)?(?:async\s+)?function\b[^()]*\([^)]*\)\s*:\s*.*\b(?:null|undefined)\b/;
const METHOD_RETURN_TYPE_PATTERN =
  /^(?:(?:public|private|protected|static|abstract|async|get|set|override)\s+)*[A-Za-z_$][\w$]*\s*\([^)]*\)\s*:\s*.*\b(?:null|undefined)\b/;
const ARROW_FUNCTION_RETURN_TYPE_PATTERN =
  /^(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*:\s*.*\b(?:null|undefined)\b\s*=>/;
const DIRECT_NULLISH_RETURN_PATTERN =
  /\breturn\s+(?:null|undefined|void\s+0)\b/;
const DIRECT_NULLISH_ARROW_RETURN_PATTERN =
  /=>\s*(?:null|undefined|void\s+0)\b/;

function count_character_occurrences(source_text, target_character) {
  let count = 0;

  for (
    let character_index = 0;
    character_index < source_text.length;
    character_index += 1
  ) {
    if (source_text[character_index] === target_character) {
      count += 1;
    }
  }

  return count;
}

function get_opened_type_blocks(masked_line) {
  return TYPE_BLOCK_OPEN_PATTERNS.filter(({ matcher }) =>
    matcher.test(masked_line),
  ).map(({ block_kind }) => block_kind);
}

function build_type_annotation_depth_state() {
  return {
    angle_depth: 0,
    brace_depth: 0,
    bracket_depth: 0,
    parenthesis_depth: 0,
  };
}

function is_at_top_level_type_depth(depth_state) {
  return (
    depth_state.angle_depth === 0 &&
    depth_state.brace_depth === 0 &&
    depth_state.bracket_depth === 0 &&
    depth_state.parenthesis_depth === 0
  );
}

function update_type_annotation_depth(depth_state, current_character) {
  if (current_character === "<") {
    depth_state.angle_depth += 1;
    return;
  }

  if (current_character === ">") {
    depth_state.angle_depth = Math.max(0, depth_state.angle_depth - 1);
    return;
  }

  if (current_character === "{") {
    depth_state.brace_depth += 1;
    return;
  }

  if (current_character === "}") {
    depth_state.brace_depth = Math.max(0, depth_state.brace_depth - 1);
    return;
  }

  if (current_character === "[") {
    depth_state.bracket_depth += 1;
    return;
  }

  if (current_character === "]") {
    depth_state.bracket_depth = Math.max(0, depth_state.bracket_depth - 1);
    return;
  }

  if (current_character === "(") {
    depth_state.parenthesis_depth += 1;
    return;
  }

  if (current_character === ")") {
    depth_state.parenthesis_depth = Math.max(
      0,
      depth_state.parenthesis_depth - 1,
    );
  }
}

function extract_field_type_annotation(trimmed_masked_line) {
  const colon_index = trimmed_masked_line.indexOf(":");

  if (colon_index === -1) {
    return "";
  }

  const type_annotation = trimmed_masked_line.slice(colon_index + 1);
  const depth_state = build_type_annotation_depth_state();
  let extracted_annotation = "";

  for (
    let character_index = 0;
    character_index < type_annotation.length;
    character_index += 1
  ) {
    const current_character = type_annotation[character_index];

    if (
      is_at_top_level_type_depth(depth_state) &&
      (current_character === "=" ||
        current_character === ";" ||
        current_character === ",")
    ) {
      break;
    }

    extracted_annotation += current_character;
    update_type_annotation_depth(depth_state, current_character);
  }

  return extracted_annotation.trim();
}

function has_top_level_nullish_type(type_annotation) {
  const depth_state = build_type_annotation_depth_state();
  let top_level_annotation = "";

  for (
    let character_index = 0;
    character_index < type_annotation.length;
    character_index += 1
  ) {
    const current_character = type_annotation[character_index];

    if (is_at_top_level_type_depth(depth_state)) {
      top_level_annotation += current_character;
    } else {
      top_level_annotation += " ";
    }

    update_type_annotation_depth(depth_state, current_character);
  }

  return /\b(?:null|undefined)\b/.test(top_level_annotation);
}

function is_inside_type_definition(block_stack) {
  return block_stack.some(
    ({ block_kind }) => block_kind === "interface" || block_kind === "type",
  );
}

function get_current_class_block(block_stack) {
  for (
    let block_index = block_stack.length - 1;
    block_index >= 0;
    block_index -= 1
  ) {
    if (block_stack[block_index].block_kind === "class") {
      return block_stack[block_index];
    }
  }

  return false;
}

function is_nullable_field_violation(command) {
  const {
    block_stack,
    brace_depth,
    masked_line,
    opened_type_blocks,
    parenthesis_depth,
  } = command;
  const trimmed_masked_line = masked_line.trim();

  if (trimmed_masked_line === "") {
    return false;
  }

  const current_class_block = get_current_class_block(block_stack);
  const line_is_inside_class_field_area =
    current_class_block && brace_depth === current_class_block.depth;

  if (parenthesis_depth > 0) {
    return false;
  }

  if (
    !is_inside_type_definition(block_stack) &&
    !line_is_inside_class_field_area
  ) {
    return (
      opened_type_blocks.length > 0 &&
      INLINE_TYPE_BLOCK_NULLABLE_FIELD_PATTERN.test(trimmed_masked_line)
    );
  }

  if (!FIELD_DECLARATION_PATTERN.test(trimmed_masked_line)) {
    return false;
  }

  return has_top_level_nullish_type(
    extract_field_type_annotation(trimmed_masked_line),
  );
}

function is_nullish_function_return_type_violation(masked_line) {
  const trimmed_masked_line = masked_line.trim();

  return (
    NAMED_FUNCTION_RETURN_TYPE_PATTERN.test(trimmed_masked_line) ||
    METHOD_RETURN_TYPE_PATTERN.test(trimmed_masked_line) ||
    ARROW_FUNCTION_RETURN_TYPE_PATTERN.test(trimmed_masked_line)
  );
}

function is_nullish_return_value_violation(masked_line) {
  return (
    DIRECT_NULLISH_RETURN_PATTERN.test(masked_line) ||
    DIRECT_NULLISH_ARROW_RETURN_PATTERN.test(masked_line)
  );
}

function mask_source_characters(source_text) {
  let masked_source = "";
  let parser_state = "code";
  let escape_is_active = false;

  for (
    let character_index = 0;
    character_index < source_text.length;
    character_index += 1
  ) {
    const current_character = source_text[character_index];
    const next_character =
      character_index + 1 < source_text.length
        ? source_text[character_index + 1]
        : "";
    const is_newline = current_character === "\n" || current_character === "\r";

    if (parser_state === "code") {
      if (current_character === "/" && next_character === "/") {
        masked_source += "  ";
        parser_state = "line_comment";
        character_index += 1;
        continue;
      }

      if (current_character === "/" && next_character === "*") {
        masked_source += "  ";
        parser_state = "block_comment";
        character_index += 1;
        continue;
      }

      if (current_character === "'") {
        masked_source += " ";
        parser_state = "single_quote";
        escape_is_active = false;
        continue;
      }

      if (current_character === '"') {
        masked_source += " ";
        parser_state = "double_quote";
        escape_is_active = false;
        continue;
      }

      if (current_character === "`") {
        masked_source += " ";
        parser_state = "template_quote";
        escape_is_active = false;
        continue;
      }

      masked_source += current_character;
      continue;
    }

    if (parser_state === "line_comment") {
      if (is_newline) {
        masked_source += current_character;
        parser_state = "code";
        continue;
      }

      masked_source += " ";
      continue;
    }

    if (parser_state === "block_comment") {
      if (current_character === "*" && next_character === "/") {
        masked_source += "  ";
        parser_state = "code";
        character_index += 1;
        continue;
      }

      masked_source += is_newline ? current_character : " ";
      continue;
    }

    if (is_newline && parser_state !== "template_quote") {
      masked_source += current_character;
      parser_state = "code";
      escape_is_active = false;
      continue;
    }

    if (escape_is_active) {
      masked_source += is_newline ? current_character : " ";
      escape_is_active = false;
      continue;
    }

    if (current_character === "\\") {
      masked_source += " ";
      escape_is_active = true;
      continue;
    }

    if (
      (parser_state === "single_quote" && current_character === "'") ||
      (parser_state === "double_quote" && current_character === '"') ||
      (parser_state === "template_quote" && current_character === "`")
    ) {
      masked_source += " ";
      parser_state = "code";
      continue;
    }

    masked_source += is_newline ? current_character : " ";
  }

  return masked_source;
}

export function find_null_guard_violations(relative_file_path, source_text) {
  const masked_lines = mask_source_characters(source_text).split("\n");
  const source_lines = source_text.split("\n");
  const violations = [];
  const block_stack = [];
  let brace_depth = 0;
  let parenthesis_depth = 0;

  for (let line_index = 0; line_index < masked_lines.length; line_index += 1) {
    const masked_line = masked_lines[line_index];
    const source_line = source_lines[line_index].trim();

    while (
      block_stack.length > 0 &&
      brace_depth < block_stack[block_stack.length - 1].depth
    ) {
      block_stack.pop();
    }

    if (
      is_nullable_field_violation({
        block_stack,
        brace_depth,
        masked_line,
        opened_type_blocks: get_opened_type_blocks(masked_line),
        parenthesis_depth,
      })
    ) {
      violations.push({
        file_path: relative_file_path,
        line_content: source_line,
        line_number: line_index + 1,
        rule_id: "nullable_field",
      });
    }

    if (is_nullish_function_return_type_violation(masked_line)) {
      violations.push({
        file_path: relative_file_path,
        line_content: source_line,
        line_number: line_index + 1,
        rule_id: "nullish_return_type",
      });
    }

    if (is_nullish_return_value_violation(masked_line)) {
      violations.push({
        file_path: relative_file_path,
        line_content: source_line,
        line_number: line_index + 1,
        rule_id: "nullish_return_value",
      });
    }

    const opened_brace_count = count_character_occurrences(masked_line, "{");
    const closed_brace_count = count_character_occurrences(masked_line, "}");
    const opened_parenthesis_count = count_character_occurrences(
      masked_line,
      "(",
    );
    const closed_parenthesis_count = count_character_occurrences(
      masked_line,
      ")",
    );
    const opened_type_blocks = get_opened_type_blocks(masked_line);
    const next_brace_depth =
      brace_depth + opened_brace_count - closed_brace_count;

    brace_depth = next_brace_depth;
    parenthesis_depth = Math.max(
      0,
      parenthesis_depth + opened_parenthesis_count - closed_parenthesis_count,
    );

    if (
      opened_brace_count === 0 ||
      opened_type_blocks.length === 0 ||
      next_brace_depth <= brace_depth - opened_brace_count + closed_brace_count
    ) {
      continue;
    }

    for (const block_kind of opened_type_blocks) {
      block_stack.push({
        block_kind,
        depth: brace_depth,
      });
    }
  }

  return violations;
}

function normalize_relative_file_path(absolute_file_path, scan_root_path) {
  return path
    .relative(scan_root_path, absolute_file_path)
    .split(path.sep)
    .join("/");
}

function is_excluded_relative_file_path(relative_file_path) {
  return EXCLUDED_RELATIVE_PATH_PREFIXES.some((excluded_prefix) =>
    relative_file_path.startsWith(excluded_prefix),
  );
}

function should_scan_file(absolute_file_path, scan_root_path) {
  const relative_file_path = normalize_relative_file_path(
    absolute_file_path,
    scan_root_path,
  );

  if (is_excluded_relative_file_path(relative_file_path)) {
    return false;
  }

  return INCLUDED_FILE_EXTENSIONS.has(path.extname(relative_file_path));
}

export function collect_no_null_guard_file_paths(scan_root_path) {
  const discovered_file_paths = [];
  const directory_paths_to_scan = [scan_root_path];

  while (directory_paths_to_scan.length > 0) {
    const current_directory_path = directory_paths_to_scan.pop();

    if (!current_directory_path) {
      continue;
    }

    const directory_entries = readdirSync(current_directory_path, {
      withFileTypes: true,
    });

    for (const directory_entry of directory_entries) {
      const absolute_entry_path = path.join(
        current_directory_path,
        directory_entry.name,
      );

      if (directory_entry.isDirectory()) {
        if (EXCLUDED_DIRECTORY_NAMES.has(directory_entry.name)) {
          continue;
        }

        directory_paths_to_scan.push(absolute_entry_path);
        continue;
      }

      if (!directory_entry.isFile()) {
        continue;
      }

      if (!should_scan_file(absolute_entry_path, scan_root_path)) {
        continue;
      }

      discovered_file_paths.push(
        normalize_relative_file_path(absolute_entry_path, scan_root_path),
      );
    }
  }

  return discovered_file_paths.sort((left_file_path, right_file_path) =>
    left_file_path.localeCompare(right_file_path),
  );
}

export function run_no_null_guard(scan_root_path) {
  const violations = [];
  const discovered_file_paths =
    collect_no_null_guard_file_paths(scan_root_path);

  for (const relative_file_path of discovered_file_paths) {
    const absolute_file_path = path.join(scan_root_path, relative_file_path);
    const source_text = readFileSync(absolute_file_path, "utf8");
    violations.push(
      ...find_null_guard_violations(relative_file_path, source_text),
    );
  }

  return violations.length === 0
    ? { status: "passed", scanned_file_count: discovered_file_paths.length }
    : {
        status: "failed",
        scanned_file_count: discovered_file_paths.length,
        violations,
      };
}

function print_failed_guard_result(guard_result) {
  for (const violation of guard_result.violations) {
    console.error(
      `[NoNullGuard] ${violation.file_path}:${violation.line_number} ${violation.rule_id} ${violation.line_content}`,
    );
  }
}

function run_cli() {
  const repo_root_path = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../..",
  );
  const guard_result = run_no_null_guard(repo_root_path);

  if (guard_result.status === "passed") {
    console.log(
      `[NoNullGuard] Passed for ${guard_result.scanned_file_count} scanned files`,
    );
    return;
  }

  print_failed_guard_result(guard_result);
  process.exitCode = 1;
}

const invoked_script_path = process.argv.length > 1 ? process.argv[1] : "";

if (
  invoked_script_path !== "" &&
  import.meta.url === pathToFileURL(invoked_script_path).href
) {
  run_cli();
}
