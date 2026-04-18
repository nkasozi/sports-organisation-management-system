<script lang="ts">
  import type { FieldMetadata } from "$lib/core/entities/BaseEntity";

  export let field: FieldMetadata;
  export let value: unknown = "";
  export let is_read_only: boolean = false;
  export let set_scalar_value: (field_name: string, value: unknown) => boolean;

  $: string_value = typeof value === "string" ? value : "";
  $: is_multiline_field =
    field.field_name.includes("description") ||
    field.field_name.includes("address") ||
    field.field_name.includes("notes");
  $: is_color_field = field.field_name.toLowerCase().includes("color");
  $: shows_image_preview =
    !!field.field_name.toLowerCase().match(/(logo|avatar|image|pic|photo)/) &&
    !field.field_name.toLowerCase().includes("summary");

  function hide_broken_image(event: Event): boolean {
    const target = event.currentTarget as HTMLImageElement | undefined;
    if (!target) return false;
    target.style.display = "none";
    return true;
  }
</script>

{#if is_multiline_field}
  <textarea
    id={`field_${field.field_name}`}
    class="input min-h-[100px]"
    value={string_value}
    placeholder={field.placeholder || field.display_name}
    readonly={is_read_only}
    rows="4"
    on:input={(event) =>
      set_scalar_value(
        field.field_name,
        (event.currentTarget as HTMLTextAreaElement).value,
      )}
  ></textarea>
{:else if is_color_field}
  <div class="flex items-center gap-3">
    <input
      id={`field_${field.field_name}_color`}
      type="color"
      class="w-10 h-10 p-0 border-0 bg-transparent cursor-pointer rounded shadow"
      value={string_value}
      disabled={is_read_only}
      on:input={(event) =>
        set_scalar_value(
          field.field_name,
          (event.currentTarget as HTMLInputElement).value,
        )}
    />
    <input
      id={`field_${field.field_name}`}
      type="text"
      class="input w-32"
      value={string_value}
      placeholder="#RRGGBB or rgb()"
      readonly={is_read_only}
      on:input={(event) =>
        set_scalar_value(
          field.field_name,
          (event.currentTarget as HTMLInputElement).value,
        )}
    />
    <span
      class="inline-block w-8 h-8 rounded border border-gray-300 dark:border-gray-600 shadow-sm"
      style={`background:${string_value || "#eee"};`}
    ></span>
  </div>
{:else if shows_image_preview}
  <div class="flex items-center gap-3">
    <input
      id={`field_${field.field_name}`}
      type="text"
      class="input"
      value={string_value}
      placeholder={field.placeholder || field.display_name}
      readonly={is_read_only}
      on:input={(event) =>
        set_scalar_value(
          field.field_name,
          (event.currentTarget as HTMLInputElement).value,
        )}
    />
    {#if string_value}
      <img
        src={string_value}
        alt={field.display_name}
        class="w-12 h-12 rounded-full object-cover border border-gray-300 dark:border-gray-600 shadow-sm bg-accent-50 dark:bg-accent-900"
        on:error={hide_broken_image}
      />
    {/if}
  </div>
{:else}
  <input
    id={`field_${field.field_name}`}
    type={field.field_name.includes("email")
      ? "email"
      : field.field_name.includes("phone") || field.field_name.includes("tel")
        ? "tel"
        : field.field_name.includes("url") ||
            field.field_name.includes("website") ||
            field.field_name.includes("link")
          ? "url"
          : "text"}
    class="input"
    value={string_value}
    placeholder={field.placeholder || field.display_name}
    readonly={is_read_only}
    on:input={(event) =>
      set_scalar_value(
        field.field_name,
        (event.currentTarget as HTMLInputElement).value,
      )}
  />
{/if}
