<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import type { CreatePlayerPositionInput } from "$lib/domain/entities/PlayerPosition";
  import type { LoadingState } from "$lib/components/ui/LoadingStateWrapper.svelte";
  import { get_player_position_use_cases } from "$lib/usecases/PlayerPositionUseCases";
  import LoadingStateWrapper from "$lib/components/ui/LoadingStateWrapper.svelte";
  import FormField from "$lib/components/ui/FormField.svelte";
  import EnumSelectField from "$lib/components/ui/EnumSelectField.svelte";
  import Toast from "$lib/components/ui/Toast.svelte";

  const use_cases = get_player_position_use_cases();

  let loading_state: LoadingState = "success";
  let is_submitting: boolean = false;
  let validation_errors: Map<string, string> = new Map();

  let toast_visible: boolean = false;
  let toast_message: string = "";
  let toast_type: "success" | "error" | "info" = "info";

  let form_data: CreatePlayerPositionInput = {
    name: "",
    code: "",
    category: "midfielder",
    description: "",
    sport_type: "Football",
    display_order: 0,
    is_available: true,
    status: "active",
  };

  const category_options = [
    { value: "goalkeeper", label: "Goalkeeper" },
    { value: "defender", label: "Defender" },
    { value: "midfielder", label: "Midfielder" },
    { value: "forward", label: "Forward" },
    { value: "other", label: "Other" },
  ];

  const sport_type_options = [
    { value: "Football", label: "Football" },
    { value: "Soccer", label: "Soccer" },
    { value: "Basketball", label: "Basketball" },
    { value: "Baseball", label: "Baseball" },
    { value: "Hockey", label: "Hockey" },
    { value: "Cricket", label: "Cricket" },
    { value: "Rugby", label: "Rugby" },
  ];

  const status_options = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  onMount(async () => {
    loading_state = "success";
  });

  async function handle_submit(): Promise<void> {
    validation_errors = new Map();

    if (!form_data.name.trim()) {
      validation_errors.set("name", "Position name is required");
    }
    if (!form_data.code.trim()) {
      validation_errors.set("code", "Position code is required");
    }

    if (validation_errors.size > 0) {
      validation_errors = new Map(validation_errors);
      return;
    }

    is_submitting = true;

    const result = await use_cases.create(form_data);

    if (!result.success) {
      is_submitting = false;
      show_toast(result.error_message || "Failed to create position", "error");
      return;
    }

    show_toast("Position created successfully", "success");
    setTimeout(() => goto("/player-positions"), 1500);
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
    goto("/player-positions");
  }

  function handle_category_change(event: CustomEvent<{ value: string }>): void {
    form_data.category = event.detail
      .value as CreatePlayerPositionInput["category"];
  }

  function handle_sport_type_change(
    event: CustomEvent<{ value: string }>
  ): void {
    form_data.sport_type = event.detail.value;
  }

  function handle_status_change(event: CustomEvent<{ value: string }>): void {
    form_data.status = event.detail
      .value as CreatePlayerPositionInput["status"];
  }
</script>

<svelte:head>
  <title>Create Player Position - Sports Management</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-6">
  <div class="flex items-center gap-4">
    <button
      type="button"
      class="p-2 rounded-lg hover:bg-accent-100 dark:hover:bg-accent-700"
      aria-label="Go back to positions"
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
        Create Position
      </h1>
      <p class="text-sm text-accent-600 dark:text-accent-400 mt-1">
        Add a new player position
      </p>
    </div>
  </div>

  <LoadingStateWrapper state={loading_state}>
    <form
      class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700 p-6 space-y-6"
      on:submit|preventDefault={handle_submit}
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="md:col-span-2">
          <FormField
            label="Position Name"
            name="name"
            bind:value={form_data.name}
            placeholder="e.g., Center Back"
            required={true}
            error={validation_errors.get("name")}
          />
        </div>

        <FormField
          label="Position Code"
          name="code"
          bind:value={form_data.code}
          placeholder="e.g., CB"
          required={true}
          error={validation_errors.get("code")}
        />

        <EnumSelectField
          label="Category"
          name="category"
          value={form_data.category}
          options={category_options}
          required={true}
          on:change={handle_category_change}
        />

        <EnumSelectField
          label="Sport Type"
          name="sport_type"
          value={form_data.sport_type}
          options={sport_type_options}
          required={true}
          on:change={handle_sport_type_change}
        />

        <div class="md:col-span-2">
          <label
            for="description"
            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-2"
          >
            Description
          </label>
          <textarea
            id="description"
            bind:value={form_data.description}
            placeholder="Describe this position's role and responsibilities"
            rows="3"
            class="w-full px-3 py-2 rounded-lg border border-accent-300 dark:border-accent-600 bg-white dark:bg-accent-700 text-accent-900 dark:text-accent-100 placeholder-accent-400 dark:placeholder-accent-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          ></textarea>
        </div>

        <FormField
          label="Display Order"
          name="display_order"
          type="number"
          bind:value={form_data.display_order}
          placeholder="0"
          min={0}
        />

        <div class="flex items-center">
          <label
            for="is_available"
            class="flex items-center gap-2 cursor-pointer"
          >
            <input
              type="checkbox"
              id="is_available"
              bind:checked={form_data.is_available}
              class="w-4 h-4 rounded border-accent-300"
            />
            <span
              class="text-sm font-medium text-accent-700 dark:text-accent-300"
            >
              Available for assignment
            </span>
          </label>
        </div>

        <EnumSelectField
          label="Status"
          name="status"
          value={form_data.status}
          options={status_options}
          required={true}
          on:change={handle_status_change}
        />
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
            Create Position
          {/if}
        </button>
      </div>
    </form>
  </LoadingStateWrapper>
</div>

<Toast
  message={toast_message}
  type={toast_type}
  is_visible={toast_visible}
  on:dismiss={() => (toast_visible = false)}
/>
