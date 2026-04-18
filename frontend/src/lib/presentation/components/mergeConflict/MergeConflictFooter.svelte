<script lang="ts">
  export let on_dismiss: () => void;
  export let on_keep_all_local: () => void;
  export let on_keep_all_remote: () => void;
  export let on_resolve_current: () => void;
</script>

<div
  class="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4"
>
  <div class="flex gap-2">
    <button
      on:click={on_keep_all_local}
      class="rounded-[0.175rem] border border-blue-300 bg-white px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
      >Keep All Local</button
    >
    <button
      on:click={on_keep_all_remote}
      class="rounded-[0.175rem] border border-green-300 bg-white px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-50"
      >Keep All Remote</button
    >
  </div>
  <div class="flex gap-3">
    <button
      on:click={on_dismiss}
      class="rounded-[0.175rem] border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >Resolve Later</button
    >
    <button
      on:click={on_resolve_current}
      class="rounded-[0.175rem] bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >Apply Resolution</button
    >
  </div>
</div>
