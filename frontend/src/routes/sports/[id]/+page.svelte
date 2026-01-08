<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import type {
    Sport,
    UpdateSportInput,
    CardType,
    FoulCategory,
    SportGamePeriod,
    OfficialRequirement,
    ScoringRule,
  } from "$lib/domain/entities/Sport";
  import type { LoadingState } from "$lib/components/ui/LoadingStateWrapper.svelte";
  import { sportService } from "$lib/services/sportService";
  import LoadingStateWrapper from "$lib/components/ui/LoadingStateWrapper.svelte";
  import FormField from "$lib/components/ui/FormField.svelte";
  import EnumSelectField from "$lib/components/ui/EnumSelectField.svelte";
  import Toast from "$lib/components/ui/Toast.svelte";

  let sport: Sport | null = null;
  let form_data: UpdateSportInput = {};
  let loading_state: LoadingState = "idle";
  let error_message: string = "";
  let is_saving: boolean = false;
  let errors: Record<string, string> = {};
  let active_section: string = "basic";

  let toast_visible: boolean = false;
  let toast_message: string = "";
  let toast_type: "success" | "error" | "info" = "info";

  $: sport_id = $page.params.id ?? "";

  const status_options = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const severity_options = [
    { value: "warning", label: "Warning" },
    { value: "ejection", label: "Ejection" },
    { value: "suspension", label: "Suspension" },
  ];

  const foul_severity_options = [
    { value: "minor", label: "Minor" },
    { value: "moderate", label: "Moderate" },
    { value: "major", label: "Major" },
    { value: "severe", label: "Severe" },
  ];

  const overtime_trigger_options = [
    { value: "draw", label: "Any Draw" },
    { value: "knockout_draw", label: "Knockout Draw Only" },
    { value: "never", label: "Never" },
  ];

  const overtime_type_options = [
    { value: "extra_time", label: "Extra Time" },
    { value: "golden_goal", label: "Golden Goal" },
    { value: "silver_goal", label: "Silver Goal" },
    { value: "penalties", label: "Penalties" },
    { value: "replay", label: "Replay" },
    { value: "shootout", label: "Shootout" },
  ];

  const sections = [
    { id: "basic", label: "Basic Info" },
    { id: "periods", label: "Game Periods" },
    { id: "cards", label: "Card Types" },
    { id: "fouls", label: "Foul Categories" },
    { id: "officials", label: "Officials" },
    { id: "scoring", label: "Scoring" },
    { id: "overtime", label: "Overtime" },
    { id: "substitutions", label: "Substitutions" },
  ];

  onMount(() => {
    if (!sport_id) {
      loading_state = "error";
      error_message = "Sport ID is required";
      return;
    }
    load_sport();
  });

  async function load_sport(): Promise<void> {
    loading_state = "loading";

    const result = await sportService.get_by_id(sport_id);

    if (!result.success) {
      loading_state = "error";
      error_message = result.error || "Failed to load sport";
      return;
    }

    sport = result.data || null;
    if (!sport) {
      loading_state = "error";
      error_message = "Sport not found";
      return;
    }

    form_data = {
      name: sport.name,
      code: sport.code,
      description: sport.description,
      icon_url: sport.icon_url,
      status: sport.status,
      standard_game_duration_minutes: sport.standard_game_duration_minutes,
      max_players_on_field: sport.max_players_on_field,
      min_players_on_field: sport.min_players_on_field,
      max_squad_size: sport.max_squad_size,
      periods: sport.periods.map((p) => ({ ...p })),
      card_types: sport.card_types.map((c) => ({ ...c })),
      foul_categories: sport.foul_categories.map((f) => ({ ...f })),
      official_requirements: sport.official_requirements.map((o) => ({ ...o })),
      overtime_rules: { ...sport.overtime_rules },
      scoring_rules: sport.scoring_rules.map((s) => ({ ...s })),
      substitution_rules: { ...sport.substitution_rules },
      additional_rules: { ...sport.additional_rules },
    };
    loading_state = "success";
  }

  function generate_id(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
  }

  function add_game_period(): void {
    if (!form_data.periods) form_data.periods = [];
    const new_period: SportGamePeriod = {
      id: `period_${form_data.periods.length + 1}`,
      name: `Period ${form_data.periods.length + 1}`,
      duration_minutes: 15,
      is_break: false,
      order: form_data.periods.length + 1,
    };
    form_data.periods = [...form_data.periods, new_period];
  }

  function remove_game_period(index: number): void {
    if (!form_data.periods) return;
    form_data.periods = form_data.periods.filter((_, i) => i !== index);
    form_data.periods = form_data.periods.map((period, i) => ({
      ...period,
      order: i + 1,
    }));
  }

  function add_card_type(): void {
    if (!form_data.card_types) form_data.card_types = [];
    const new_card: CardType = {
      id: `card_${form_data.card_types.length + 1}`,
      name: "",
      color: "#FBBF24",
      severity: "warning",
      description: "",
      consequences: [],
    };
    form_data.card_types = [...form_data.card_types, new_card];
  }

  function remove_card_type(index: number): void {
    if (!form_data.card_types) return;
    form_data.card_types = form_data.card_types.filter((_, i) => i !== index);
  }

  function add_foul_category(): void {
    if (!form_data.foul_categories) form_data.foul_categories = [];
    const new_foul: FoulCategory = {
      id: `foul_${form_data.foul_categories.length + 1}`,
      name: "",
      severity: "minor",
      description: "",
      typical_penalty: "",
      results_in_card: null,
    };
    form_data.foul_categories = [...form_data.foul_categories, new_foul];
  }

  function remove_foul_category(index: number): void {
    if (!form_data.foul_categories) return;
    form_data.foul_categories = form_data.foul_categories.filter(
      (_, i) => i !== index
    );
  }

  function add_official_requirement(): void {
    if (!form_data.official_requirements) form_data.official_requirements = [];
    const new_official: OfficialRequirement = {
      role_id: `official_${form_data.official_requirements.length + 1}`,
      role_name: "",
      minimum_count: 1,
      maximum_count: 1,
      is_mandatory: true,
      description: "",
    };
    form_data.official_requirements = [
      ...form_data.official_requirements,
      new_official,
    ];
  }

  function remove_official_requirement(index: number): void {
    if (!form_data.official_requirements) return;
    form_data.official_requirements = form_data.official_requirements.filter(
      (_, i) => i !== index
    );
  }

  function add_scoring_rule(): void {
    if (!form_data.scoring_rules) form_data.scoring_rules = [];
    const new_rule: ScoringRule = {
      event_type: "",
      points_awarded: 1,
      description: "",
    };
    form_data.scoring_rules = [...form_data.scoring_rules, new_rule];
  }

  function remove_scoring_rule(index: number): void {
    if (!form_data.scoring_rules) return;
    form_data.scoring_rules = form_data.scoring_rules.filter(
      (_, i) => i !== index
    );
  }

  async function handle_submit(): Promise<void> {
    errors = {};
    is_saving = true;

    const result = await sportService.update(sport_id, form_data);

    if (!result.success) {
      is_saving = false;
      show_toast(result.error || "Failed to update sport", "error");
      return;
    }

    is_saving = false;
    show_toast("Sport updated successfully!", "success");

    setTimeout(() => {
      goto("/sports");
    }, 1500);
  }

  function handle_cancel(): void {
    goto("/sports");
  }

  function show_toast(
    message: string,
    type: "success" | "error" | "info"
  ): void {
    toast_message = message;
    toast_type = type;
    toast_visible = true;
  }
