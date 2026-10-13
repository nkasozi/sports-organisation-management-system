const OPEN_BRACE = "{";
const CLOSE_BRACE = "}";

function get_brace_delta(char: string): number {
  switch (char) {
    case OPEN_BRACE:
      return 1;
    case CLOSE_BRACE:
      return -1;
    default:
      return 0;
  }
}

export function extract_interface_fields(file_content: string): string[] {
  const interface_start_pattern =
    /export\s+interface\s+\w+\s+extends\s+BaseEntity\s*\{/g;
  const match = interface_start_pattern.exec(file_content);

  if (!match) return [];

  const content_start = match.index + match[0].length;
  let brace_depth = 1;
  let position = content_start;

  while (position < file_content.length && brace_depth > 0) {
    const char = file_content[position];

    brace_depth += get_brace_delta(char);

    position++;
  }

  const interface_body = file_content.slice(content_start, position - 1);
  const field_pattern = /^\s+(\w+)\??:\s/gm;
  const fields = [] as string[];
  let field_match;

  while ((field_match = field_pattern.exec(interface_body)) != void 0) {
    fields.push(field_match[1]);
  }

  return fields;
}

export function extract_table_block(
  schema_content: string,
  table_name: string,
): string | undefined {
  const start_marker = `${table_name}: defineTable({`;
  const start_index = schema_content.indexOf(start_marker);

  if (start_index === -1) return;

  const content_start = start_index + start_marker.length;
  let brace_depth = 1;
  let position = content_start;

  while (position < schema_content.length && brace_depth > 0) {
    const char = schema_content[position];

    brace_depth += get_brace_delta(char);

    position++;
  }

  return schema_content.slice(content_start, position - 1);
}

export function extract_convex_table_fields(table_block: string): string[] {
  const fields = [] as string[];
  let brace_depth = 0;

  const lines = table_block.split("\n");

  for (const line of lines) {
    if (brace_depth === 0) {
      const field_match = line.match(/^\s+(\w+):\s+v\./);
      if (field_match) {
        fields.push(field_match[1]);
      }
    }

    for (const char of line) {
      brace_depth += get_brace_delta(char);
    }
  }

  const has_sync_metadata = table_block.includes("...sync_metadata_fields");
  const has_timestamp_fields = table_block.includes("...timestamp_fields");

  if (has_sync_metadata) {
    fields.push("id", "local_id", "synced_at", "version");
  }

  if (has_timestamp_fields) {
    fields.push("created_at", "updated_at");
  }

  return fields;
}

export function find_missing_fields(
  local_fields: string[],
  convex_fields: string[],
): string[] {
  const convex_field_set = new Set(convex_fields);

  return local_fields.filter((field) => !convex_field_set.has(field));
}
