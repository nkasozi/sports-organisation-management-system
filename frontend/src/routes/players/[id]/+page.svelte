<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import type { Player, UpdatePlayerInput } from "$lib/domain/entities/Player";
  import type { PlayerPosition } from "$lib/domain/entities/PlayerPosition";
  import type { LoadingState } from "$lib/components/ui/LoadingStateWrapper.svelte";
  import { get_player_use_cases } from "$lib/usecases/PlayerUseCases";
  import { get_player_position_use_cases } from "$lib/usecases/PlayerPositionUseCases";
  import LoadingStateWrapper from "$lib/components/ui/LoadingStateWrapper.svelte";
  import FormField from "$lib/components/ui/FormField.svelte";
  import SelectField from "$lib/components/ui/SelectField.svelte";
  import EnumSelectField from "$lib/components/ui/EnumSelectField.svelte";
  import ImageUpload from "$lib/components/ui/ImageUpload.svelte";
  import Toast from "$lib/components/ui/Toast.svelte";
  import { DEFAULT_PLAYER_AVATAR } from "$lib/domain/entities/Player";
  import { build_country_select_options } from "$lib/core/countries";

  const player_use_cases = get_player_use_cases();
  const position_use_cases = get_player_position_use_cases();

  let player: Player | null = null;
  let positions: PlayerPosition[] = [];
  let loading_state: LoadingState = "loading";
  let error_message: string = "";
  let is_submitting: boolean = false;
  let validation_errors: Map<string, string> = new Map();

  let toast_visible: boolean = false;
  let toast_message: string = "";
  let toast_type: "success" | "error" | "info" = "info";

  let form_data: UpdatePlayerInput = {
    first_name: "",
    last_name: "",
    date_of_birth: "",
    nationality: "",
    position_id: "",
    height_cm: null,
    weight_kg: null,
    preferred_foot: "right",
    profile_image_url: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    medical_notes: "",
    email: "",
    phone: "",
    status: "active",
  };

  const preferred_foot_options: Array<{ value: string; label: string }> = [
    { value: "left", label: "Left" },
    { value: "right", label: "Right" },
    { value: "both", label: "Both" },
  ];

  const status_options: Array<{ value: string; label: string }> = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "injured", label: "Injured" },
    { value: "suspended", label: "Suspended" },
  ];

  const country_options = build_country_select_options();

  function handle_nationality_change(
    event: CustomEvent<{ value: string }>
  ): boolean {
    form_data.nationality = event.detail.value;
    return true;
  }

  onMount(async () => {
    const player_id = $page.params.id ?? "";

    if (!player_id) {
      loading_state = "error";
      error_message = "No player ID provided";
      return;
    }

    const [player_result, positions_result] = await Promise.all([
      player_use_cases.get_by_id(player_id),
      position_use_cases.list(undefined, { page: 1, page_size: 1000 }),
    ]);

    if (!player_result.success) {
      loading_state = "error";
      error_message = player_result.error_message || "Failed to load player";
      return;
    }

    if (!player_result.data) {
      loading_state = "error";
      error_message = "Player not found";
      return;
    }

    const loaded_player = player_result.data;
    player = loaded_player;
    positions = positions_result.success ? positions_result.data : [];

    form_data = {
      first_name: loaded_player.first_name,
      last_name: loaded_player.last_name,
      date_of_birth: loaded_player.date_of_birth,
      nationality: loaded_player.nationality,
      position_id: loaded_player.position_id,
      height_cm: loaded_player.height_cm,
      weight_kg: loaded_player.weight_kg,
      preferred_foot: loaded_player.preferred_foot,
      profile_image_url: loaded_player.profile_image_url,
      emergency_contact_name: loaded_player.emergency_contact_name,
      emergency_contact_phone: loaded_player.emergency_contact_phone,
      medical_notes: loaded_player.medical_notes,
      email: loaded_player.email,
      phone: loaded_player.phone,
      status: loaded_player.status,
    };

    loading_state = "success";
  });

  function handle_position_change(event: CustomEvent<{ value: string }>): void {
    form_data.position_id = event.detail.value;
  }

  function handle_preferred_foot_change(
    event: CustomEvent<{ value: string }>
  ): void {
    form_data.preferred_foot = event.detail
      .value as UpdatePlayerInput["preferred_foot"];
  }

  function handle_status_change(event: CustomEvent<{ value: string }>): void {
    form_data.status = event.detail.value as UpdatePlayerInput["status"];
  }

  async function handle_submit(): Promise<void> {
    if (!player) return;

    validation_errors = new Map();

    if (!form_data.first_name?.trim()) {
      validation_errors.set("first_name", "First name is required");
    }
    if (!form_data.last_name?.trim()) {
      validation_errors.set("last_name", "Last name is required");
    }
    if (!form_data.date_of_birth) {
      validation_errors.set("date_of_birth", "Date of birth is required");
    }
    if (!form_data.nationality?.trim()) {
      validation_errors.set("nationality", "Nationality is required");
    }
    if (!form_data.position_id?.trim()) {
      validation_errors.set("position_id", "Position is required");
    }
    if (
      form_data.height_cm &&
      (form_data.height_cm < 100 || form_data.height_cm > 250)
    ) {
      validation_errors.set(
        "height_cm",
        "Height must be between 100 and 250 cm"
      );
    }
    if (
      form_data.weight_kg &&
      (form_data.weight_kg < 30 || form_data.weight_kg > 200)
    ) {
      validation_errors.set(
        "weight_kg",
        "Weight must be between 30 and 200 kg"
      );
    }

    if (validation_errors.size > 0) {
      validation_errors = new Map(validation_errors);
      return;
    }

    is_submitting = true;

    const result = await player_use_cases.update(player.id, form_data);

    if (!result.success) {
      is_submitting = false;
      show_toast(result.error_message || "Failed to update player", "error");
      return;
    }

    show_toast("Player updated successfully", "success");
    setTimeout(() => goto("/players"), 1500);
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
    goto("/players");
  }

  $: position_options = [
    { value: "", label: "Select a position" },
    ...positions.map((pos) => ({
      value: pos.id,
      label: pos.name,
    })),
  ];
