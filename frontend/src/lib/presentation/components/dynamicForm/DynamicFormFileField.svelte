<script lang="ts">
  import type { FieldMetadata } from "$lib/core/entities/BaseEntity";

  export let field: FieldMetadata;
  export let value: string = "";
  export let is_read_only: boolean = false;
  export let handle_file_change: (
    event: Event,
    field_name: string,
  ) => Promise<void>;

  $: is_image_upload = !!field.field_name
    .toLowerCase()
    .match(/(logo|profile|avatar|image|pic|photo)/);
  $: preview_source =
    value && value.startsWith("data:image") ? value : value || "/no-image.svg";

  function set_fallback_image(event: Event): boolean {
    const target = event.target as HTMLImageElement | undefined;
    if (!target || target.src === "/no-image.svg") return false;
    target.src = "/no-image.svg";
    return true;
  }

  function hide_broken_image(event: Event): boolean {
    const target = event.currentTarget as HTMLImageElement | undefined;
    if (!target) return false;
    target.style.display = "none";
    return true;
  }
</script>

{#if is_image_upload}
  <div class="flex flex-col items-center justify-center gap-2">
    <div class="relative group w-32 h-32 flex items-center justify-center">
      {#key value}
        <img
          src={preview_source}
          alt={field.display_name}
          class="w-32 h-32 rounded-lg object-cover border-2 border-gray-300 dark:border-gray-600 shadow bg-accent-50 dark:bg-accent-900"
          on:error={set_fallback_image}
          draggable="false"
        />
      {/key}
      <button
        type="button"
        class="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/60 rounded-[0.175rem] transition group-hover:opacity-100 opacity-0"
        style="border:none;"
        on:click={() =>
          document.getElementById(`file_input_${field.field_name}`)?.click()}
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
        on:change={(event) => handle_file_change(event, field.field_name)}
        disabled={is_read_only}
      />
    </div>
    <span class="text-xs text-accent-500 dark:text-accent-300">
      Click to upload/change
    </span>
  </div>
{:else}
  <div class="flex items-center gap-3">
    <input
      id={`field_${field.field_name}`}
      type="file"
      accept="image/*"
      class="block w-full text-sm text-accent-900 dark:text-accent-100 file:mr-4 file:py-2.5 file:px-4 file:rounded-[0.175rem] file:border-0 file:text-sm file:font-semibold file:bg-secondary-100 dark:file:bg-secondary-800 file:text-secondary-700 dark:file:text-secondary-200 hover:file:bg-secondary-200 dark:hover:file:bg-secondary-700 file:cursor-pointer cursor-pointer file:transition-colors"
      on:change={(event) => handle_file_change(event, field.field_name)}
      disabled={is_read_only}
    />
    {#if value}
      <img
        src={value}
        alt={field.display_name}
        class="w-12 h-12 rounded object-cover border border-gray-300 dark:border-gray-600 shadow-sm bg-accent-50 dark:bg-accent-900"
        on:error={hide_broken_image}
      />
    {/if}
  </div>
{/if}
