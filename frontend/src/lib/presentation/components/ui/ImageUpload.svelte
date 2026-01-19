<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let current_image_url: string = "";
  export let default_image_url: string = "";
  export let label: string = "Profile Photo";
  export let accept: string = "image/*";
  export let max_size_mb: number = 2;
  export let disabled: boolean = false;

  const dispatch = createEventDispatcher<{
    change: { url: string };
  }>();

  let file_input: HTMLInputElement;
  let error_message: string = "";
  let is_loading: boolean = false;

  $: display_image = current_image_url || default_image_url;

  function handle_file_select(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    error_message = "";

    const max_size_bytes = max_size_mb * 1024 * 1024;
    if (file.size > max_size_bytes) {
      error_message = `File size must be less than ${max_size_mb}MB`;
      return;
    }

    if (!file.type.startsWith("image/")) {
      error_message = "Please select an image file";
      return;
    }

    is_loading = true;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data_url = e.target?.result as string;
      dispatch("change", { url: data_url });
      is_loading = false;
    };
    reader.onerror = () => {
      error_message = "Failed to read file";
      is_loading = false;
    };
    reader.readAsDataURL(file);
  }

  function handle_remove(): void {
    dispatch("change", { url: "" });
    if (file_input) {
      file_input.value = "";
    }
  }

  function trigger_file_input(): void {
    file_input?.click();
  }
</script>

<div class="space-y-2">
  <span class="block text-sm font-medium text-accent-700 dark:text-accent-300">
    {label}
  </span>

  <div class="flex items-center gap-4">
    <div class="relative">
      <div
        class="h-24 w-24 rounded-full overflow-hidden border-2 border-accent-200 dark:border-accent-600 bg-accent-50 dark:bg-accent-700"
      >
        {#if is_loading}
          <div class="h-full w-full flex items-center justify-center">
            <svg
              class="animate-spin h-8 w-8 text-primary-500"
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
          </div>
        {:else}
          <img
            src={display_image}
            alt="Profile preview"
            class="h-full w-full object-cover"
          />
        {/if}
      </div>

      {#if current_image_url && !disabled}
        <button
          type="button"
          class="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow-sm"
          on:click={handle_remove}
          aria-label="Remove image"
        >
          <svg
            class="h-3 w-3"
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
      {/if}
    </div>

    <div class="flex-1 space-y-2">
      <input
        bind:this={file_input}
        type="file"
        {accept}
        class="hidden"
        on:change={handle_file_select}
        {disabled}
      />

      <button
        type="button"
        class="px-4 py-2 text-sm font-medium rounded-lg border border-accent-300 dark:border-accent-600 bg-white dark:bg-accent-700 text-accent-700 dark:text-accent-200 hover:bg-accent-50 dark:hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed"
        on:click={trigger_file_input}
        {disabled}
      >
        {current_image_url ? "Change Photo" : "Upload Photo"}
      </button>

      <p class="text-xs text-accent-500 dark:text-accent-400">
        JPG, PNG or GIF. Max {max_size_mb}MB.
      </p>

      {#if error_message}
        <p class="text-xs text-red-500">{error_message}</p>
      {/if}
    </div>
  </div>
</div>