</script>

<svelte:head>
  <title>Edit Player - Sports Management</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-6">
  <div class="flex items-center gap-4">
    <button
      type="button"
      class="p-2 rounded-lg hover:bg-accent-100 dark:hover:bg-accent-700"
      aria-label="Go back to players list"
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
        Edit Player
      </h1>
      <p class="text-sm text-accent-600 dark:text-accent-400 mt-1">
        Update player information
      </p>
    </div>
  </div>

  <LoadingStateWrapper
    state={loading_state}
    loading_text="Loading player..."
    {error_message}
  >
    <form
      class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700 p-6 space-y-6"
      on:submit|preventDefault={handle_submit}
    >
      <div class="border-b border-accent-200 dark:border-accent-700 pb-4 mb-4">
        <h2 class="text-lg font-medium text-accent-900 dark:text-accent-100">
          Personal Information
        </h2>
      </div>

      <ImageUpload
        current_image_url={form_data.profile_image_url || ""}
        default_image_url={DEFAULT_PLAYER_AVATAR}
        label="Player Photo"
        disabled={is_submitting}
        on:change={(e) => (form_data.profile_image_url = e.detail.url)}
      />

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="First Name"
          name="first_name"
          bind:value={form_data.first_name}
          placeholder="Enter first name"
          required={true}
          error={validation_errors.get("first_name")}
        />

        <FormField
          label="Last Name"
          name="last_name"
          bind:value={form_data.last_name}
          placeholder="Enter last name"
          required={true}
          error={validation_errors.get("last_name")}
        />

        <FormField
          label="Date of Birth"
          name="date_of_birth"
          type="date"
          bind:value={form_data.date_of_birth}
          required={true}
          error={validation_errors.get("date_of_birth")}
        />

        <SelectField
          label="Nationality"
          name="nationality"
          value={form_data.nationality}
          options={country_options}
          placeholder="Select nationality"
          required={true}
          error={validation_errors.get("nationality")}
          on:change={handle_nationality_change}
        />

        <FormField
          label="Email"
          name="email"
          type="email"
          bind:value={form_data.email}
          placeholder="player@example.com"
        />

        <FormField
          label="Phone"
          name="phone"
          type="tel"
          bind:value={form_data.phone}
          placeholder="+1 234 567 8900"
        />
      </div>

      <div
        class="border-b border-accent-200 dark:border-accent-700 pb-4 mb-4 pt-4"
      >
        <h2 class="text-lg font-medium text-accent-900 dark:text-accent-100">
          Position & Status
        </h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SelectField
          label="Position"
          name="position_id"
          value={form_data.position_id || ""}
          options={position_options}
          placeholder="Select a position"
          required={true}
          error={validation_errors.get("position_id")}
          on:change={handle_position_change}
        />

        <EnumSelectField
          label="Status"
          name="status"
          value={form_data.status || "active"}
          options={status_options}
          required={true}
          on:change={handle_status_change}
        />
      </div>

      <div
        class="border-b border-accent-200 dark:border-accent-700 pb-4 mb-4 pt-4"
      >
        <h2 class="text-lg font-medium text-accent-900 dark:text-accent-100">
          Physical Attributes
        </h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FormField
          label="Height (cm)"
          name="height_cm"
          type="number"
          bind:value={form_data.height_cm}
          placeholder="175"
          min={100}
          max={250}
          error={validation_errors.get("height_cm")}
        />

        <FormField
          label="Weight (kg)"
          name="weight_kg"
          type="number"
          bind:value={form_data.weight_kg}
          placeholder="70"
          min={30}
          max={200}
          error={validation_errors.get("weight_kg")}
        />

        <EnumSelectField
          label="Preferred Foot"
          name="preferred_foot"
          value={form_data.preferred_foot || "right"}
          options={preferred_foot_options}
          on:change={handle_preferred_foot_change}
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
            Saving...
          {:else}
            Save Changes
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
