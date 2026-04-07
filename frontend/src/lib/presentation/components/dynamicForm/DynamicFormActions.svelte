<script lang="ts">
  export let should_show_fake_data_button: boolean = false;
  export let is_save_in_progress: boolean = false;
  export let permission_denied: boolean = false;
  export let is_loading: boolean = false;
  export let is_edit_mode: boolean = false;
  export let entity_display_name: string = "";
  export let button_color_class: string = "btn-primary-action";
  export let on_generate_fake_data: () => void;
  export let on_cancel: () => void;
</script>

<div
  class="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 mt-6 border-t border-gray-200 dark:border-gray-700"
>
  {#if should_show_fake_data_button}
    <button
      type="button"
      class="btn btn-ghost w-full sm:w-auto order-1 sm:order-1 flex items-center justify-center gap-2"
      on:click={on_generate_fake_data}
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
    on:click={on_cancel}
    disabled={is_save_in_progress}
  >
    Cancel
  </button>

  {#if !permission_denied}
    <button
      type="submit"
      class={`btn ${button_color_class} w-full sm:w-auto order-3 sm:order-3`}
      disabled={is_save_in_progress || is_loading}
    >
      {#if is_save_in_progress}
        Saving...
      {:else}
        {is_edit_mode ? "Update" : "Create"} {entity_display_name}
      {/if}
    </button>
  {/if}
</div>
