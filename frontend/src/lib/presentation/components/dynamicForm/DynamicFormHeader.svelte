<script lang="ts">
  export let form_title: string = "";
  export let is_loading: boolean = false;
</script>

<div class="border-b border-gray-200 dark:border-gray-700 pb-4">
  <h2
    class="text-lg sm:text-xl font-semibold text-accent-900 dark:text-accent-100"
  >
    {form_title}
  </h2>
  {#if is_loading}
    <p class="text-sm text-accent-600 dark:text-accent-400">
      Loading form options...
    </p>
  {/if}
</div>
