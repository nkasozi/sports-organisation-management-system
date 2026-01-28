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
  import { get_competition_team_use_cases } from "../../core/usecases/CompetitionTeamUseCases";
  import SearchableSelectField from "./ui/SearchableSelectField.svelte";
  import DynamicEntityList from "./DynamicEntityList.svelte";
  import type { SubEntityFilter } from "$lib/core/types/SubEntityFilter";
  import { build_entity_display_label } from "../logic/dynamicFormLogic";
  import { detect_jersey_color_clashes } from "../../core/entities/Fixture";
  import type { JerseyColor } from "../../core/entities/JerseyColor";
  import type {
    EntityCrudHandlers,
    EntityViewCallbacks,
  } from "$lib/core/types/EntityHandlers";
  import OfficialAssignmentArray from "./OfficialAssignmentArray.svelte";
  import { create_empty_official_assignment } from "../../core/entities/FixtureDetailsSetup";
  import type { OfficialAssignment } from "../../core/entities/FixtureDetailsSetup";

  export let entity_type: string;
  export let entity_data: Partial<BaseEntity> | null = null;
  export let show_fake_data_button: boolean = true;
  export let is_mobile_view: boolean = true;
  export let is_inline_mode: boolean = false;
  export let crud_handlers: EntityCrudHandlers | null = null;
  export let view_callbacks: EntityViewCallbacks | null = null;
  export let sub_entity_filter: SubEntityFilter | null = null;
  export let button_color_class: string = "btn-primary-action";

  $: has_custom_handlers = crud_handlers !== null;

  const dispatch = createEventDispatcher<{
    inline_save_success: { entity: BaseEntity };
    inline_cancel: void;
  }>();

  const competition_team_use_cases = get_competition_team_use_cases();

  let form_data: Record<string, any> = {};
  let validation_errors: Record<string, string> = {};
  let is_loading: boolean = false;
  let is_save_in_progress: boolean = false;
  let foreign_key_options: Record<string, BaseEntity[]> = {};
  let filtered_fields_loading: Record<string, boolean> = {};
  let color_clash_warnings: string[] = [];
  let competition_team_ids: Set<string> = new Set();

  $: entity_metadata = get_entity_metadata_for_type(entity_type);
  $: is_edit_mode = determine_if_edit_mode(entity_data);
  $: form_title = build_form_title(
    entity_metadata?.display_name || "",
    is_edit_mode,
  );
  $: sub_entity_fields = get_sub_entity_fields(entity_metadata);

  $: {
    if (entity_metadata) {
      initialize_form_data_for_entity(entity_metadata, entity_data);
      if (browser) {
        void load_foreign_key_options_for_all_fields(entity_metadata.fields);
        void load_filtered_options_for_edit_mode(entity_metadata, entity_data);
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

  function format_entity_display_name(raw_name: string): string {
    if (typeof raw_name !== "string" || raw_name.length === 0) return "Entity";
    const with_spaces = raw_name
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/_/g, " ");
    return with_spaces
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  function build_form_title(display_name: string, edit_mode: boolean): string {
    const action = edit_mode ? "Edit" : "Create";
    const formatted_name =
      display_name.length > 0
        ? display_name
        : format_entity_display_name(entity_type);
    return `${action} ${formatted_name}`;
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

  function build_sub_entity_crud_handlers(
    child_entity_type: string,
    sub_filter: SubEntityFilter,
  ): EntityCrudHandlers {
    const child_use_cases = get_use_cases_for_entity_type(child_entity_type);

    if (!child_use_cases) {
      console.error(
        `[SUB_ENTITY] No use cases found for child entity type: ${child_entity_type}`,
      );
      return {};
    }

    return {
      create: async (input: Record<string, unknown>) => {
        const enriched_input = {
          ...input,
          [sub_filter.foreign_key_field]: sub_filter.foreign_key_value,
        };
        if (sub_filter.holder_type_field && sub_filter.holder_type_value) {
          enriched_input[sub_filter.holder_type_field] =
            sub_filter.holder_type_value;
        }
        console.log(
          `[SUB_ENTITY] Creating ${child_entity_type} with enriched input:`,
          enriched_input,
        );
        return child_use_cases.create(enriched_input);
      },
      update: async (id: string, input: Record<string, unknown>) => {
        console.log(`[SUB_ENTITY] Updating ${child_entity_type} id=${id}`);
        return child_use_cases.update(id, input);
      },
      delete: async (id: string) => {
        console.log(`[SUB_ENTITY] Deleting ${child_entity_type} id=${id}`);
        return child_use_cases.delete(id);
      },
      list: async (
        filter?: Record<string, string>,
        options?: { page_number?: number; page_size?: number },
      ) => {
        const merged_filter = {
          ...filter,
          [sub_filter.foreign_key_field]: sub_filter.foreign_key_value,
        };
        if (sub_filter.holder_type_field && sub_filter.holder_type_value) {
          merged_filter[sub_filter.holder_type_field] =
            sub_filter.holder_type_value;
        }
        console.log(
          `[SUB_ENTITY] Listing ${child_entity_type} with filter:`,
          merged_filter,
        );
        return child_use_cases.list(merged_filter, options);
      },
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
    if (field.field_type === "official_assignment_array")
      return [create_empty_official_assignment()];
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
      if (
        is_field_controlled_by_sub_entity_filter(
          f.field_name,
          sub_entity_filter,
        )
      )
        return false;
      return true;
    });
    const file_fields = visible_fields.filter((f) => f.field_type === "file");
    const other_fields = visible_fields.filter((f) => f.field_type !== "file");
    return [...file_fields, ...other_fields];
  }

  function is_field_controlled_by_sub_entity_filter(
    field_name: string,
    filter: SubEntityFilter | null,
  ): boolean {
    if (!filter) return false;
    if (field_name === filter.foreign_key_field) return true;
    if (filter.holder_type_field && field_name === filter.holder_type_field)
      return true;
    return false;
  }

  function should_field_be_read_only(field: FieldMetadata): boolean {
    if (field.is_read_only) return true;
    if (field.is_read_only_on_edit && is_edit_mode) return true;
    return is_field_controlled_by_sub_entity_filter(
      field.field_name,
      sub_entity_filter,
    );
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
        if (field.foreign_key_filter) {
          continue;
        }
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

    foreign_key_options = { ...foreign_key_options, ...new_options };
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

  async function load_filtered_foreign_key_options(
    field: FieldMetadata,
    dependency_value: string,
  ): Promise<void> {
    if (!field.foreign_key_filter || !dependency_value) {
      foreign_key_options[field.field_name] = [];
      filtered_fields_loading = {
        ...filtered_fields_loading,
        [field.field_name]: false,
      };
      return;
    }

    filtered_fields_loading = {
      ...filtered_fields_loading,
      [field.field_name]: true,
    };

    const filter_config = field.foreign_key_filter;

    if (filter_config.filter_type === "teams_from_competition") {
      await load_teams_from_competition(field, dependency_value);
      return;
    }

    await load_filtered_jersey_options_internal(field, dependency_value);
  }

  async function load_teams_from_competition(
    field: FieldMetadata,
    competition_id: string,
  ): Promise<void> {
    const comp_teams_result =
      await competition_team_use_cases.list_teams_in_competition(
        competition_id,
        { page_size: 100 },
      );

    if (!comp_teams_result.success) {
      console.warn(
        "[FILTERED_FK] Failed to load competition teams:",
        competition_id,
      );
      foreign_key_options[field.field_name] = [];
      all_competition_teams_cache = [];
      filtered_fields_loading = {
        ...filtered_fields_loading,
        [field.field_name]: false,
      };
      return;
    }

    const competition_teams = comp_teams_result.data.items;
    competition_team_ids = new Set(competition_teams.map((ct) => ct.team_id));

    const team_use_cases = get_use_cases_for_entity_type("team");
    if (!team_use_cases) {
      console.warn("[FILTERED_FK] Missing team use cases");
      all_competition_teams_cache = [];
      filtered_fields_loading = {
        ...filtered_fields_loading,
        [field.field_name]: false,
      };
      return;
    }

    const all_teams_result = await team_use_cases.list();
    if (!all_teams_result.success) {
      console.warn("[FILTERED_FK] Failed to load teams");
      all_competition_teams_cache = [];
      filtered_fields_loading = {
        ...filtered_fields_loading,
        [field.field_name]: false,
      };
      return;
    }

    const all_teams_data = all_teams_result.data as unknown;
    const all_teams: BaseEntity[] = Array.isArray(all_teams_data)
      ? (all_teams_data as BaseEntity[])
      : Array.isArray((all_teams_data as { items?: unknown })?.items)
        ? ((all_teams_data as { items: unknown[] })
            .items as unknown as BaseEntity[])
        : [];

    const filtered_teams = all_teams.filter((team) =>
      competition_team_ids.has(team.id),
    );

    all_competition_teams_cache = [...filtered_teams];

    const exclude_field = field.foreign_key_filter?.exclude_field;
    const exclude_value = exclude_field ? form_data[exclude_field] : null;

    const final_teams = exclude_value
      ? filtered_teams.filter((team) => team.id !== exclude_value)
      : filtered_teams;

    console.debug("[FILTERED_FK] Loaded competition teams", {
      field: field.field_name,
      competition_id,
      total_competition_teams: competition_teams.length,
      filtered_count: final_teams.length,
      exclude_field,
      exclude_value,
    });

    foreign_key_options = {
      ...foreign_key_options,
      [field.field_name]: final_teams,
    };

    filtered_fields_loading = {
      ...filtered_fields_loading,
      [field.field_name]: false,
    };
  }

  async function load_filtered_jersey_options_internal(
    field: FieldMetadata,
    fixture_id: string,
  ): Promise<void> {
    const filter_config = field.foreign_key_filter;
    if (!filter_config) return;

    const fixture_use_cases = get_use_cases_for_entity_type("fixture");
    const jersey_use_cases = get_use_cases_for_entity_type("jerseycolor");

    if (!fixture_use_cases || !jersey_use_cases) {
      console.warn("[FILTERED_FK] Missing use cases for filtered foreign key");
      filtered_fields_loading = {
        ...filtered_fields_loading,
        [field.field_name]: false,
      };
      return;
    }

    const fixture_result = await fixture_use_cases.get_by_id(fixture_id);
    if (!fixture_result.success || !fixture_result.data) {
      console.warn("[FILTERED_FK] Could not load fixture:", fixture_id);
      filtered_fields_loading = {
        ...filtered_fields_loading,
        [field.field_name]: false,
      };
      return;
    }

    const fixture = fixture_result.data as any;
    let filter_holder_id = "";
    let filter_holder_type = "";

    if (filter_config.filter_type === "team_jersey_from_fixture") {
      filter_holder_type = "team";
      filter_holder_id =
        filter_config.team_side === "home"
          ? fixture.home_team_id
          : fixture.away_team_id;
    } else if (
      filter_config.filter_type === "official_jersey_from_competition"
    ) {
      filter_holder_type = "competition_official";
      filter_holder_id = fixture.competition_id;
    }

    if (!filter_holder_id) {
      console.warn("[FILTERED_FK] No holder ID found for filter");
      foreign_key_options[field.field_name] = [];
      filtered_fields_loading = {
        ...filtered_fields_loading,
        [field.field_name]: false,
      };
      return;
    }

    const jersey_result = await jersey_use_cases.list({
      holder_type: filter_holder_type,
      holder_id: filter_holder_id,
    });

    if (jersey_result.success) {
      const data = jersey_result.data as unknown;
      const jerseys: BaseEntity[] = Array.isArray(data)
        ? (data as BaseEntity[])
        : Array.isArray((data as { items?: unknown })?.items)
          ? ((data as { items: unknown[] }).items as unknown as BaseEntity[])
          : [];

      console.debug("[FILTERED_FK] Loaded filtered jersey options", {
        field: field.field_name,
        filter_type: filter_config.filter_type,
        holder_type: filter_holder_type,
        holder_id: filter_holder_id,
        count: jerseys.length,
      });

      foreign_key_options = {
        ...foreign_key_options,
        [field.field_name]: jerseys,
      };
    }

    filtered_fields_loading = {
      ...filtered_fields_loading,
      [field.field_name]: false,
    };
    check_jersey_color_clashes();
  }

  let all_competition_teams_cache: BaseEntity[] = [];

  function update_team_exclusion_filter(changed_field_name: string): void {
    if (!entity_metadata) return;
    if (all_competition_teams_cache.length === 0) return;

    for (const field of entity_metadata.fields) {
      if (
        field.foreign_key_filter?.filter_type === "teams_from_competition" &&
        field.foreign_key_filter?.exclude_field === changed_field_name
      ) {
        const exclude_value = form_data[changed_field_name];
        const filtered_teams = exclude_value
          ? all_competition_teams_cache.filter(
              (team) => team.id !== exclude_value,
            )
          : [...all_competition_teams_cache];

        foreign_key_options = {
          ...foreign_key_options,
          [field.field_name]: filtered_teams,
        };
      }
    }
  }

  async function auto_set_venue_from_home_team(
    home_team_id: string,
  ): Promise<void> {
    if (!home_team_id) return;
    if (entity_type.toLowerCase() !== "fixture") return;

    const selected_team = all_competition_teams_cache.find(
      (team) => team.id === home_team_id,
    ) as { home_venue_id?: string } | undefined;

    if (!selected_team?.home_venue_id) {
      console.debug("[AUTO_VENUE] No home venue found for team:", home_team_id);
      return;
    }

    const venue_use_cases = get_use_cases_for_entity_type("venue");
    if (!venue_use_cases) {
      console.warn("[AUTO_VENUE] Missing venue use cases");
      return;
    }

    const venue_result = await venue_use_cases.get_by_id(
      selected_team.home_venue_id,
    );
    if (!venue_result.success || !venue_result.data) {
      console.warn(
        "[AUTO_VENUE] Failed to load venue:",
        selected_team.home_venue_id,
      );
      return;
    }

    const venue = venue_result.data as { name?: string };
    if (venue.name) {
      form_data["venue"] = venue.name;
      console.debug("[AUTO_VENUE] Set venue to:", venue.name);
    }
  }

  async function handle_dependency_field_change(
    changed_field_name: string,
    new_value: string,
  ): Promise<void> {
    if (!entity_metadata) return;

    for (const field of entity_metadata.fields) {
      if (
        field.foreign_key_filter &&
        field.foreign_key_filter.depends_on_field === changed_field_name
      ) {
        form_data[field.field_name] = "";
        await load_filtered_foreign_key_options(field, new_value);
      }
    }

    update_team_exclusion_filter(changed_field_name);

    if (changed_field_name === "home_team_id") {
      await auto_set_venue_from_home_team(new_value);
    }

    if (changed_field_name.includes("jersey")) {
      check_jersey_color_clashes();
    }
  }

  async function load_filtered_options_for_edit_mode(
    metadata: EntityMetadata,
    data: Partial<BaseEntity> | null,
  ): Promise<void> {
    if (!data || !data.id) return;

    for (const field of metadata.fields) {
      if (field.foreign_key_filter) {
        const dependency_field = field.foreign_key_filter.depends_on_field;
        const dependency_value = (data as Record<string, unknown>)[
          dependency_field
        ];
        if (dependency_value && typeof dependency_value === "string") {
          await load_filtered_foreign_key_options(field, dependency_value);
        }
      }
    }
  }

  function check_jersey_color_clashes(): void {
    if (entity_type.toLowerCase() !== "fixturedetailssetup") {
      color_clash_warnings = [];
      return;
    }

    const home_jersey_id = form_data["home_team_jersey_id"];
    const away_jersey_id = form_data["away_team_jersey_id"];
    const official_jersey_id = form_data["official_jersey_id"];

    const home_jerseys = foreign_key_options["home_team_jersey_id"] || [];
    const away_jerseys = foreign_key_options["away_team_jersey_id"] || [];
    const official_jerseys = foreign_key_options["official_jersey_id"] || [];

    const home_jersey = home_jerseys.find((j) => j.id === home_jersey_id) as
      | JerseyColor
      | undefined;
    const away_jersey = away_jerseys.find((j) => j.id === away_jersey_id) as
      | JerseyColor
      | undefined;
    const official_jersey = official_jerseys.find(
      (j) => j.id === official_jersey_id,
    ) as JerseyColor | undefined;

    console.log("[COLOR_CLASH] Checking jersey color clashes:", {
      home_jersey_id,
      away_jersey_id,
      official_jersey_id,
      home_jersey: home_jersey
        ? {
            id: home_jersey.id,
            nickname: home_jersey.nickname,
            main_color: home_jersey.main_color,
          }
        : null,
      away_jersey: away_jersey
        ? {
            id: away_jersey.id,
            nickname: away_jersey.nickname,
            main_color: away_jersey.main_color,
          }
        : null,
      official_jersey: official_jersey
        ? {
            id: official_jersey.id,
            nickname: official_jersey.nickname,
            main_color: official_jersey.main_color,
          }
        : null,
    });

    const home_assignment = home_jersey
      ? {
          jersey_color_id: home_jersey.id,
          nickname: home_jersey.nickname,
          main_color: home_jersey.main_color,
        }
      : undefined;
    const away_assignment = away_jersey
      ? {
          jersey_color_id: away_jersey.id,
          nickname: away_jersey.nickname,
          main_color: away_jersey.main_color,
        }
      : undefined;
    const official_assignment = official_jersey
      ? {
          jersey_color_id: official_jersey.id,
          nickname: official_jersey.nickname,
          main_color: official_jersey.main_color,
        }
      : undefined;

    const all_warnings: string[] = [];

    const team_warnings = detect_jersey_color_clashes(
      home_assignment,
      away_assignment,
      official_assignment,
      "Home Team",
      "Away Team",
    );

    console.log("[COLOR_CLASH] Detection result:", {
      warnings_count: team_warnings.length,
      warnings: team_warnings,
    });

    all_warnings.push(...team_warnings.map((w) => w.message));

    color_clash_warnings = all_warnings;
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

      if (is_edit_mode && entity_data?.id) {
        if (crud_handlers?.update) {
          console.log(
            `[ENTITY_FORM] Using custom update handler for "${entity_type}"`,
          );
          save_result = await crud_handlers.update(entity_data.id, form_data);
        } else {
          const normalized_type = entity_type.toLowerCase();
          const use_cases = get_use_cases_for_entity_type(normalized_type);
          if (!use_cases) {
            console.error(`No use cases found for entity type: ${entity_type}`);
            is_save_in_progress = false;
            return;
          }
          if (typeof use_cases.update !== "function") {
            console.error(
              `Method update not found on use cases for ${entity_type}`,
            );
            is_save_in_progress = false;
            return;
          }
          save_result = await use_cases.update(entity_data.id, form_data);
        }
      } else {
        if (crud_handlers?.create) {
          console.log(
            `[ENTITY_FORM] Using custom create handler for "${entity_type}"`,
          );
          save_result = await crud_handlers.create(form_data);
        } else {
          const normalized_type = entity_type.toLowerCase();
          const use_cases = get_use_cases_for_entity_type(normalized_type);
          if (!use_cases) {
            console.error(`No use cases found for entity type: ${entity_type}`);
            is_save_in_progress = false;
            return;
          }
          if (typeof use_cases.create !== "function") {
            console.error(
              `Method create not found on use cases for ${entity_type}`,
            );
            is_save_in_progress = false;
            return;
          }
          save_result = await use_cases.create(form_data);
        }
      }

      is_save_in_progress = false;

      if (save_result.success && save_result.data) {
        const saved_entity = save_result.data;
        const was_new_entity = !is_edit_mode;

        if (is_inline_mode) {
          dispatch("inline_save_success", { entity: saved_entity });
        } else if (view_callbacks?.on_save_completed) {
          console.debug(
            "[DynamicEntityForm] Calling on_save_completed callback",
          );
          view_callbacks.on_save_completed(saved_entity, was_new_entity);
        }
      } else {
        const error_msg = save_result.error_message || "Unknown error occurred";
        console.error("[DynamicEntityForm] Save failed:", error_msg);
        validation_errors = save_result.validation_errors || {};
      }
    } catch (error) {
      is_save_in_progress = false;
      console.error(
        `[DynamicEntityForm] Failed to save ${entity_metadata.display_name}:`,
        error,
      );
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
    if (is_inline_mode) {
      dispatch("inline_cancel");
    } else if (view_callbacks?.on_cancel) {
      console.debug("[DynamicEntityForm] Calling on_cancel callback");
      view_callbacks.on_cancel();
    }
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

  function find_dependent_enum_fields(
    parent_field_name: string,
  ): FieldMetadata[] {
    if (!entity_metadata) return [];
    return entity_metadata.fields.filter(
      (field) =>
        field.enum_dependency &&
        field.enum_dependency.depends_on_field === parent_field_name,
    );
  }

  function clear_dependent_enum_values(parent_field_name: string): void {
    const dependent_fields = find_dependent_enum_fields(parent_field_name);
    for (const field of dependent_fields) {
      form_data[field.field_name] = "";
    }
  }

  function update_form_field_value(
    field_name: string,
    value: string | OfficialAssignment[],
  ): boolean {
    form_data[field_name] = value;
    clear_dependent_enum_values(field_name);
    return true;
  }

  function format_enum_label(value: string): string {
    return value
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  function build_enum_select_options(
    field: FieldMetadata,
  ): { value: string; label: string }[] {
    if (field.enum_dependency) {
      const dependency_value =
        form_data[field.enum_dependency.depends_on_field];
      if (!dependency_value) return [];
      const options = field.enum_dependency.options_map[dependency_value];
      return options || [];
    }

    if (field.enum_options) {
      return field.enum_options;
    }

    if (!field.enum_values) return [];
    return field.enum_values.map((option) => ({
      value: option,
      label: format_enum_label(option),
    }));
  }

  function has_enum_options(field: FieldMetadata): boolean {
    if (field.enum_options && field.enum_options.length > 0) return true;
    if (field.enum_values && field.enum_values.length > 0) return true;
    if (field.enum_dependency) return true;
    return false;
  }

  function is_jersey_color_field(field: FieldMetadata): boolean {
    return field.foreign_key_entity?.toLowerCase() === "jerseycolor";
  }

  function build_foreign_key_select_options(
    field: FieldMetadata,
    options_map: Record<string, BaseEntity[]>,
  ): { value: string; label: string; color_swatch?: string }[] {
    const entities = options_map[field.field_name] || [];
    const is_jersey_field = is_jersey_color_field(field);

    const options = entities
      .map((entity) => {
        const entity_id = String((entity as BaseEntity).id ?? "").trim();
        if (entity_id.length === 0) return null;

        const option: { value: string; label: string; color_swatch?: string } =
          {
            value: entity_id,
            label: String(build_entity_display_label(entity)),
          };

        if (is_jersey_field) {
          const jersey = entity as unknown as { main_color?: string };
          if (jersey.main_color) {
            option.color_swatch = jersey.main_color;
          }
        }

        return option;
      })
      .filter(
        (
          option,
        ): option is { value: string; label: string; color_swatch?: string } =>
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
                      disabled={should_field_be_read_only(field)}
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
                    disabled={should_field_be_read_only(field)}
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
                    readonly={should_field_be_read_only(field)}
                    rows="4"
                  ></textarea>
                {:else if field.field_name.toLowerCase().includes("color")}
                  <div class="flex items-center gap-3">
                    <input
                      id={`field_${field.field_name}_color`}
                      type="color"
                      class="w-10 h-10 p-0 border-0 bg-transparent cursor-pointer rounded shadow"
                      bind:value={form_data[field.field_name]}
                      disabled={should_field_be_read_only(field)}
                    />
                    <input
                      id={`field_${field.field_name}`}
                      type="text"
                      class="input w-32"
                      bind:value={form_data[field.field_name]}
                      placeholder="#RRGGBB or rgb()"
                      readonly={should_field_be_read_only(field)}
                    />
                    <span
                      class="inline-block w-8 h-8 rounded border border-gray-300 dark:border-gray-600 shadow-sm"
                      style={`background:${form_data[field.field_name] || "#eee"};`}
                    ></span>
                  </div>
                {:else if field.field_name
                  .toLowerCase()
                  .match(/(logo|avatar|image|pic|photo)/) && !field.field_name
                    .toLowerCase()
                    .includes("summary")}
                  <div class="flex items-center gap-3">
                    <input
                      id={`field_${field.field_name}`}
                      type="text"
                      class="input"
                      bind:value={form_data[field.field_name]}
                      placeholder={field.placeholder || field.display_name}
                      readonly={should_field_be_read_only(field)}
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
                    readonly={should_field_be_read_only(field)}
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
                  readonly={should_field_be_read_only(field)}
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
                    disabled={should_field_be_read_only(field)}
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
                  readonly={should_field_be_read_only(field)}
                />

                <!-- Enum field (dropdown) -->
              {:else if field.field_type === "enum" && has_enum_options(field)}
                <SearchableSelectField
                  label=""
                  name={field.field_name}
                  value={form_data[field.field_name]}
                  options={build_enum_select_options(field)}
                  placeholder={field.enum_dependency &&
                  !form_data[field.enum_dependency.depends_on_field]
                    ? `First select ${field.enum_dependency.depends_on_field.replace("_", " ")}`
                    : `Select ${field.display_name}`}
                  required={field.is_required}
                  disabled={should_field_be_read_only(field) ||
                    (field.enum_dependency &&
                      !form_data[field.enum_dependency.depends_on_field])}
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
                  placeholder={field.foreign_key_filter &&
                  !form_data[field.foreign_key_filter.depends_on_field]
                    ? `First select ${field.foreign_key_filter.depends_on_field.replace("_id", "")}`
                    : `Select ${field.display_name}`}
                  required={field.is_required}
                  disabled={should_field_be_read_only(field) ||
                    (field.foreign_key_filter &&
                      !form_data[field.foreign_key_filter.depends_on_field])}
                  error={validation_errors[field.field_name] || ""}
                  {is_loading}
                  on:change={(event) => {
                    update_form_field_value(
                      field.field_name,
                      event.detail.value,
                    );
                    handle_dependency_field_change(
                      field.field_name,
                      event.detail.value,
                    );
                  }}
                />

                {#if !is_loading && get_foreign_key_option_count(field.field_name) === 0 && !field.foreign_key_filter}
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
                {:else if !is_loading && !filtered_fields_loading[field.field_name] && get_foreign_key_option_count(field.field_name) === 0 && field.foreign_key_filter && form_data[field.foreign_key_filter.depends_on_field]}
                  <div
                    class="mt-2 p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100"
                  >
                    <div class="text-sm">
                      No {field.display_name.toLowerCase()} found for the selected
                      {field.foreign_key_filter.depends_on_field.replace(
                        "_id",
                        "",
                      )}.
                    </div>
                  </div>
                {/if}

                <!-- Official Assignment Array (multiple officials with roles and jerseys) -->
              {:else if field.field_type === "official_assignment_array"}
                <OfficialAssignmentArray
                  assignments={form_data[field.field_name] || []}
                  disabled={should_field_be_read_only(field)}
                  errors={validation_errors}
                  on:change={(e) => {
                    update_form_field_value(
                      field.field_name,
                      e.detail.assignments,
                    );
                  }}
                />
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
            {@const sub_entity_handlers =
              sub_filter && sub_entity_field.sub_entity_config
                ? build_sub_entity_crud_handlers(
                    sub_entity_field.sub_entity_config.child_entity_type,
                    sub_filter,
                  )
                : null}
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
                  crud_handlers={sub_entity_handlers}
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

        <!-- Jersey Color Clash Warnings -->
        {#if color_clash_warnings.length > 0}
          <div
            class="mt-4 p-4 rounded-lg border border-orange-300 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/30"
          >
            <div class="flex items-start gap-3">
              <svg
                class="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <div
                  class="text-sm font-semibold text-orange-800 dark:text-orange-200"
                >
                  Jersey Color Clash Detected
                </div>
                <ul
                  class="mt-1 text-sm text-orange-700 dark:text-orange-300 list-disc list-inside"
                >
                  {#each color_clash_warnings as warning}
                    <li>{warning}</li>
                  {/each}
                </ul>
              </div>
            </div>
          </div>
        {/if}

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
            class="btn {button_color_class} w-full sm:w-auto order-3 sm:order-3"
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