</script>

<svelte:head>
  <title>Edit Sport - Sports Management</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
  <LoadingStateWrapper
    state={loading_state}
    {error_message}
    loading_text="Loading sport..."
  >
    <div class="flex items-center gap-4">
      <button
        type="button"
        class="p-2 rounded-lg text-accent-500 hover:bg-accent-100 dark:hover:bg-accent-700"
        on:click={handle_cancel}
        aria-label="Go back"
      >
        <svg
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
      </button>
      <div class="flex-1">
        <h1 class="text-2xl font-bold text-accent-900 dark:text-accent-100">
          Edit Sport
        </h1>
        <p class="text-sm text-accent-600 dark:text-accent-400">
          {sport?.name || "Loading..."}
        </p>
      </div>
    </div>

    <div
      class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700 overflow-hidden"
    >
      <div
        class="flex overflow-x-auto border-b border-accent-200 dark:border-accent-700"
      >
        {#each sections as section}
          <button
            type="button"
            class="px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors {active_section ===
            section.id
              ? 'text-theme-primary-600 dark:text-theme-primary-400 border-b-2 border-theme-primary-500'
              : 'text-accent-600 dark:text-accent-400 hover:text-accent-900 dark:hover:text-accent-200'}"
            on:click={() => (active_section = section.id)}
          >
            {section.label}
          </button>
        {/each}
      </div>

      <form class="p-6" on:submit|preventDefault={handle_submit}>
        {#if active_section === "basic"}
          <div class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Sport Name"
                name="name"
                bind:value={form_data.name}
                placeholder="e.g., Football, Basketball"
                required={true}
                error={errors.name || ""}
              />

              <FormField
                label="Code"
                name="code"
                bind:value={form_data.code}
                placeholder="e.g., FOOTBALL, BASKETBALL"
                required={true}
                error={errors.code || ""}
              />

              <div class="md:col-span-2">
                <FormField
                  label="Description"
                  name="description"
                  bind:value={form_data.description}
                  placeholder="Brief description of the sport"
                />
              </div>

              <FormField
                label="Icon (Emoji)"
                name="icon_url"
                bind:value={form_data.icon_url}
                placeholder="e.g., ⚽ 🏀 🏈"
              />

              <EnumSelectField
                label="Status"
                name="status"
                bind:value={form_data.status}
                options={status_options}
                error={errors.status || ""}
              />

              <FormField
                label="Standard Game Duration (minutes)"
                name="standard_game_duration_minutes"
                type="number"
                bind:value={form_data.standard_game_duration_minutes}
                required={true}
              />

              <FormField
                label="Max Players on Field"
                name="max_players_on_field"
                type="number"
                bind:value={form_data.max_players_on_field}
                required={true}
              />

              <FormField
                label="Min Players on Field"
                name="min_players_on_field"
                type="number"
                bind:value={form_data.min_players_on_field}
                required={true}
              />

              <FormField
                label="Max Squad Size"
                name="max_squad_size"
                type="number"
                bind:value={form_data.max_squad_size}
                required={true}
              />
            </div>
          </div>
        {/if}

        {#if active_section === "periods"}
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h3
                class="text-lg font-medium text-accent-900 dark:text-accent-100"
              >
                Game Periods
              </h3>
              <button
                type="button"
                class="btn btn-outline text-sm"
                on:click={add_game_period}
              >
                Add Period
              </button>
            </div>

            {#if !form_data.periods || form_data.periods.length === 0}
              <p class="text-center py-8 text-accent-500 dark:text-accent-400">
                No game periods defined. Add periods to configure game
                structure.
              </p>
            {:else}
              <div class="space-y-3">
                {#each form_data.periods as period, index}
                  <div
                    class="flex flex-wrap items-center gap-4 p-4 bg-accent-50 dark:bg-accent-700/50 rounded-lg"
                  >
                    <span
                      class="text-sm font-medium text-accent-500 dark:text-accent-400 w-8"
                      >#{period.order}</span
                    >
                    <input
                      type="text"
                      class="flex-1 min-w-32 input"
                      bind:value={period.name}
                      placeholder="Period name"
                    />
                    <div class="flex items-center gap-2">
                      <input
                        type="number"
                        class="w-20 input"
                        bind:value={period.duration_minutes}
                        placeholder="Min"
                        min="1"
                      />
                      <span class="text-sm text-accent-500 dark:text-accent-400"
                        >min</span
                      >
                    </div>
                    <label class="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        bind:checked={period.is_break}
                        class="rounded"
                      />
                      <span class="text-accent-700 dark:text-accent-300"
                        >Break</span
                      >
                    </label>
                    <button
                      type="button"
                      aria-label="Remove game period"
                      class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                      on:click={() => remove_game_period(index)}
                    >
                      <svg
                        class="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}

        {#if active_section === "cards"}
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h3
                class="text-lg font-medium text-accent-900 dark:text-accent-100"
              >
                Card Types
              </h3>
              <button
                type="button"
                class="btn btn-outline text-sm"
                on:click={add_card_type}
              >
                Add Card Type
              </button>
            </div>

            {#if !form_data.card_types || form_data.card_types.length === 0}
              <p class="text-center py-8 text-accent-500 dark:text-accent-400">
                No card types defined. Add cards for disciplinary actions.
              </p>
            {:else}
              <div class="space-y-4">
                {#each form_data.card_types as card, index}
                  <div
                    class="p-4 bg-accent-50 dark:bg-accent-700/50 rounded-lg space-y-3"
                  >
                    <div class="flex flex-wrap items-center gap-4">
                      <input
                        type="color"
                        class="w-10 h-10 rounded cursor-pointer border-0"
                        bind:value={card.color}
                      />
                      <input
                        type="text"
                        class="flex-1 min-w-32 input"
                        bind:value={card.name}
                        placeholder="Card name (e.g., Yellow Card)"
                        on:change={() => (card.id = generate_id(card.name))}
                      />
                      <select class="input w-32" bind:value={card.severity}>
                        {#each severity_options as opt}
                          <option value={opt.value}>{opt.label}</option>
                        {/each}
                      </select>
                      <button
                        type="button"
                        aria-label="Remove card type"
                        class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                        on:click={() => remove_card_type(index)}
                      >
                        <svg
                          class="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                    <input
                      type="text"
                      class="w-full input"
                      bind:value={card.description}
                      placeholder="Description of when this card is shown"
                    />
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}

        {#if active_section === "fouls"}
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h3
                class="text-lg font-medium text-accent-900 dark:text-accent-100"
              >
                Foul Categories
              </h3>
              <button
                type="button"
                class="btn btn-outline text-sm"
                on:click={add_foul_category}
              >
                Add Foul Category
              </button>
            </div>

            {#if !form_data.foul_categories || form_data.foul_categories.length === 0}
              <p class="text-center py-8 text-accent-500 dark:text-accent-400">
                No foul categories defined. Add categories to track violations.
              </p>
            {:else}
              <div class="space-y-4">
                {#each form_data.foul_categories as foul, index}
                  <div
                    class="p-4 bg-accent-50 dark:bg-accent-700/50 rounded-lg space-y-3"
                  >
                    <div class="flex flex-wrap items-center gap-4">
                      <input
                        type="text"
                        class="flex-1 min-w-32 input"
                        bind:value={foul.name}
                        placeholder="Foul name (e.g., Personal Foul)"
                        on:change={() => (foul.id = generate_id(foul.name))}
                      />
                      <select class="input w-32" bind:value={foul.severity}>
                        {#each foul_severity_options as opt}
                          <option value={opt.value}>{opt.label}</option>
                        {/each}
                      </select>
                      <select
                        class="input w-36"
                        bind:value={foul.results_in_card}
                      >
                        <option value={null}>No Card</option>
                        {#each form_data.card_types || [] as card}
                          <option value={card.id}>{card.name}</option>
                        {/each}
                      </select>
                      <button
                        type="button"
                        aria-label="Remove foul category"
                        class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                        on:click={() => remove_foul_category(index)}
                      >
                        <svg
                          class="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        class="input"
                        bind:value={foul.description}
                        placeholder="Description"
                      />
                      <input
                        type="text"
                        class="input"
                        bind:value={foul.typical_penalty}
                        placeholder="Typical penalty"
                      />
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}

        {#if active_section === "officials"}
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h3
                class="text-lg font-medium text-accent-900 dark:text-accent-100"
              >
                Official Requirements
              </h3>
              <button
                type="button"
                class="btn btn-outline text-sm"
                on:click={add_official_requirement}
              >
                Add Official Role
              </button>
            </div>

            {#if !form_data.official_requirements || form_data.official_requirements.length === 0}
              <p class="text-center py-8 text-accent-500 dark:text-accent-400">
                No official requirements defined. Add roles for game
                officiating.
              </p>
            {:else}
              <div class="space-y-4">
                {#each form_data.official_requirements as official, index}
                  <div
                    class="p-4 bg-accent-50 dark:bg-accent-700/50 rounded-lg space-y-3"
                  >
                    <div class="flex flex-wrap items-center gap-4">
                      <input
                        type="text"
                        class="flex-1 min-w-32 input"
                        bind:value={official.role_name}
                        placeholder="Role name (e.g., Main Referee)"
                        on:change={() =>
                          (official.role_id = generate_id(official.role_name))}
                      />
                      <div class="flex items-center gap-2">
                        <span
                          class="text-sm text-accent-500 dark:text-accent-400"
                          >Min:</span
                        >
                        <input
                          type="number"
                          class="w-16 input"
                          bind:value={official.minimum_count}
                          min="0"
                        />
                      </div>
                      <div class="flex items-center gap-2">
                        <span
                          class="text-sm text-accent-500 dark:text-accent-400"
                          >Max:</span
                        >
                        <input
                          type="number"
                          class="w-16 input"
                          bind:value={official.maximum_count}
                          min="1"
                        />
                      </div>
                      <label class="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          bind:checked={official.is_mandatory}
                          class="rounded"
                        />
                        <span class="text-accent-700 dark:text-accent-300"
                          >Mandatory</span
                        >
                      </label>
                      <button
                        type="button"
                        aria-label="Remove official requirement"
                        class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                        on:click={() => remove_official_requirement(index)}
                      >
                        <svg
                          class="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                    <input
                      type="text"
                      class="w-full input"
                      bind:value={official.description}
                      placeholder="Description of the official's role"
                    />
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}

        {#if active_section === "scoring"}
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h3
                class="text-lg font-medium text-accent-900 dark:text-accent-100"
              >
                Scoring Rules
              </h3>
              <button
                type="button"
                class="btn btn-outline text-sm"
                on:click={add_scoring_rule}
              >
                Add Scoring Rule
              </button>
            </div>

            {#if !form_data.scoring_rules || form_data.scoring_rules.length === 0}
              <p class="text-center py-8 text-accent-500 dark:text-accent-400">
                No scoring rules defined. Add rules for how points are scored.
              </p>
            {:else}
              <div class="space-y-3">
                {#each form_data.scoring_rules as rule, index}
                  <div
                    class="flex flex-wrap items-center gap-4 p-4 bg-accent-50 dark:bg-accent-700/50 rounded-lg"
                  >
                    <input
                      type="text"
                      class="flex-1 min-w-32 input"
                      bind:value={rule.event_type}
                      placeholder="Event type (e.g., goal, 3_pointer)"
                    />
                    <div class="flex items-center gap-2">
                      <span class="text-sm text-accent-500 dark:text-accent-400"
                        >Points:</span
                      >
                      <input
                        type="number"
                        class="w-16 input"
                        bind:value={rule.points_awarded}
                        min="1"
                      />
                    </div>
                    <input
                      type="text"
                      class="flex-1 min-w-48 input"
                      bind:value={rule.description}
                      placeholder="Description"
                    />
                    <button
                      type="button"
                      aria-label="Remove scoring rule"
                      class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                      on:click={() => remove_scoring_rule(index)}
                    >
                      <svg
                        class="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}

        {#if active_section === "overtime"}
          <div class="space-y-6">
            <h3
              class="text-lg font-medium text-accent-900 dark:text-accent-100"
            >
              Overtime Rules
            </h3>

            {#if form_data.overtime_rules}
              <div class="space-y-4">
                <label class="flex items-center gap-3">
                  <input
                    type="checkbox"
                    bind:checked={form_data.overtime_rules.is_enabled}
                    class="rounded"
                  />
                  <span class="text-accent-700 dark:text-accent-300"
                    >Overtime enabled</span
                  >
                </label>

                {#if form_data.overtime_rules.is_enabled}
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        for="edit-overtime-trigger"
                        class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-2"
                      >
                        Trigger Condition
                      </label>
                      <select
                        id="edit-overtime-trigger"
                        class="input w-full"
                        bind:value={form_data.overtime_rules.trigger_condition}
                      >
                        {#each overtime_trigger_options as opt}
                          <option value={opt.value}>{opt.label}</option>
                        {/each}
                      </select>
                    </div>

                    <div>
                      <label
                        for="edit-overtime-type"
                        class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-2"
                      >
                        Overtime Type
                      </label>
                      <select
                        id="edit-overtime-type"
                        class="input w-full"
                        bind:value={form_data.overtime_rules.overtime_type}
                      >
                        {#each overtime_type_options as opt}
                          <option value={opt.value}>{opt.label}</option>
                        {/each}
                      </select>
                    </div>
                  </div>

                  {#if form_data.overtime_rules.overtime_type === "penalties" || form_data.overtime_rules.overtime_type === "shootout"}
                    {#if form_data.overtime_rules.penalties_config}
                      <div
                        class="p-4 bg-accent-50 dark:bg-accent-700/50 rounded-lg space-y-4"
                      >
                        <h4
                          class="text-sm font-medium text-accent-900 dark:text-accent-100"
                        >
                          Penalties Configuration
                        </h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label
                              for="edit-initial-rounds"
                              class="block text-sm text-accent-600 dark:text-accent-400 mb-1"
                              >Initial Rounds</label
                            >
                            <input
                              id="edit-initial-rounds"
                              type="number"
                              class="input w-full"
                              bind:value={
                                form_data.overtime_rules.penalties_config
                                  .initial_rounds
                              }
                              min="1"
                            />
                          </div>
                          <label class="flex items-center gap-3">
                            <input
                              type="checkbox"
                              bind:checked={
                                form_data.overtime_rules.penalties_config
                                  .sudden_death_after
                              }
                              class="rounded"
                            />
                            <span class="text-accent-700 dark:text-accent-300"
                              >Sudden death after initial rounds</span
                            >
                          </label>
                        </div>
                      </div>
                    {/if}
                  {/if}
                {/if}
              </div>
            {/if}
          </div>
        {/if}

        {#if active_section === "substitutions"}
          <div class="space-y-6">
            <h3
              class="text-lg font-medium text-accent-900 dark:text-accent-100"
            >
              Substitution Rules
            </h3>

            {#if form_data.substitution_rules}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Max Substitutions Per Game"
                  name="max_substitutions_per_game"
                  type="number"
                  bind:value={
                    form_data.substitution_rules.max_substitutions_per_game
                  }
                />

                <FormField
                  label="Max Substitution Windows"
                  name="max_substitution_windows"
                  type="number"
                  bind:value={
                    form_data.substitution_rules.max_substitution_windows
                  }
                  placeholder="Leave empty for unlimited windows"
                />

                <label class="flex items-center gap-3">
                  <input
                    type="checkbox"
                    bind:checked={
                      form_data.substitution_rules.rolling_substitutions_allowed
                    }
                    class="rounded"
                  />
                  <span class="text-accent-700 dark:text-accent-300"
                    >Rolling substitutions allowed</span
                  >
                </label>

                <label class="flex items-center gap-3">
                  <input
                    type="checkbox"
                    bind:checked={
                      form_data.substitution_rules
                        .return_after_substitution_allowed
                    }
                    class="rounded"
                  />
                  <span class="text-accent-700 dark:text-accent-300"
                    >Return after substitution allowed</span
                  >
                </label>
              </div>
            {/if}
          </div>
        {/if}

        <div
          class="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-6 border-t border-accent-200 dark:border-accent-700"
        >
          <button
            type="button"
            class="btn btn-outline"
            on:click={handle_cancel}
          >
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" disabled={is_saving}>
            {#if is_saving}
              <svg
                class="animate-spin h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Saving...
            {:else}
              Save Changes
            {/if}
          </button>
        </div>
      </form>
    </div>
  </LoadingStateWrapper>
</div>

<Toast
  message={toast_message}
  type={toast_type}
  is_visible={toast_visible}
  on:dismiss={() => (toast_visible = false)}
/>
