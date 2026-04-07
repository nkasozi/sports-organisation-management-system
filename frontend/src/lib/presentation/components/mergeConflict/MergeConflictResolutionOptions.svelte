<script lang="ts">
  import type { ConflictResolutionAction } from "$lib/infrastructure/sync/conflictTypes";

  export let selected_action: ConflictResolutionAction;
</script>

<div class="mb-6">
  <h4 class="mb-3 font-medium text-gray-900">Resolution Strategy</h4>
  <div class="space-y-2">
    <label
      class="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50 {selected_action ===
      'keep_local'
        ? 'border-blue-500 bg-blue-50'
        : ''}"
    >
      <input
        type="radio"
        name="resolution"
        value="keep_local"
        bind:group={selected_action}
        class="h-4 w-4 text-blue-600"
      />
      <div>
        <div class="font-medium text-gray-900">Keep My Changes</div>
        <div class="text-sm text-gray-600">
          Overwrite the server version with your local changes
        </div>
      </div>
    </label>
    <label
      class="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50 {selected_action ===
      'keep_remote'
        ? 'border-green-500 bg-green-50'
        : ''}"
    >
      <input
        type="radio"
        name="resolution"
        value="keep_remote"
        bind:group={selected_action}
        class="h-4 w-4 text-green-600"
      />
      <div>
        <div class="font-medium text-gray-900">Keep Server Version</div>
        <div class="text-sm text-gray-600">
          Discard your changes and use the server version
        </div>
      </div>
    </label>
    <label
      class="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50 {selected_action ===
      'merge'
        ? 'border-purple-500 bg-purple-50'
        : ''}"
    >
      <input
        type="radio"
        name="resolution"
        value="merge"
        bind:group={selected_action}
        class="h-4 w-4 text-purple-600"
      />
      <div>
        <div class="font-medium text-gray-900">Manual Merge</div>
        <div class="text-sm text-gray-600">
          Select individual field values from above
        </div>
      </div>
    </label>
  </div>
</div>
