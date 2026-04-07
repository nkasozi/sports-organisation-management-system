<script lang="ts">
  export let current_progress: number;
  export let resolved_progress: number;
  export let total_progress: number;
  export let on_dismiss: () => void;
</script>

<div class="border-b border-gray-200 bg-violet-50 px-6 py-4">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-xl font-semibold text-gray-900">
        Sync Conflict Detected
      </h2>
      <p class="mt-1 text-sm text-gray-600">
        {current_progress} of {total_progress} conflicts ({resolved_progress} resolved)
      </p>
    </div>
    <button
      on:click={on_dismiss}
      class="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
      aria-label="Close">×</button
    >
  </div>
</div>
