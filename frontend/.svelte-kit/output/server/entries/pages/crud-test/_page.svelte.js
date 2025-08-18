import { a as ensure_array_like, h as head, c as attr, m as maybe_selected, e as escape_html } from "../../../chunks/index2.js";
import { E as EntityCrudWrapper } from "../../../chunks/EntityCrudWrapper.js";
function _page($$payload) {
  let selected_entity_type = "organization";
  let is_mobile_view = true;
  const entity_types = [
    { value: "organization", label: "Organizations" },
    { value: "competition", label: "Competitions" },
    {
      value: "competition_constraint",
      label: "Competition Constraints"
    },
    { value: "team", label: "Teams" },
    { value: "player", label: "Players" },
    { value: "official", label: "Officials" },
    { value: "game", label: "Games" }
  ];
  const each_array = ensure_array_like(entity_types);
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>CRUD Test - Sports Management</title>`;
  });
  $$payload.out.push(`<div class="crud-test-page min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-8 svelte-2n65n9"><div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div class="text-center mb-8"><h1 class="text-2xl sm:text-3xl font-bold text-accent-900 dark:text-accent-100 mb-2">Generalized CRUD System Test</h1> <p class="text-accent-600 dark:text-accent-400 max-w-2xl mx-auto">Test the dynamic entity management system with any entity type. The form
        and list components automatically adapt based on entity metadata.</p></div> <div class="card p-6 mb-6"><div class="flex flex-col sm:flex-row items-center gap-4"><label for="entity_type_select" class="label font-semibold">Select Entity Type:</label> <select id="entity_type_select" class="input max-w-sm">`);
  $$payload.select_value = selected_entity_type;
  $$payload.out.push(`<!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let entity_type = each_array[$$index];
    $$payload.out.push(`<option${attr("value", entity_type.value)}${maybe_selected($$payload, entity_type.value)}>${escape_html(entity_type.label)}</option>`);
  }
  $$payload.out.push(`<!--]-->`);
  $$payload.select_value = void 0;
  $$payload.out.push(`</select> <div class="flex items-center gap-2"><input type="checkbox" id="mobile_view" class="w-4 h-4 text-accent-600 dark:text-accent-400 border-gray-300 dark:border-gray-600 rounded focus:ring-accent-500 dark:focus:ring-accent-400"${attr("checked", is_mobile_view, true)}/> <label for="mobile_view" class="text-sm text-accent-700 dark:text-accent-300">Mobile View</label></div></div></div> `);
  EntityCrudWrapper($$payload, {
    entity_type: selected_entity_type,
    initial_view: "list",
    is_mobile_view,
    show_list_actions: true
  });
  $$payload.out.push(`<!----></div></div>`);
}
export {
  _page as default
};
