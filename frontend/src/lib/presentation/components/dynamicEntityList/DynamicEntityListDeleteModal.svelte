<script lang="ts">
  export let display_name: string;
  export let entities_to_delete_count: number;
  export let is_deleting: boolean;
  export let is_visible: boolean;
  export let on_cancel: () => void;
  export let on_confirm: () => Promise<void>;
</script>

{#if is_visible}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
  >
    <div class="card max-w-md w-full space-y-4 p-6">
      <h3 class="text-lg font-semibold text-accent-900 dark:text-accent-100">
        Confirm Deletion
      </h3>
      <p class="text-accent-700 dark:text-accent-300">
        Are you sure you want to delete {entities_to_delete_count === 1
          ? "this"
          : "these"}
        {entities_to_delete_count}
        {display_name.toLowerCase()}{entities_to_delete_count === 1 ? "" : "s"}?
        This action cannot be undone.
      </p>
      <div class="flex flex-col gap-3 pt-4 sm:flex-row">
        <button
          type="button"
          class="btn btn-outline w-full sm:w-auto"
          on:click={on_cancel}
          disabled={is_deleting}>Cancel</button
        >
        <button
          type="button"
          class="btn w-full bg-red-600 text-white hover:bg-red-700 sm:w-auto"
          on:click={on_confirm}
          disabled={is_deleting}
        >
          {#if is_deleting}
            Deleting...
          {:else}
            Delete {entities_to_delete_count === 1
              ? display_name
              : `${entities_to_delete_count} Items`}
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
