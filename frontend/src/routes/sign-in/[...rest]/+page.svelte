<script lang="ts">
  import { page } from "$app/stores";
  import SignInAuthPanel from "$lib/presentation/components/auth/SignInAuthPanel.svelte";
  import SignInHeroPanel from "$lib/presentation/components/auth/SignInHeroPanel.svelte";

  import {
    get_sign_in_page_error_state,
    sign_in_feature_highlights,
  } from "../../../lib/presentation/logic/signInPageState";

  const current_year = new Date().getFullYear();

  $: sign_in_page_error_state = get_sign_in_page_error_state($page.url);
</script>

<div
  class="min-h-screen flex flex-col lg:flex-row bg-gray-900 transition-colors"
>
  <SignInHeroPanel
    {current_year}
    feature_highlights={sign_in_feature_highlights}
  />
  <SignInAuthPanel
    {current_year}
    has_server_error={sign_in_page_error_state.has_server_error}
    has_sync_error={sign_in_page_error_state.has_sync_error}
  />
</div>
