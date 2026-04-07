<script lang="ts">
  import type { FieldMetadata } from "$lib/core/entities/BaseEntity";

  export let display_name: string;
  export let enum_fields: FieldMetadata[];
  export let foreign_key_fields: FieldMetadata[];
  export let get_related_entity_display_name: (field: FieldMetadata) => string;
  export let importable_fields: FieldMetadata[];
  export let on_download_template: () => void;
  export let on_skip_upload: () => void;
</script>

<div class="space-y-6">
  <div
    class="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4"
  >
    <h3 class="font-medium text-purple-900 dark:text-purple-100 mb-2">
      Step 1: Download the CSV Template
    </h3>
    <p class="text-sm text-purple-700 dark:text-purple-300 mb-4">
      Click below to download a CSV template with all the fields needed to
      import {display_name.toLowerCase()}s. Fill in your data following the
      example row format.
    </p>
    <div class="flex flex-wrap gap-3">
      <button
        type="button"
        class="btn bg-purple-600 hover:bg-purple-700 text-white"
        on:click={on_download_template}>Download Template</button
      >
      <button
        type="button"
        class="btn bg-accent-600 hover:bg-accent-700 text-white"
        on:click={on_skip_upload}>Skip to File Upload</button
      >
    </div>
  </div>

  <div class="border border-accent-200 dark:border-accent-700 rounded-lg p-4">
    <h4 class="font-medium text-accent-900 dark:text-accent-100 mb-2">
      Template Fields
    </h4>
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
      {#each importable_fields as field}
        <div class="flex items-center gap-2">
          <span class="text-accent-700 dark:text-accent-300"
            >{field.display_name}</span
          >
          {#if field.is_required}<span class="text-red-500 text-xs">*</span
            >{/if}
        </div>
      {/each}
    </div>
    <p class="text-xs text-accent-500 mt-2">* Required fields</p>
  </div>

  {#if foreign_key_fields.length > 0}
    <div
      class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-4"
    >
      <div
        class="p-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-lg"
      >
        <h5
          class="font-medium text-emerald-800 dark:text-emerald-200 text-sm mb-2"
        >
          Option 1: Use Name Columns
        </h5>
        <div class="space-y-1">
          {#each foreign_key_fields as field}
            <div class="flex items-start gap-2 text-sm">
              <span
                class="font-medium text-emerald-800 dark:text-emerald-200 min-w-40"
                >{field.foreign_key_entity?.toLowerCase()}_name:</span
              >
              <span class="text-emerald-600 dark:text-emerald-300"
                >Name of the <strong
                  >{get_related_entity_display_name(field)}</strong
                ></span
              >
            </div>
          {/each}
        </div>
      </div>

      <div
        class="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg"
      >
        <h5 class="font-medium text-blue-800 dark:text-blue-200 text-sm mb-2">
          Option 2: Use ID Columns
        </h5>
        <div class="space-y-1">
          {#each foreign_key_fields as field}
            <div class="flex items-start gap-2 text-sm">
              <span
                class="font-medium text-blue-800 dark:text-blue-200 min-w-40"
                >{field.field_name}:</span
              >
              <span class="text-blue-600 dark:text-blue-300"
                >ID from <strong
                  >{get_related_entity_display_name(field)}</strong
                > list</span
              >
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  {#if enum_fields.length > 0}
    <div
      class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
    >
      <h4 class="font-medium text-green-900 dark:text-green-100 mb-2">
        Allowed Values for Selection Fields
      </h4>
      <div class="space-y-3">
        {#each enum_fields as field}
          <div>
            <span class="font-medium text-green-800 dark:text-green-200 text-sm"
              >{field.display_name} ({field.field_name}):</span
            >
            <div class="flex flex-wrap gap-1 mt-1">
              {#each field.enum_values || [] as value}
                <code
                  class="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-0.5 rounded text-xs"
                  >{value}</code
                >
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
