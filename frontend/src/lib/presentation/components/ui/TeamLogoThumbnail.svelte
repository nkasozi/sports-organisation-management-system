<script lang="ts">
    import { DEFAULT_TEAM_LOGO } from "$lib/core/entities/Team";

    export let logo_url: string = "";
    export let team_name: string = "";
    export let size: "sm" | "md" | "lg" = "sm";

    const SIZE_CLASSES: Record<string, string> = {
        sm: "w-6 h-6",
        md: "w-8 h-8",
        lg: "w-10 h-10",
    };

    $: resolved_logo_url =
        logo_url && logo_url.trim() !== "" ? logo_url : DEFAULT_TEAM_LOGO;
    $: size_class = SIZE_CLASSES[size] ?? SIZE_CLASSES.sm;

    let image_load_failed = false;

    function handle_image_error(): boolean {
        image_load_failed = true;
        return true;
    }
</script>

<img
    src={image_load_failed ? DEFAULT_TEAM_LOGO : resolved_logo_url}
    alt="{team_name} logo"
    class="{size_class} rounded-full object-cover flex-shrink-0 border border-gray-200 dark:border-gray-600"
    on:error={handle_image_error}
/>
