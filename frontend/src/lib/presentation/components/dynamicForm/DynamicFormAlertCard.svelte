<script lang="ts">
  import type {
    DynamicFormAlertIcon,
    DynamicFormAlertTone,
  } from "$lib/presentation/logic/dynamicFormComponentTypes";

  export let tone: DynamicFormAlertTone = "blue";
  export let icon: DynamicFormAlertIcon = "info";
  export let title: string = "";
  export let message: string = "";
  export let caption: string = "";
  export let items: string[] = [];
  export let show_accent_bar: boolean = false;

  const tone_classes: Record<DynamicFormAlertTone, string> = {
    secondary:
      "border-secondary-200 dark:border-secondary-800/50 bg-white dark:bg-accent-900 text-accent-800 dark:text-accent-200",
    blue: "border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200",
    red: "border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200",
    violet:
      "border-violet-200 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/30 text-violet-800 dark:text-violet-200",
    yellow:
      "border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-100",
  };

  const icon_classes: Record<DynamicFormAlertTone, string> = {
    secondary: "bg-secondary-50 dark:bg-secondary-900/30 text-secondary-500",
    blue: "text-blue-600 dark:text-blue-400",
    red: "text-red-600 dark:text-red-400",
    violet: "text-violet-600 dark:text-violet-400",
    yellow: "text-yellow-600 dark:text-yellow-400",
  };

  const accent_bar_classes: Record<DynamicFormAlertTone, string> = {
    secondary: "bg-secondary-400",
    blue: "bg-blue-400",
    red: "bg-red-400",
    violet: "bg-violet-400",
    yellow: "bg-yellow-400",
  };

  const icon_paths: Record<DynamicFormAlertIcon, string> = {
    info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    warning:
      "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
    lock: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
    error: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  };

  $: has_title = title.trim().length > 0;
  $: has_caption = caption.trim().length > 0;
  $: has_items = items.length > 0;
</script>

<div class={`rounded-xl border overflow-hidden ${tone_classes[tone]}`}>
  {#if show_accent_bar}
    <div class={`h-1 ${accent_bar_classes[tone]}`}></div>
  {/if}
  <div class="p-4 flex items-start gap-3">
    <div
      class={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${icon_classes[tone]}`}
    >
      <svg
        class="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d={icon_paths[icon]}
        />
      </svg>
    </div>
    <div>
      {#if has_title}
        <div class="text-sm font-semibold">{title}</div>
      {/if}
      {#if message}
        <p class="text-sm {has_title ? 'mt-1' : 'font-medium'}">{message}</p>
      {/if}
      {#if has_caption}
        <p class="mt-1 text-xs opacity-80">{caption}</p>
      {/if}
      {#if has_items}
        <ul class="mt-1 text-sm list-disc list-inside">
          {#each items as item}
            <li>{item}</li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>
</div>
