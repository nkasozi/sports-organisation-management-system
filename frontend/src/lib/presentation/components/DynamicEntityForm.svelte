<!--
Dynamic Entity Form Component
Automatically generates forms based on entity metadata
Follows coding rules: mobile-first, stateless helpers, explicit return types
-->
<script lang="ts">
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";
  import { createEventDispatcher } from "svelte";
  import type {
    BaseEntity,
    FieldMetadata,
    EntityOperationResult,
    SubEntityConfig,
  } from "../../core/entities/BaseEntity";
  import type { EntityMetadata } from "../../core/entities/BaseEntity";
  import { entityMetadataRegistry } from "../../infrastructure/registry/EntityMetadataRegistry";
  import { fakeDataGenerator } from "../../infrastructure/utils/FakeDataGenerator";
  import { get_use_cases_for_entity_type } from "../../infrastructure/registry/entityUseCasesRegistry";
  import SearchableSelectField from "./ui/SearchableSelectField.svelte";
  import DynamicEntityList from "./DynamicEntityList.svelte";
  import type { SubEntityFilter } from "$lib/core/types/SubEntityFilter";
  import { build_entity_display_label } from "../logic/dynamicFormLogic";

  // Component props
  export let entity_type: string;
  export let entity_data: Partial<BaseEntity> | null = null;
  export let show_fake_data_button: boolean = true;
  export let is_mobile_view: boolean = true;
  export let is_inline_mode: boolean = false;

  // Event dispatcher for parent communication
  const dispatch = createEventDispatcher<{
    save_success: { entity: BaseEntity };
    save_error: {
      error_message: string;
      validation_errors?: Record<string, string>;
    };
    cancel: void;
    inline_save_success: { entity: BaseEntity };
    inline_cancel: void;
  }>();

  // Component state
  let form_data: Record<string, any> = {};
  let validation_errors: Record<string, string> = {};
  let is_loading: boolean = false;
  let is_save_in_progress: boolean = false;
  let foreign_key_options: Record<string, BaseEntity[]> = {};

  // Computed values
  $: entity_metadata = get_entity_metadata_for_type(entity_type);
  $: is_edit_mode = determine_if_edit_mode(entity_data);
  $: form_title = build_form_title(
    entity_metadata?.display_name || "",
    is_edit_mode,
  );
  $: sub_entity_fields = get_sub_entity_fields(entity_metadata);

  // Initialize form when component mounts or entity changes
  $: {
    if (entity_metadata) {
      initialize_form_data_for_entity(entity_metadata, entity_data);
      if (browser) {
        void load_foreign_key_options_for_all_fields(entity_metadata.fields);
      }
    }
  }

  function get_entity_metadata_for_type(type: string): EntityMetadata | null {
    const normalized_type = type.toLowerCase();
    const metadata =
      entityMetadataRegistry.get_entity_metadata(normalized_type);
    if (!metadata) {
      console.error(
        `No metadata found for entity type: ${type} (normalized: ${normalized_type})`,
      );
    }
    return metadata;
  }

  function determine_if_edit_mode(data: Partial<BaseEntity> | null): boolean {
    return data !== null && data.id !== undefined;
  }

  function build_form_title(display_name: string, edit_mode: boolean): string {
    const action = edit_mode ? "Edit" : "Create";
    return `${action} ${display_name}`;
  }

  function get_sub_entity_fields(
    metadata: EntityMetadata | null,
  ): FieldMetadata[] {
    if (!metadata) return [];
    return metadata.fields.filter((field) => field.field_type === "sub_entity");
  }

  function build_sub_entity_filter(
    field: FieldMetadata,
    parent_entity: Partial<BaseEntity> | null,
  ): SubEntityFilter | null {
    if (!field.sub_entity_config || !parent_entity?.id) return null;

    const config = field.sub_entity_config;
    return {
      foreign_key_field: config.foreign_key_field,
      foreign_key_value: parent_entity.id,
      holder_type_field: config.holder_type_field,
      holder_type_value: config.holder_type_value,
    };
  }

  function initialize_form_data_for_entity(
    metadata: EntityMetadata,
    existing_data: Partial<BaseEntity> | null,
  ): void {
    const new_form_data: Record<string, any> = {};

    for (const field of metadata.fields) {
      if (
        existing_data &&
        existing_data[field.field_name as keyof BaseEntity] !== undefined
      ) {
        // Edit mode: use existing data
        new_form_data[field.field_name] =
          existing_data[field.field_name as keyof BaseEntity];
      } else {
        // Create mode: use defaults
        new_form_data[field.field_name] =
          get_default_value_for_field_type(field);
      }
    }

    form_data = new_form_data;
    validation_errors = {};
  }

  function get_default_value_for_field_type(field: FieldMetadata): any {
    if (field.field_type === "string") return "";
    if (field.field_type === "number") return 0;
    if (field.field_type === "boolean") return false;
    if (field.field_type === "date") return "";
    if (field.field_type === "file") return "";
    if (field.field_type === "enum") {
      if (!field.enum_values || field.enum_values.length === 0) return "";
      if (!field.is_required) return "";
      return field.enum_values[0];
    }
    if (field.field_type === "foreign_key") return "";
    return "";
  }

  function get_sorted_fields_for_display(
    fields: FieldMetadata[],
    in_edit_mode: boolean,
  ): FieldMetadata[] {
    const renderable_fields = fields.filter(
      (f) => f.field_type !== "sub_entity",
    );
    const visible_fields = renderable_fields.filter((f) => {
      if (!in_edit_mode && f.hide_on_create) return false;
      return true;
    });
    const file_fields = visible_fields.filter((f) => f.field_type === "file");
    const other_fields = visible_fields.filter((f) => f.field_type !== "file");
    return [...file_fields, ...other_fields];
  }

  function get_input_type_for_field(field: FieldMetadata): string {
    if (field.field_type === "number") return "number";
    if (field.field_type === "date") return "date";
    if (field.field_type === "file") return "file";
    if (field.field_name.includes("email")) return "email";
    if (field.field_name.includes("phone") || field.field_name.includes("tel"))
      return "tel";
    if (field.field_name.includes("icon")) return "text";
    if (
      field.field_name.includes("url") ||
      field.field_name.includes("website") ||
      field.field_name.includes("link")
    )
      return "url";
    return "text";
  }

  async function handle_file_input_change(
    event: Event,
    field_name: string,
  ): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (!file.type.startsWith("image/")) {
      validation_errors[field_name] = "Please select an image file";
      return;
    }

    try {
      const base64 = await convert_file_to_base64(file);
      form_data[field_name] = base64;
      validation_errors = { ...validation_errors };
      delete validation_errors[field_name];
    } catch (error) {
      validation_errors[field_name] = `Failed to process file: ${error}`;
    }
  }

  function convert_file_to_base64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  function hide_broken_image(event: Event): boolean {
    const image_element = event.currentTarget as HTMLImageElement | null;
    if (!image_element) return false;
    image_element.style.display = "none";
    return true;
  }

  async function load_foreign_key_options_for_all_fields(
    fields: FieldMetadata[],
  ): Promise<void> {
    is_loading = true;
    const new_options: Record<string, BaseEntity[]> = {};

    for (const field of fields) {
      if (field.field_type === "foreign_key" && field.foreign_key_entity) {
        const options_result = await load_foreign_key_options_for_field(
          field.foreign_key_entity,
        );
        if (options_result.success) {
          console.debug("[DEBUG] Loaded options_result.data", {
            data: options_result.data,
          });
          new_options[field.field_name] = options_result.data;
        }
      }
    }

    foreign_key_options = new_options;
    console.debug("[DEBUG] Loaded foreign_key_options", {
      options: foreign_key_options,
    });
    is_loading = false;
  }

  async function load_foreign_key_options_for_field(
    foreign_entity_type: string,
  ): Promise<{ success: boolean; data: BaseEntity[] }> {
    try {
      const normalized_type = foreign_entity_type.toLowerCase();
      const use_cases = get_use_cases_for_entity_type(normalized_type);
      if (!use_cases || typeof use_cases.list !== "function") {
        console.warn(
          `No usable list method found for entity type: ${foreign_entity_type}`,
        );
        return { success: false, data: [] };
      }
      const result = await use_cases.list();
      if (!result.success) {
        const error_msg =
          "error_message" in result
            ? result.error_message
            : "error" in result
              ? result.error
              : "Unknown error";
        console.warn(
          `Failed to load options for ${foreign_entity_type}:`,
          error_msg,
        );
        return { success: false, data: [] };
      }

      const data = result.data as unknown;
      const entities: BaseEntity[] = Array.isArray(data)
        ? (data as BaseEntity[])
        : Array.isArray((data as { items?: unknown })?.items)
          ? ((data as { items: unknown[] }).items as unknown as BaseEntity[])
          : [];

      console.debug("[DEBUG] Loaded foreign key options", {
        foreign_entity_type,
        count: entities.length,
      });
      return { success: true, data: entities };
    } catch (error) {
      console.error(
        `Error loading foreign key options for ${foreign_entity_type}:`,
        error,
      );
      return { success: false, data: [] };
    }
  }

  async function handle_form_submission(): Promise<void> {
    if (!entity_metadata) return;

    is_save_in_progress = true;
    validation_errors = {};

    const validation_result = validate_form_data_against_metadata(
      form_data,
      entity_metadata,
    );
    if (!validation_result.is_valid) {
      validation_errors = validation_result.errors;
      is_save_in_progress = false;
      return;
    }

    try {
      let save_result: EntityOperationResult<BaseEntity>;

      const normalized_type = entity_type.toLowerCase();
      const use_cases = get_use_cases_for_entity_type(normalized_type);

      if (!use_cases) {
        console.error(`No use cases found for entity type: ${entity_type}`);
        is_save_in_progress = false;
        return;
      }

      if (is_edit_mode && entity_data?.id) {
        if (typeof use_cases.update !== "function") {
          console.error(
            `Method update not found on use cases for ${entity_type}`,
          );
          is_save_in_progress = false;
          return;
        }
        save_result = await use_cases.update(entity_data.id, form_data);
      } else {
        if (typeof use_cases.create !== "function") {
          console.error(
            `Method create not found on use cases for ${entity_type}`,
          );
          is_save_in_progress = false;
          return;
        }
        save_result = await use_cases.create(form_data);
      }

      is_save_in_progress = false;

      if (save_result.success && save_result.data) {
        const event_name = is_inline_mode
          ? "inline_save_success"
          : "save_success";
        dispatch(event_name, { entity: save_result.data });
      } else {
        dispatch("save_error", {
          error_message: save_result.error_message || "Unknown error occurred",
          validation_errors: save_result.validation_errors,
        });
      }
    } catch (error) {
      is_save_in_progress = false;
      dispatch("save_error", {
        error_message: `Failed to save ${entity_metadata.display_name}: ${error}`,
      });
    }
  }

  function validate_form_data_against_metadata(
    data: Record<string, any>,
    metadata: EntityMetadata,
  ): { is_valid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    for (const field of metadata.fields) {
      const field_value = data[field.field_name];

      // Check required fields
      if (
        field.is_required &&
        (field_value === "" ||
          field_value === null ||
          field_value === undefined)
      ) {
        errors[field.field_name] = `${field.display_name} is required`;
        continue;
      }

      // Run validation rules
      if (
        field.validation_rules &&
        field_value !== "" &&
        field_value !== null &&
        field_value !== undefined
      ) {
        const rule_validation_result = validate_field_against_rules(
          field_value,
          field.validation_rules,
        );
        if (!rule_validation_result.is_valid) {
          errors[field.field_name] = rule_validation_result.error_message;
        }
      }
    }

    return {
      is_valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  function validate_field_against_rules(
    value: any,
    rules: any[],
  ): { is_valid: boolean; error_message: string } {
    for (const rule of rules) {
      if (
        rule.rule_type === "min_length" &&
        typeof value === "string" &&
        value.length < rule.rule_value
      ) {
        return { is_valid: false, error_message: rule.error_message };
      }
      if (
        rule.rule_type === "max_length" &&
        typeof value === "string" &&
        value.length > rule.rule_value
      ) {
        return { is_valid: false, error_message: rule.error_message };
      }
      if (
        rule.rule_type === "min_value" &&
        typeof value === "number" &&
        value < rule.rule_value
      ) {
        return { is_valid: false, error_message: rule.error_message };
      }
      if (
        rule.rule_type === "max_value" &&
        typeof value === "number" &&
        value > rule.rule_value
      ) {
        return { is_valid: false, error_message: rule.error_message };
      }
      if (
        rule.rule_type === "pattern" &&
        typeof value === "string" &&
        !new RegExp(rule.rule_value).test(value)
      ) {
        return { is_valid: false, error_message: rule.error_message };
      }
    }
    return { is_valid: true, error_message: "" };
  }

  function handle_cancel_action(): void {
    const event_name = is_inline_mode ? "inline_cancel" : "cancel";
    dispatch(event_name);
  }

  function handle_generate_fake_data(): void {
    if (!entity_metadata || is_edit_mode) return;

    const fake_data_result =
      fakeDataGenerator.generate_fake_data_for_entity_fields(
        entity_metadata.fields,
      );

    if (fake_data_result.success) {
      // Merge the generated fake data with existing form data
      form_data = {
        ...form_data,
        ...fake_data_result.generated_data,
      };

      // Clear any existing validation errors
      validation_errors = {};

      console.log("Generated fake data:", fake_data_result.debug_info);
    } else {
      console.error(
        "Failed to generate fake data:",
        fake_data_result.error_message,
      );
    }
  }

  function should_show_fake_data_button(): boolean {
    return (
      show_fake_data_button &&
      !is_edit_mode &&
      fakeDataGenerator.is_fake_data_generation_enabled()
    );
  }

  function get_display_value_for_foreign_key(
    field_name: string,
    value: string,
  ): string {
    const options = foreign_key_options[field_name] || [];
    const normalized_value = String(value ?? "").trim();
    const found_option = options.find((option) => {
      const option_id = String((option as BaseEntity).id ?? "").trim();
      return option_id === normalized_value;
    });
    if (found_option) return build_entity_display_label(found_option);
    return normalized_value;
  }

  function update_form_field_value(field_name: string, value: string): boolean {
    form_data[field_name] = value;
    return true;
  }

  function build_enum_select_options(
    field: FieldMetadata,
  ): { value: string; label: string }[] {
    if (!field.enum_values) return [];
    return field.enum_values.map((option) => ({
      value: option,
      label: option,
    }));
  }

  function build_foreign_key_select_options(
    field: FieldMetadata,
    options_map: Record<string, BaseEntity[]>,
  ): { value: string; label: string }[] {
    const entities = options_map[field.field_name] || [];

    const options = entities
      .map((entity) => {
        const entity_id = String((entity as BaseEntity).id ?? "").trim();
        if (entity_id.length === 0) return null;
        return {
          value: entity_id,
          label: String(build_entity_display_label(entity)),
        };
      })
      .filter((option): option is { value: string; label: string } =>
        Boolean(option),
      );

    return options;
  }

  function get_foreign_key_option_count(field_name: string): number {
    return (foreign_key_options[field_name] || []).length;
  }

  function build_foreign_entity_route(entity_type: string | undefined): string {
    const normalized =
      typeof entity_type === "string" ? entity_type.toLowerCase() : "";
    if (normalized === "player") return "/players";
    if (normalized === "team") return "/teams";
    if (normalized === "organization") return "/organizations";
    if (normalized === "competition") return "/competitions";
    if (normalized === "fixture") return "/fixtures";
    if (normalized === "playerposition") return "/player-positions";
    if (normalized === "venue") return "/venues";
    return "";
  }

  function build_foreign_entity_cta_label(
    entity_type: string | undefined,
  ): string {
    const normalized =
      typeof entity_type === "string" ? entity_type.toLowerCase() : "";
    if (normalized === "player") return "Create Players";
    if (normalized === "team") return "Create Teams";
    if (normalized === "organization") return "Create Organizations";
    if (normalized === "competition") return "Create Competitions";
    if (normalized === "fixture") return "Create Fixtures";
    if (normalized === "playerposition") return "Create Player Positions";
    if (normalized === "venue") return "Create Venues";
    return "Create";
  }

  function navigate_to_foreign_entity(
    entity_type: string | undefined,
  ): boolean {
    const route = build_foreign_entity_route(entity_type);
    if (!route) return false;
    goto(route);
    return true;
  }
</script>

<div class="w-full">
  {#if !entity_metadata}
    <div
      class="alert bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 p-4 rounded-lg"
    >
      <p>Error: No metadata found for entity type "{entity_type}"</p>
    </div>
  {:else}
    <div
      class={is_mobile_view
        ? "card p-4 sm:p-6 space-y-4"
        : "card p-4 sm:p-6 space-y-6"}
    >
      <div class="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h2
          class="text-lg sm:text-xl font-semibold text-accent-900 dark:text-accent-100"
        >
          {form_title}
        </h2>
        {#if is_loading}
          <p class="text-sm text-accent-600 dark:text-accent-400">
            Loading form options...
          </p>
        {/if}
      </div>

      <form
        on:submit|preventDefault={handle_form_submission}
        class={is_mobile_view ? "space-y-4" : "space-y-6"}
      >
        <!-- Dynamic field generation based on metadata -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {#each get_sorted_fields_for_display(entity_metadata.fields, is_edit_mode) as field}
            <div
              class="space-y-2 {field.field_type === 'file' ||
              (field.field_type === 'string' &&
                (field.field_name.includes('description') ||
                  field.field_name.includes('address') ||
                  field.field_name.includes('notes')))
                ? 'md:col-span-2'
                : ''}"
            >
              <label class="label" for={`field_${field.field_name}`}>
                {field.display_name}
                {#if field.is_required}
                  <span class="text-red-500 dark:text-red-400">*</span>
                {/if}
              </label>

              <!-- File/Image upload field -->

              {#if field.field_type === "file" && field.field_name
                  .toLowerCase()
                  .match(/(logo|profile|avatar|image|pic|photo)/)}
                <div class="flex flex-col items-center justify-center gap-2">
                  <div
                    class="relative group w-32 h-32 flex items-center justify-center"
                  >
                    {#key form_data[field.field_name]}
                      <img
                        src={form_data[field.field_name] &&
                        form_data[field.field_name].startsWith("data:image")
                          ? form_data[field.field_name]
                          : form_data[field.field_name]
                            ? form_data[field.field_name]
                            : "/no-image.svg"}
                        alt={field.display_name}
                        class="w-32 h-32 rounded-lg object-cover border-2 border-gray-300 dark:border-gray-600 shadow bg-accent-50 dark:bg-accent-900"
                        on:error={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src !== "/no-image.svg")
                            target.src = "/no-image.svg";
                        }}
                        draggable="false"
                      />
                    {/key}
                    <button
                      type="button"
                      class="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/60 rounded-lg transition group-hover:opacity-100 opacity-0"
                      style="border:none;"
                      on:click={() =>
                        document
                          .getElementById(`file_input_${field.field_name}`)
                          ?.click()}
                      tabindex="-1"
                      aria-label="Upload image"
                    >
                      <svg
                        class="w-10 h-10 text-white"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
                        />
                      </svg>
                    </button>
                    <input
                      id={`file_input_${field.field_name}`}
                      type="file"
                      accept="image/*"
                      class="hidden"
                      on:change={(e) =>
                        handle_file_input_change(e, field.field_name)}
                      disabled={field.is_read_only}
                    />
                  </div>
                  <span class="text-xs text-accent-500 dark:text-accent-300"
                    >Click to upload/change</span
                  >
                </div>
              {:else if field.field_type === "file"}
                <div class="flex items-center gap-3">
                  <input
                    id={`field_${field.field_name}`}
                    type="file"
                    accept="image/*"
                    class="block w-full text-sm text-accent-900 dark:text-accent-100
                      file:mr-4 file:py-2.5 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-secondary-100 dark:file:bg-secondary-800
                      file:text-secondary-700 dark:file:text-secondary-200
                      hover:file:bg-secondary-200 dark:hover:file:bg-secondary-700
                      file:cursor-pointer cursor-pointer file:transition-colors"
                    on:change={(e) =>
                      handle_file_input_change(e, field.field_name)}
                    disabled={field.is_read_only}
                  />
                  {#if form_data[field.field_name]}
                    <img
                      src={form_data[field.field_name]}
                      alt={field.display_name}
                      class="w-12 h-12 rounded object-cover border border-gray-300 dark:border-gray-600 shadow-sm bg-accent-50 dark:bg-accent-900"
                      on:error={hide_broken_image}
                    />
                  {/if}
                </div>

                <!-- String field (text or textarea) -->
              {:else if field.field_type === "string"}
                {#if field.field_name.includes("description") || field.field_name.includes("address") || field.field_name.includes("notes")}
                  <textarea
                    id={`field_${field.field_name}`}
                    class="input min-h-[100px]"
                    bind:value={form_data[field.field_name]}
                    placeholder={field.placeholder || field.display_name}
                    readonly={field.is_read_only}
                    rows="4"
                  ></textarea>
                {:else if field.field_name.toLowerCase().includes("color")}
                  <div class="flex items-center gap-3">
                    <input
                      id={`field_${field.field_name}_color`}
                      type="color"
                      class="w-10 h-10 p-0 border-0 bg-transparent cursor-pointer rounded shadow"
                      bind:value={form_data[field.field_name]}
                      disabled={field.is_read_only}
                    />
                    <input
                      id={`field_${field.field_name}`}
                      type="text"
                      class="input w-32"
                      bind:value={form_data[field.field_name]}
                      placeholder="#RRGGBB or rgb()"
                      readonly={field.is_read_only}
                    />
                    <span
                      class="inline-block w-8 h-8 rounded border border-gray-300 dark:border-gray-600 shadow-sm"
                      style={`background:${form_data[field.field_name] || "#eee"};`}
                    ></span>
                  </div>
                {:else if field.field_name
                  .toLowerCase()
                  .match(/(logo|profile|avatar|image|pic|photo)/)}
                  <div class="flex items-center gap-3">
                    <input
                      id={`field_${field.field_name}`}
                      type="text"
                      class="input"
                      bind:value={form_data[field.field_name]}
                      placeholder={field.placeholder || field.display_name}
                      readonly={field.is_read_only}
                    />
                    {#if form_data[field.field_name]}
                      <img
                        src={form_data[field.field_name]}
                        alt={field.display_name}
                        class="w-12 h-12 rounded-full object-cover border border-gray-300 dark:border-gray-600 shadow-sm bg-accent-50 dark:bg-accent-900"
                        on:error={hide_broken_image}
                      />
                    {/if}
                  </div>
                {:else}
                  <input
                    id={`field_${field.field_name}`}
                    type={get_input_type_for_field(field)}
                    class="input"
                    bind:value={form_data[field.field_name]}
                    placeholder={field.placeholder || field.display_name}
                    readonly={field.is_read_only}
                  />
                {/if}

                <!-- Number field -->
              {:else if field.field_type === "number"}
                <input
                  id={`field_${field.field_name}`}
                  type="number"
                  class="input"
                  bind:value={form_data[field.field_name]}
                  placeholder={field.placeholder || field.display_name}
                  readonly={field.is_read_only}
                  min={field.field_name.includes("age") ||
                  field.field_name.includes("number") ||
                  field.field_name.includes("order")
                    ? 0
                    : undefined}
                  max={field.field_name.includes("age") ? 120 : undefined}
                  step={field.field_name.includes("price") ||
                  field.field_name.includes("amount") ||
                  field.field_name.includes("cost")
                    ? "0.01"
                    : "1"}
                />

                <!-- Boolean field -->
              {:else if field.field_type === "boolean"}
                <div class="flex items-center space-x-3">
                  <input
                    id={`field_${field.field_name}`}
                    type="checkbox"
                    class="w-5 h-5 text-secondary-600 dark:text-secondary-400 border-gray-300 dark:border-gray-600 rounded focus:ring-secondary-500 dark:focus:ring-secondary-400 cursor-pointer"
                    bind:checked={form_data[field.field_name]}
                    disabled={field.is_read_only}
                  />
                  <label
                    for={`field_${field.field_name}`}
                    class="text-sm text-accent-700 dark:text-accent-300 select-none cursor-pointer"
                  >
                    {form_data[field.field_name] ? "Yes" : "No"}
                  </label>
                </div>

                <!-- Date field -->
              {:else if field.field_type === "date"}
                <input
                  id={`field_${field.field_name}`}
                  type="date"
                  class="input"
                  bind:value={form_data[field.field_name]}
                  readonly={field.is_read_only}
                />

                <!-- Enum field (dropdown) -->
              {:else if field.field_type === "enum" && field.enum_values}
                <SearchableSelectField
                  label=""
                  name={field.field_name}
                  value={form_data[field.field_name]}
                  options={build_enum_select_options(field)}
                  placeholder={`Select ${field.display_name}`}
                  required={field.is_required}
                  disabled={field.is_read_only}
                  error={validation_errors[field.field_name] || ""}
                  on:change={(event) =>
                    update_form_field_value(
                      field.field_name,
                      event.detail.value,
                    )}
                />

                <!-- Foreign key field (dropdown) -->
              {:else if field.field_type === "foreign_key"}
                <SearchableSelectField
                  label=""
                  name={field.field_name}
                  value={form_data[field.field_name]}
                  options={build_foreign_key_select_options(
                    field,
                    foreign_key_options,
                  )}
                  placeholder={`Select ${field.display_name}`}
                  required={field.is_required}
                  disabled={field.is_read_only}
                  error={validation_errors[field.field_name] || ""}
                  {is_loading}
                  on:change={(event) =>
                    update_form_field_value(
                      field.field_name,
                      event.detail.value,
                    )}
                />

                {#if !is_loading && get_foreign_key_option_count(field.field_name) === 0}
                  <div
                    class="mt-2 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-100"
                  >
                    <div class="text-sm font-semibold">
                      No {field.display_name} options available.
                    </div>
                    <div class="text-sm mt-1">
                      Create at least one
                      {field.foreign_key_entity || "record"}
                      to continue.
                    </div>

                    {#if field.foreign_key_entity && build_foreign_entity_route(field.foreign_key_entity)}
                      <div class="mt-2">
                        <button
                          type="button"
                          class="btn btn-outline"
                          on:click={() =>
                            navigate_to_foreign_entity(
                              field.foreign_key_entity,
                            )}
                        >
                          {build_foreign_entity_cta_label(
                            field.foreign_key_entity,
                          )}
                        </button>
                      </div>
                    {/if}
                  </div>
                {/if}
              {/if}

              <!-- Field validation error display -->
              {#if validation_errors[field.field_name] && field.field_type !== "enum" && field.field_type !== "foreign_key"}
                <p class="mt-1 text-sm text-red-600 dark:text-red-300">
                  {validation_errors[field.field_name]}
                </p>
              {/if}
            </div>
          {/each}
        </div>

        <!-- Sub-Entity Sections (rendered dynamically based on metadata) -->
        {#each sub_entity_fields as sub_entity_field}
          {#if is_edit_mode && entity_data?.id}
            {@const sub_filter = build_sub_entity_filter(
              sub_entity_field,
              entity_data,
            )}
            <div
              class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"
            >
              <h3
                class="text-lg font-medium text-accent-900 dark:text-accent-100 mb-4"
              >
                {sub_entity_field.display_name}
              </h3>
              {#if sub_filter && sub_entity_field.sub_entity_config}
                <DynamicEntityList
                  entity_type={sub_entity_field.sub_entity_config
                    .child_entity_type}
                  sub_entity_filter={sub_filter}
                  compact_mode={true}
                  show_actions={true}
                />
              {/if}
            </div>
          {:else}
            <div
              class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
            >
              <p class="text-sm text-blue-700 dark:text-blue-300">
                <strong>Note:</strong> After saving this record, you'll be able
                to manage {sub_entity_field.display_name.toLowerCase()}.
              </p>
            </div>
          {/if}
        {/each}

        <!-- Form action buttons with secondary color theme -->
        <div
          class="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 mt-6 border-t border-gray-200 dark:border-gray-700"
        >
          {#if should_show_fake_data_button()}
            <button
              type="button"
              class="btn btn-ghost w-full sm:w-auto order-1 sm:order-1 flex items-center justify-center gap-2"
              on:click={handle_generate_fake_data}
              disabled={is_save_in_progress}
              title="Generate realistic fake data for testing"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                ></path>
              </svg>
              <span class="hidden sm:inline">Fill with Fake Data</span>
              <span class="sm:hidden">Fake Data</span>
            </button>
          {/if}
          <button
            type="button"
            class="btn btn-outline w-full sm:w-auto order-2 sm:order-2"
            on:click={handle_cancel_action}
            disabled={is_save_in_progress}
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-secondary w-full sm:w-auto order-3 sm:order-3"
            disabled={is_save_in_progress || is_loading}
          >
            {#if is_save_in_progress}
              Saving...
            {:else}
              {is_edit_mode ? "Update" : "Create"}
              {entity_metadata.display_name}
            {/if}
          </button>
        </div>
      </form>
    </div>
  {/if}
</div>
