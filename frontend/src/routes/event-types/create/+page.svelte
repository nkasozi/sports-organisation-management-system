<script lang="ts">
  import { goto } from "$app/navigation";
  import type { CreateGameEventTypeInput } from "$lib/domain/entities/GameEventType";
  import {
    create_empty_game_event_type_input,
    EVENT_CATEGORY_OPTIONS,
  } from "$lib/domain/entities/GameEventType";
  import { get_game_event_type_use_cases } from "$lib/usecases/GameEventTypeUseCases";
  import FormField from "$lib/components/ui/FormField.svelte";
  import EnumSelectField from "$lib/components/ui/EnumSelectField.svelte";
  import Toast from "$lib/components/ui/Toast.svelte";

  const use_cases = get_game_event_type_use_cases();

  let form_data: CreateGameEventTypeInput =
    create_empty_game_event_type_input();
  let is_submitting: boolean = false;
  let validation_errors: Map<string, string> = new Map();

  let toast_visible: boolean = false;
  let toast_message: string = "";
  let toast_type: "success" | "error" | "info" = "info";

  const status_options = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const category_options = EVENT_CATEGORY_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }));

  const common_icons = [
    "⚽",
    "🥅",
    "🎯",
    "❌",
    "🟨",
    "🟥",
    "🔄",
    "⚠️",
    "🚫",
    "🚩",
    "🦵",
    "🏥",
    "📺",
    "▶️",
    "⏹️",
    "⏸️",
    "🏆",
    "🎉",
    "📋",
    "🔔",
  ];

  async function handle_submit(): Promise<void> {
    validation_errors = new Map();

    if (!form_data.name.trim()) {
      validation_errors.set("name", "Event type name is required");
    }
    if (!form_data.code.trim()) {
      validation_errors.set("code", "Event type code is required");
    }
    if (!form_data.icon.trim()) {
      validation_errors.set("icon", "Icon is required");
    }

    if (validation_errors.size > 0) {
      validation_errors = new Map(validation_errors);
      return;
    }

    is_submitting = true;

    const result = await use_cases.create_event_type(form_data);

    if (!result.success) {
      is_submitting = false;
      show_toast(result.error, "error");
      return;
    }

    show_toast("Event type created successfully", "success");
    setTimeout(() => goto("/event-types"), 1500);
  }

  function show_toast(
    message: string,
    type: "success" | "error" | "info"
  ): void {
    toast_message = message;
    toast_type = type;
    toast_visible = true;
  }

  function navigate_back(): void {
    goto("/event-types");
  }

  function handle_status_change(event: CustomEvent<{ value: string }>): void {
    form_data.status = event.detail.value as CreateGameEventTypeInput["status"];
  }

  function handle_category_change(event: CustomEvent<{ value: string }>): void {
    form_data.category = event.detail
      .value as CreateGameEventTypeInput["category"];
  }

  function select_icon(icon: string): void {
    form_data.icon = icon;
  }
</script>

