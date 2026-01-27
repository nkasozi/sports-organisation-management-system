<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { FieldMetadata } from "$lib/core/entities/BaseEntity";
  import { entityMetadataRegistry } from "$lib/infrastructure/registry/EntityMetadataRegistry";
  import { get_use_cases_for_entity_type } from "$lib/infrastructure/registry/entityUseCasesRegistry";
  import {
    resolve_entity_name_to_id,
    is_name_column,
    extract_entity_type_from_name_column,
    is_id_column,
    looks_like_entity_name,
  } from "$lib/core/services/nameResolutionService";

  export let entity_type: string;
  export let is_visible: boolean = false;

  const dispatch = createEventDispatcher<{
    close: void;
    import_complete: { success_count: number; failure_count: number };
  }>();

  type ImportStep = "download" | "upload" | "processing" | "results";

  interface ImportResult {
    row_number: number;
    original_data: Record<string, string>;
    success: boolean;
    error_message: string;
  }

  let current_step: ImportStep = "download";
  let file_input: HTMLInputElement;
  let selected_file: File | null = null;
  let is_processing: boolean = false;
  let import_results: ImportResult[] = [];
  let success_count: number = 0;
  let failure_count: number = 0;

  $: entity_metadata = entityMetadataRegistry.get_entity_metadata(
    entity_type.toLowerCase(),
  );
  $: display_name = entity_metadata?.display_name || entity_type;
  $: importable_fields = get_importable_fields(entity_metadata?.fields || []);
  $: foreign_key_fields = get_foreign_key_fields(importable_fields);
  $: enum_fields = get_enum_fields(importable_fields);

  function get_importable_fields(fields: FieldMetadata[]): FieldMetadata[] {
    return fields.filter((field) => {
      if (field.is_read_only) return false;
      if (field.field_type === "file") return false;
      if (field.field_type === "sub_entity") return false;
      if (field.field_name === "id") return false;
      if (field.field_name === "created_at") return false;
      if (field.field_name === "updated_at") return false;
      return true;
    });
  }

  function get_foreign_key_fields(fields: FieldMetadata[]): FieldMetadata[] {
    return fields.filter((field) => field.field_type === "foreign_key");
  }

  function get_enum_fields(fields: FieldMetadata[]): FieldMetadata[] {
    return fields.filter((field) => field.field_type === "enum");
  }

  function get_related_entity_display_name(field: FieldMetadata): string {
    if (!field.foreign_key_entity) return "related record";
    const related_metadata = entityMetadataRegistry.get_entity_metadata(
      field.foreign_key_entity.toLowerCase(),
    );
    return related_metadata?.display_name || field.foreign_key_entity;
  }

  function generate_csv_template(): string {
    const headers = importable_fields.map((f) => f.field_name);
    const header_row = headers.join(",");

    const example_values = importable_fields.map((field) => {
      return generate_example_value_for_field(field);
    });
    const example_row = example_values.join(",");

    return `${header_row}\n${example_row}`;
  }

  function generate_example_value_for_field(field: FieldMetadata): string {
    switch (field.field_type) {
      case "string":
        if (field.field_name.includes("email")) return "example@email.com";
        if (field.field_name.includes("phone")) return "+1234567890";
        if (field.field_name.includes("name")) return "Example Name";
        return "text_value";
      case "number":
        if (field.field_name.includes("year")) return "2020";
        if (field.field_name.includes("height")) return "180";
        if (field.field_name.includes("weight")) return "75";
        return "0";
      case "date":
        return "2000-01-15";
      case "boolean":
        return "true";
      case "enum":
        return field.enum_values?.[0] || "value";
      case "foreign_key":
        const entity_prefix =
          field.foreign_key_entity?.toLowerCase() || "entity";
        return `${entity_prefix}_default_1`;
      default:
        return "";
    }
  }

  function handle_download_template(): void {
    const csv_content = generate_csv_template();
    const blob = new Blob([csv_content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${entity_type.toLowerCase()}_import_template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    current_step = "upload";
  }

  function handle_file_selected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      selected_file = target.files[0];
    }
  }

  function parse_csv_content(content: string): Record<string, string>[] {
    const lines = content.split("\n").filter((line) => line.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = parse_csv_line(lines[0]);
    const records: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parse_csv_line(lines[i]);
      const record: Record<string, string> = {};
      for (let j = 0; j < headers.length; j++) {
        record[headers[j]] = values[j] || "";
      }
      records.push(record);
    }

    return records;
  }

  function parse_csv_line(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let in_quotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        in_quotes = !in_quotes;
      } else if (char === "," && !in_quotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());

    return result;
  }

  function convert_csv_record_to_entity_input(
    record: Record<string, string>,
  ): Record<string, unknown> {
    const entity_input: Record<string, unknown> = {};

    for (const field of importable_fields) {
      const raw_value = record[field.field_name];
      if (raw_value === undefined || raw_value === "") {
        if (field.is_required) {
          entity_input[field.field_name] = null;
        }
        continue;
      }

      entity_input[field.field_name] = convert_value_for_field_type(
        raw_value,
        field.field_type,
      );
    }

    return entity_input;
  }

  function convert_value_for_field_type(
    value: string,
    field_type: string,
  ): unknown {
    switch (field_type) {
      case "number":
        const num = parseFloat(value);
        return isNaN(num) ? null : num;
      case "boolean":
        return value.toLowerCase() === "true" || value === "1";
      case "date":
        return value;
      default:
        return value;
    }
  }

  function find_name_columns_in_record(
    record: Record<string, string>,
    foreign_key_fields: FieldMetadata[],
  ): { name_column: string; id_column: string; entity_type: string }[] {
    const name_columns: {
      name_column: string;
      id_column: string;
      entity_type: string;
    }[] = [];

    for (const column_name of Object.keys(record)) {
      if (is_name_column(column_name)) {
        const potential_entity_type =
          extract_entity_type_from_name_column(column_name);
        const matching_fk_field = foreign_key_fields.find(
          (field) =>
            field.foreign_key_entity?.toLowerCase() ===
            potential_entity_type.toLowerCase(),
        );

        if (matching_fk_field) {
          name_columns.push({
            name_column: column_name,
            id_column: matching_fk_field.field_name,
            entity_type: potential_entity_type,
          });
        }
      } else if (is_id_column(column_name)) {
        const value = record[column_name];
        if (value && looks_like_entity_name(value)) {
          const matching_fk_field = foreign_key_fields.find(
            (field) => field.field_name === column_name,
          );

          if (matching_fk_field && matching_fk_field.foreign_key_entity) {
            name_columns.push({
              name_column: column_name,
              id_column: column_name,
              entity_type: matching_fk_field.foreign_key_entity.toLowerCase(),
            });
          }
        }
      }
    }

    return name_columns;
  }

  interface NameResolutionError {
    column_name: string;
    error_message: string;
  }

  async function resolve_name_columns_in_record(
    record: Record<string, string>,
    name_columns: {
      name_column: string;
      id_column: string;
      entity_type: string;
    }[],
  ): Promise<{
    resolved_values: Record<string, string>;
    errors: NameResolutionError[];
  }> {
    const resolved_values: Record<string, string> = {};
    const errors: NameResolutionError[] = [];

    for (const { name_column, id_column, entity_type } of name_columns) {
      const name_value = record[name_column];

      if (!name_value || name_value.trim().length === 0) {
        continue;
      }

      const use_cases = get_use_cases_for_entity_type(
        entity_type.toLowerCase(),
      );
      if (!use_cases) {
        errors.push({
          column_name: name_column,
          error_message: `Error: Unknown entity type "${entity_type}". Cause: Cannot resolve name for this entity type. Solution: Use the ID column (${id_column}) instead.`,
        });
        continue;
      }

      const resolution_result = await resolve_entity_name_to_id({
        entity_name: name_value,
        entity_type,
        use_cases,
      });

      if (resolution_result.success && resolution_result.resolved_id) {
        resolved_values[id_column] = resolution_result.resolved_id;
      } else {
        errors.push({
          column_name: name_column,
          error_message:
            resolution_result.error_message || "Unknown resolution error",
        });
      }
    }

    return { resolved_values, errors };
  }

  async function convert_csv_record_to_entity_input_with_name_resolution(
    record: Record<string, string>,
    name_columns: {
      name_column: string;
      id_column: string;
      entity_type: string;
    }[],
  ): Promise<{
    entity_input: Record<string, unknown>;
    errors: NameResolutionError[];
  }> {
    const { resolved_values, errors } = await resolve_name_columns_in_record(
      record,
      name_columns,
    );

    if (errors.length > 0) {
      return { entity_input: {}, errors };
    }

    const augmented_record = { ...record, ...resolved_values };
    const entity_input: Record<string, unknown> = {};

    for (const field of importable_fields) {
      const raw_value = augmented_record[field.field_name];
      if (raw_value === undefined || raw_value === "") {
        if (field.is_required) {
          entity_input[field.field_name] = null;
        }
        continue;
      }

      entity_input[field.field_name] = convert_value_for_field_type(
        raw_value,
        field.field_type,
      );
    }

    return { entity_input, errors: [] };
  }

  async function handle_start_import(): Promise<void> {
    if (!selected_file) return;

    current_step = "processing";
    is_processing = true;
    import_results = [];
    success_count = 0;
    failure_count = 0;

    const file_content = await selected_file.text();
    const records = parse_csv_content(file_content);

    const use_cases = get_use_cases_for_entity_type(entity_type.toLowerCase());
    if (!use_cases) {
      import_results = [
        {
          row_number: 0,
          original_data: {},
          success: false,
          error_message: `No use cases found for entity type: ${entity_type}`,
        },
      ];
      failure_count = 1;
      current_step = "results";
      is_processing = false;
      return;
    }

    const first_record = records[0];
    const name_columns = first_record
      ? find_name_columns_in_record(first_record, foreign_key_fields)
      : [];
    const has_name_columns = name_columns.length > 0;

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const row_number = i + 2;

      let entity_input: Record<string, unknown>;
      let name_resolution_errors: NameResolutionError[] = [];

      if (has_name_columns) {
        const resolution_result =
          await convert_csv_record_to_entity_input_with_name_resolution(
            record,
            name_columns,
          );
        entity_input = resolution_result.entity_input;
        name_resolution_errors = resolution_result.errors;
      } else {
        entity_input = convert_csv_record_to_entity_input(record);
      }

      if (name_resolution_errors.length > 0) {
        failure_count++;
        const combined_errors = name_resolution_errors
          .map((e) => `[${e.column_name}]: ${e.error_message}`)
          .join(" | ");
        import_results.push({
          row_number,
          original_data: record,
          success: false,
          error_message: combined_errors,
        });
        continue;
      }

      const result = await use_cases.create(entity_input);

      if (result.success) {
        success_count++;
        import_results.push({
          row_number,
          original_data: record,
          success: true,
          error_message: "",
        });
      } else {
        failure_count++;
        import_results.push({
          row_number,
          original_data: record,
          success: false,
          error_message: result.error_message || "Unknown error",
        });
      }
    }

    current_step = "results";
    is_processing = false;
    dispatch("import_complete", { success_count, failure_count });
  }

  function generate_failure_report_csv(): string {
    const failed_results = import_results.filter((r) => !r.success);
    if (failed_results.length === 0) return "";

    const original_headers = importable_fields.map((f) => f.field_name);
    const headers = [...original_headers, "import_error_reason"];
    const header_row = headers.join(",");

    const data_rows = failed_results.map((result) => {
      const values = original_headers.map((h) => {
        const value = result.original_data[h] || "";
        return value.includes(",") ? `"${value}"` : value;
      });
      const error = result.error_message.includes(",")
        ? `"${result.error_message}"`
        : result.error_message;
      values.push(error);
      return values.join(",");
    });

    return [header_row, ...data_rows].join("\n");
  }

  function handle_download_failure_report(): void {
    const csv_content = generate_failure_report_csv();
    if (!csv_content) return;

    const blob = new Blob([csv_content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${entity_type.toLowerCase()}_import_failures.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handle_close(): void {
    current_step = "download";
    selected_file = null;
    import_results = [];
    success_count = 0;
    failure_count = 0;
    dispatch("close");
  }

  function handle_start_over(): void {
    current_step = "download";
    selected_file = null;
    import_results = [];
    success_count = 0;
    failure_count = 0;
  }
</script>

{#if is_visible}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    role="dialog"
    aria-modal="true"
    aria-labelledby="bulk-import-title"
  >
    <div
      class="bg-white dark:bg-accent-800 rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col"
    >
      <div
        class="px-6 py-4 border-b border-accent-200 dark:border-accent-700 flex items-center justify-between"
      >
        <h2
          id="bulk-import-title"
          class="text-xl font-semibold text-accent-900 dark:text-accent-100"
        >
          Bulk Import {display_name}s
        </h2>
        <button
          type="button"
          class="p-2 rounded-lg text-accent-500 hover:bg-accent-100 dark:hover:bg-accent-700"
          on:click={handle_close}
          aria-label="Close"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-6">
        {#if current_step === "download"}
          <div class="space-y-6">
            <div
              class="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4"
            >
              <h3 class="font-medium text-purple-900 dark:text-purple-100 mb-2">
                Step 1: Download the CSV Template
              </h3>
              <p class="text-sm text-purple-700 dark:text-purple-300 mb-4">
                Click below to download a CSV template with all the fields
                needed to import {display_name.toLowerCase()}s. Fill in your
                data following the example row format.
              </p>
              <div class="flex flex-wrap gap-3">
                <button
                  type="button"
                  class="btn bg-purple-600 hover:bg-purple-700 text-white"
                  on:click={handle_download_template}
                >
                  <svg
                    class="w-4 h-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download Template
                </button>
                <button
                  type="button"
                  class="btn bg-accent-600 hover:bg-accent-700 text-white"
                  on:click={() => (current_step = "upload")}
                >
                  <svg
                    class="w-4 h-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  Skip to File Upload
                </button>
              </div>
            </div>

            <div
              class="border border-accent-200 dark:border-accent-700 rounded-lg p-4"
            >
              <h4 class="font-medium text-accent-900 dark:text-accent-100 mb-2">
                Template Fields
              </h4>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                {#each importable_fields as field}
                  <div class="flex items-center gap-2">
                    <span class="text-accent-700 dark:text-accent-300"
                      >{field.display_name}</span
                    >
                    {#if field.is_required}
                      <span class="text-red-500 text-xs">*</span>
                    {/if}
                  </div>
                {/each}
              </div>
              <p class="text-xs text-accent-500 mt-2">* Required fields</p>
            </div>

            {#if foreign_key_fields.length > 0}
              <div
                class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
              >
                <h4 class="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Foreign Key Fields (Two Options)
                </h4>

                <div
                  class="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-lg"
                >
                  <h5
                    class="font-medium text-emerald-800 dark:text-emerald-200 text-sm mb-2"
                  >
                    Option 1: Use Name Columns (Easier)
                  </h5>
                  <p
                    class="text-sm text-emerald-700 dark:text-emerald-300 mb-2"
                  >
                    Instead of IDs, you can use name columns and we'll look up
                    the ID for you:
                  </p>
                  <div class="space-y-1">
                    {#each foreign_key_fields as field}
                      <div class="flex items-start gap-2 text-sm">
                        <span
                          class="font-medium text-emerald-800 dark:text-emerald-200 min-w-40"
                          >{field.foreign_key_entity?.toLowerCase()}_name:</span
                        >
                        <span class="text-emerald-600 dark:text-emerald-300">
                          Name of the <strong
                            >{get_related_entity_display_name(field)}</strong
                          > (must match exactly)
                        </span>
                      </div>
                    {/each}
                  </div>
                </div>

                <div
                  class="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg"
                >
                  <h5
                    class="font-medium text-blue-800 dark:text-blue-200 text-sm mb-2"
                  >
                    Option 2: Use ID Columns (More Precise)
                  </h5>
                  <p class="text-sm text-blue-700 dark:text-blue-300 mb-2">
                    To find the ID values:
                  </p>
                  <ol
                    class="text-sm text-blue-700 dark:text-blue-300 list-decimal list-inside space-y-1 mb-3"
                  >
                    <li>Go to the related entity's list page</li>
                    <li>Click the <strong>"Columns"</strong> button</li>
                    <li>
                      Enable the <strong>"ID"</strong> column to see the IDs
                    </li>
                    <li>
                      Copy the exact ID value (e.g., <code
                        class="bg-blue-100 dark:bg-blue-800 px-1 rounded"
                        >org_default_1</code
                      >)
                    </li>
                  </ol>
                  <div class="space-y-1">
                    {#each foreign_key_fields as field}
                      <div class="flex items-start gap-2 text-sm">
                        <span
                          class="font-medium text-blue-800 dark:text-blue-200 min-w-40"
                          >{field.field_name}:</span
                        >
                        <span class="text-blue-600 dark:text-blue-300">
                          ID from <strong
                            >{get_related_entity_display_name(field)}</strong
                          > list
                        </span>
                      </div>
                    {/each}
                  </div>
                </div>
              </div>
            {/if}

            {#if enum_fields.length > 0}
              <div
                class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
              >
                <h4 class="font-medium text-green-900 dark:text-green-100 mb-2">
                  Allowed Values for Selection Fields
                </h4>
                <p class="text-sm text-green-700 dark:text-green-300 mb-3">
                  These fields only accept specific values. Use exactly one of
                  the listed options:
                </p>
                <div class="space-y-3">
                  {#each enum_fields as field}
                    <div>
                      <span
                        class="font-medium text-green-800 dark:text-green-200 text-sm"
                        >{field.display_name} ({field.field_name}):</span
                      >
                      <div class="flex flex-wrap gap-1 mt-1">
                        {#each field.enum_values || [] as value}
                          <code
                            class="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-0.5 rounded text-xs"
                            >{value}</code
                          >
                        {/each}
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}

            <div
              class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4"
            >
              <h4 class="font-medium text-amber-900 dark:text-amber-100 mb-2">
                General Tips
              </h4>
              <ul
                class="text-sm text-amber-700 dark:text-amber-300 list-disc list-inside space-y-1"
              >
                <li>Keep the header row exactly as provided in the template</li>
                <li>Dates must be in YYYY-MM-DD format (e.g., 2000-01-15)</li>
                <li>Leave optional fields empty if you don't have data</li>
                <li>Each row will create one new record</li>
              </ul>
            </div>
          </div>
        {:else if current_step === "upload"}
          <div class="space-y-6">
            <div
              class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
            >
              <h3 class="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Step 2: Upload Your Filled CSV
              </h3>
              <p class="text-sm text-blue-700 dark:text-blue-300 mb-4">
                Select your completed CSV file to begin the import process.
              </p>

              <div
                class="border-2 border-dashed border-accent-300 dark:border-accent-600 rounded-lg p-8 text-center"
              >
                <input
                  bind:this={file_input}
                  type="file"
                  accept=".csv"
                  class="hidden"
                  on:change={handle_file_selected}
                />
                {#if selected_file}
                  <div class="space-y-2">
                    <svg
                      class="w-12 h-12 mx-auto text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p class="font-medium text-accent-900 dark:text-accent-100">
                      {selected_file.name}
                    </p>
                    <button
                      type="button"
                      class="text-sm text-primary-600 hover:text-primary-700"
                      on:click={() => file_input.click()}
                    >
                      Choose a different file
                    </button>
                  </div>
                {:else}
                  <div class="space-y-2">
                    <svg
                      class="w-12 h-12 mx-auto text-accent-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <button
                      type="button"
                      class="btn btn-outline"
                      on:click={() => file_input.click()}
                    >
                      Select CSV File
                    </button>
                    <p class="text-sm text-accent-500">or drag and drop</p>
                  </div>
                {/if}
              </div>
            </div>

            <div class="flex gap-3">
              <button
                type="button"
                class="btn btn-outline"
                on:click={handle_start_over}
              >
                Back
              </button>
              <button
                type="button"
                class="btn bg-purple-600 hover:bg-purple-700 text-white flex-1"
                disabled={!selected_file}
                on:click={handle_start_import}
              >
                Start Import
              </button>
            </div>
          </div>
        {:else if current_step === "processing"}
          <div
            class="flex flex-col items-center justify-center py-12 space-y-4"
          >
            <div
              class="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"
            ></div>
            <p class="text-lg font-medium text-accent-900 dark:text-accent-100">
              Importing records...
            </p>
            <p class="text-sm text-accent-600 dark:text-accent-400">
              Please wait while we process your data
            </p>
          </div>
        {:else if current_step === "results"}
          <div class="space-y-6">
            <div
              class={`rounded-lg p-4 ${
                failure_count === 0
                  ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                  : success_count === 0
                    ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                    : "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
              }`}
            >
              <h3
                class={`font-medium mb-2 ${
                  failure_count === 0
                    ? "text-green-900 dark:text-green-100"
                    : success_count === 0
                      ? "text-red-900 dark:text-red-100"
                      : "text-amber-900 dark:text-amber-100"
                }`}
              >
                Import Complete
              </h3>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full bg-green-500"></span>
                  <span class="text-accent-700 dark:text-accent-300">
                    {success_count} record{success_count !== 1 ? "s" : ""} imported
                    successfully
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full bg-red-500"></span>
                  <span class="text-accent-700 dark:text-accent-300">
                    {failure_count} record{failure_count !== 1 ? "s" : ""} failed
                  </span>
                </div>
              </div>
            </div>

            {#if failure_count > 0}
              <div
                class="border border-accent-200 dark:border-accent-700 rounded-lg p-4"
              >
                <h4
                  class="font-medium text-accent-900 dark:text-accent-100 mb-3"
                >
                  Failed Records
                </h4>
                <div class="max-h-48 overflow-y-auto space-y-2">
                  {#each import_results.filter((r) => !r.success) as result}
                    <div
                      class="bg-red-50 dark:bg-red-900/10 rounded p-2 text-sm"
                    >
                      <p class="font-medium text-red-800 dark:text-red-200">
                        Row {result.row_number}: {result.error_message}
                      </p>
                    </div>
                  {/each}
                </div>
                <button
                  type="button"
                  class="mt-4 btn btn-outline text-red-600 border-red-300 hover:bg-red-50"
                  on:click={handle_download_failure_report}
                >
                  <svg
                    class="w-4 h-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download Failure Report
                </button>
              </div>
            {/if}

            <div class="flex gap-3">
              <button
                type="button"
                class="btn btn-outline"
                on:click={handle_start_over}
              >
                Import More
              </button>
              <button
                type="button"
                class="btn btn-primary flex-1"
                on:click={handle_close}
              >
                Done
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
