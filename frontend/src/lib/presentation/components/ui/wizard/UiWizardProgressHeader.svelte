<script lang="ts">
  export let current_step_index: number;
  export let progress_percentage: number;
  export let total_steps: number;
</script>

<div class="mb-4">
  <div class="flex justify-between items-center mb-2">
    <span class="text-sm font-medium text-secondary-700 dark:text-secondary-300"
      >Step {current_step_index + 1} of {total_steps}</span
    >
    <span class="text-sm font-medium text-secondary-700 dark:text-secondary-300"
      >{progress_percentage}% Complete</span
    >
  </div>
  <div
    class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden"
  >
    <div
      class="bg-secondary-600 dark:bg-secondary-500 h-2 rounded-full transition-all duration-300 ease-in-out"
      style="width: {progress_percentage}%"
    ></div>
  </div>
</div>