<svelte:head>
  <title>Create Event Type - Sports Management</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-6">
  <div class="flex items-center gap-4">
    <button
      type="button"
      class="p-2 rounded-lg hover:bg-accent-100 dark:hover:bg-accent-700"
      aria-label="Go back"
      on:click={navigate_back}
    >
      <svg
        class="h-5 w-5 text-accent-600 dark:text-accent-400"
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
    <div>
      <h1 class="text-2xl font-bold text-accent-900 dark:text-accent-100">
        Create Event Type
      </h1>
      <p class="text-sm text-accent-600 dark:text-accent-400 mt-1">
        Add a new event type for game tracking
      </p>
    </div>
  </div>

  <form
    class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700 p-6 space-y-6"
    on:submit|preventDefault={handle_submit}
  >
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField
        label="Event Name"
        name="name"
        bind:value={form_data.name}
        placeholder="e.g., Goal, Yellow Card"
        required={true}
        error={validation_errors.get("name")}
      />

      <FormField
        label="Event Code"
        name="code"
        bind:value={form_data.code}
        placeholder="e.g., goal, yellow_card"
        required={true}
        error={validation_errors.get("code")}
      />

      <div class="md:col-span-2">
        <FormField
          label="Description"
          name="description"
          type="textarea"
          bind:value={form_data.description}
          placeholder="Describe this event type"
          rows={2}
        />
      </div>

      <div class="md:col-span-2">
        <span
          class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-2"
        >
          Icon <span class="text-red-500">*</span>
        </span>
        <div class="flex flex-wrap gap-2 mb-2">
          {#each common_icons as icon}
            <button
              type="button"
              class="w-10 h-10 text-xl rounded-lg border-2 transition-all {form_data.icon ===
              icon
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                : 'border-accent-300 dark:border-accent-600 hover:border-accent-400'}"
              on:click={() => select_icon(icon)}
            >
              {icon}
            </button>
          {/each}
        </div>
        <FormField
          label=""
          name="icon"
          bind:value={form_data.icon}
          placeholder="Or type your own emoji"
          error={validation_errors.get("icon")}
        />
      </div>

      <EnumSelectField
        label="Category"
        name="category"
        value={form_data.category}
        options={category_options}
        required={true}
        on:change={handle_category_change}
      />

      <FormField
        label="Display Order"
        name="display_order"
        type="number"
        bind:value={form_data.display_order}
        placeholder="1"
        min={0}
      />

      <FormField
        label="Button Color"
        name="color"
        bind:value={form_data.color}
        placeholder="e.g., bg-green-500 hover:bg-green-600"
      />

      <EnumSelectField
        label="Status"
        name="status"
        value={form_data.status}
        options={status_options}
        required={true}
        on:change={handle_status_change}
      />

      <div class="flex items-center gap-3">
        <input
          type="checkbox"
          id="affects_score"
          bind:checked={form_data.affects_score}
          class="h-4 w-4 rounded border-accent-300 text-primary-600 focus:ring-primary-500"
        />
        <label
          for="affects_score"
          class="text-sm font-medium text-accent-700 dark:text-accent-300"
        >
          Affects score (e.g., goals)
        </label>
      </div>

      <div class="flex items-center gap-3">
        <input
          type="checkbox"
          id="requires_player"
          bind:checked={form_data.requires_player}
          class="h-4 w-4 rounded border-accent-300 text-primary-600 focus:ring-primary-500"
        />
        <label
          for="requires_player"
          class="text-sm font-medium text-accent-700 dark:text-accent-300"
        >
          Requires player selection
        </label>
      </div>
    </div>

    <div class="p-4 bg-accent-50 dark:bg-accent-700 rounded-lg">
      <p class="text-sm font-medium text-accent-700 dark:text-accent-300 mb-2">
        Preview
      </p>
      <div class="flex items-center gap-3">
        <span
          class="text-2xl w-12 h-12 rounded-lg flex items-center justify-center text-white {form_data.color.split(
            ' '
          )[0] || 'bg-gray-500'}"
        >
          {form_data.icon || "📋"}
        </span>
        <div>
          <div class="font-medium text-accent-900 dark:text-accent-100">
            {form_data.name || "Event Name"}
          </div>
          <div class="text-xs text-accent-500">
            {form_data.code || "event_code"}
          </div>
        </div>
      </div>
    </div>

    <div
      class="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-accent-200 dark:border-accent-700"
    >
      <button
        type="button"
        class="btn btn-outline"
        on:click={navigate_back}
        disabled={is_submitting}
      >
        Cancel
      </button>
      <button type="submit" class="btn btn-primary" disabled={is_submitting}>
        {#if is_submitting}
          <svg
            class="animate-spin -ml-1 mr-2 h-4 w-4"
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
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Creating...
        {:else}
          Create Event Type
        {/if}
      </button>
    </div>
  </form>
</div>

<Toast
  message={toast_message}
  type={toast_type}
  is_visible={toast_visible}
  on:dismiss={() => (toast_visible = false)}
/>
