import {
  extract_reactive_statements,
  type ReactiveStatement,
} from "./hiddenReactiveDependencies";

interface ReactiveAssignment {
  line_number: number;
  target: string;
  expression: string;
}

interface ReactiveAssignmentCycle {
  first_line_number: number;
  first_target: string;
  second_line_number: number;
  second_target: string;
}

const REACTIVE_ASSIGNMENT_PATTERN =
  /^\s*([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*=(?![=>])([\s\S]*)$/;
const MEMBER_SEPARATOR = ".";
const IDENTIFIER_READ_PATTERN_PREFIX = "(?<![\\w$.])";
const IDENTIFIER_READ_PATTERN_SUFFIX = "(?![\\w$])";

function parse_reactive_assignment(
  statement: ReactiveStatement,
): ReactiveAssignment[] {
  const match = REACTIVE_ASSIGNMENT_PATTERN.exec(statement.text);
  if (!match) return [];
  return [
    {
      line_number: statement.line_number,
      target: match[1],
      expression: match[2],
    },
  ];
}

function escape_identifier(identifier: string): string {
  return identifier.replace(/\$/g, "\\$");
}

function find_root_identifier(target: string): string {
  return target.split(MEMBER_SEPARATOR)[0];
}

function reads_assignment_target(expression: string, target: string): boolean {
  const pattern = new RegExp(
    `${IDENTIFIER_READ_PATTERN_PREFIX}${escape_identifier(find_root_identifier(target))}${IDENTIFIER_READ_PATTERN_SUFFIX}`,
  );
  return pattern.test(expression);
}

function is_mutual_assignment(
  first: ReactiveAssignment,
  second: ReactiveAssignment,
): boolean {
  return (
    find_root_identifier(first.target) !==
      find_root_identifier(second.target) &&
    reads_assignment_target(first.expression, second.target) &&
    reads_assignment_target(second.expression, first.target)
  );
}

export function find_reactive_assignment_cycles(
  source: string,
): ReactiveAssignmentCycle[] {
  const assignments = extract_reactive_statements(source).flatMap(
    parse_reactive_assignment,
  );
  return assignments.flatMap((first: ReactiveAssignment, first_index: number) =>
    assignments
      .slice(first_index + 1)
      .filter((second: ReactiveAssignment) =>
        is_mutual_assignment(first, second),
      )
      .map((second: ReactiveAssignment) => ({
        first_line_number: first.line_number,
        first_target: first.target,
        second_line_number: second.line_number,
        second_target: second.target,
      })),
  );
}
