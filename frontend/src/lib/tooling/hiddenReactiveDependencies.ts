interface HiddenReactiveDependency {
  line_number: number;
  function_name: string;
}

export interface ReactiveStatement {
  line_number: number;
  text: string;
}

const REACTIVE_LABEL_PATTERN = /^[ \t]*\$:/gm;
const ZERO_PARAMETER_FUNCTION_PATTERNS = [
  /function\s+([A-Za-z_$][\w$]*)\s*\(\s*\)/g,
  /(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(\s*\)\s*(?::[^=]+)?=>/g,
];
const OPENING_BRACKETS = new Set(["(", "[", "{"]);
const CLOSING_BRACKETS = new Set([")", "]", "}"]);
const STATEMENT_TERMINATOR = ";";
const BLOCK_CLOSER = "}";
const REACTIVE_LABEL_LENGTH = 2;

function count_line_number(source: string, character_index: number): number {
  return source.slice(0, character_index).split("\n").length;
}

function find_statement_end(source: string, body_start: number): number {
  let bracket_depth = 0;
  for (let index = body_start; index < source.length; index += 1) {
    const character = source[index];
    if (OPENING_BRACKETS.has(character)) bracket_depth += 1;
    if (CLOSING_BRACKETS.has(character)) bracket_depth -= 1;
    if (bracket_depth !== 0) continue;
    if (character === STATEMENT_TERMINATOR) return index;
    if (character === BLOCK_CLOSER) return index;
  }
  return source.length;
}

export function extract_reactive_statements(
  source: string,
): ReactiveStatement[] {
  return [...source.matchAll(REACTIVE_LABEL_PATTERN)].map(
    (match: RegExpMatchArray): ReactiveStatement => {
      const label_end = (match.index ?? 0) + match[0].length;
      const statement_end = find_statement_end(source, label_end);
      return {
        line_number: count_line_number(
          source,
          label_end - REACTIVE_LABEL_LENGTH,
        ),
        text: source.slice(label_end, statement_end + 1),
      };
    },
  );
}

function collect_zero_parameter_function_names(source: string): string[] {
  return ZERO_PARAMETER_FUNCTION_PATTERNS.flatMap((pattern: RegExp) =>
    [...source.matchAll(pattern)].map((match: RegExpMatchArray) => match[1]),
  );
}

function count_pattern_matches(
  statement_text: string,
  pattern: string,
): number {
  return [...statement_text.matchAll(new RegExp(pattern, "g"))].length;
}

function is_value_read_without_arguments(
  statement_text: string,
  function_name: string,
): boolean {
  const call_pattern = `(?<![\\w$.])${function_name}\\s*\\(\\s*\\)`;
  const standalone_action_pattern = `(?:^|[;{})])\\s*${call_pattern}\\s*;`;
  return (
    count_pattern_matches(statement_text, call_pattern) >
    count_pattern_matches(statement_text, standalone_action_pattern)
  );
}

export function find_hidden_reactive_dependencies(
  source: string,
): HiddenReactiveDependency[] {
  const local_function_names = collect_zero_parameter_function_names(source);
  return extract_reactive_statements(source).flatMap(
    (statement: ReactiveStatement): HiddenReactiveDependency[] =>
      local_function_names
        .filter((function_name: string) =>
          is_value_read_without_arguments(statement.text, function_name),
        )
        .map((function_name: string) => ({
          line_number: statement.line_number,
          function_name,
        })),
  );
}
