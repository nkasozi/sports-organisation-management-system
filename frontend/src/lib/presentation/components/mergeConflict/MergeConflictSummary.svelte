<script lang="ts">
  import type { ScalarInput } from "$lib/core/types/DomainScalars";
  import type { ConflictRecord } from "$lib/infrastructure/sync/conflictTypes";

  export let conflict: ScalarInput<ConflictRecord>;
  export let format_timestamp: (timestamp: string) => string;
</script>

<div class="space-y-6">
  <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
    <h3 class="mb-2 font-medium text-gray-900">
      {conflict.entity_display_name}
    </h3>
    <p class="text-sm text-gray-600">
      Table: <span class="font-medium">{conflict.table_name}</span>
    </p>
    <p class="text-sm text-gray-600">
      Detected: {format_timestamp(conflict.detected_at)}
    </p>
  </div>

  <div class="grid grid-cols-2 gap-4">
    <div class="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
      <div class="mb-2 flex items-center gap-2">
        <div class="h-3 w-3 rounded-full bg-blue-500"></div>
        <h4 class="font-medium text-blue-900">Your Changes (Local)</h4>
      </div>
      <p class="text-sm text-blue-700">
        Updated: {format_timestamp(conflict.local_updated_at)}
      </p>
    </div>
    <div class="rounded-lg border-2 border-green-200 bg-green-50 p-4">
      <div class="mb-2 flex items-center gap-2">
        <div class="h-3 w-3 rounded-full bg-green-500"></div>
        <h4 class="font-medium text-green-900">Server Version (Remote)</h4>
      </div>
      <p class="text-sm text-green-700">
        Updated: {format_timestamp(conflict.remote_updated_at)}
      </p>
      {#if conflict.remote_updated_by_name.status === "known"}<p class="text-sm text-green-700">
          By: {conflict.remote_updated_by_name.value}
        </p>{/if}
    </div>
  </div>
</div>
