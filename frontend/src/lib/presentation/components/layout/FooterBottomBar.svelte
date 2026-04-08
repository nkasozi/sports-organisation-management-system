<script lang="ts">
  export let current_year: number;
  export let organization_name: string = "";
  export let show_panel_borders: boolean = false;
</script>

<div
  class="mt-6 pt-4 bg-black/25 dark:bg-black/40 backdrop-blur-sm rounded-lg px-4 py-3 footer-panel {show_panel_borders
    ? 'border-2 border-white/60'
    : ''} text-white"
>
  <div
    class="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0"
  >
    <div class="flex items-center space-x-4 text-sm text-white">
      <span
        >&copy; {current_year} {organization_name}. All rights reserved.</span
      >
    </div>
    <div class="flex items-center space-x-6 text-sm text-white">
      <span>Version 1.0.0</span>
      <div class="flex items-center space-x-1">
        <span>Built with</span>
        <svg
          class="h-4 w-4 text-red-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
            clip-rule="evenodd"
          />
        </svg>
        <span>by KasozyN</span>
      </div>
    </div>
  </div>
</div>
