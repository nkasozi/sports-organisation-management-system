<script lang="ts">
    export let path: string;
    export let size_class = "w-5 h-5";
</script>

<svg
    class={size_class}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
>
    <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d={path}
    />
</svg>
