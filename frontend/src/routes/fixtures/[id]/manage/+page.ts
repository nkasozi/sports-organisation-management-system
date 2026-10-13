import { redirect } from "@sveltejs/kit";

import {
  build_live_game_detail_url,
  LEGACY_GAME_MANAGE_REDIRECT_STATUS,
} from "$lib/presentation/logic/liveGameRoutes";

import type { PageLoad } from "./$types";

export const prerender = false;

export const load: PageLoad = ({ params }) =>
  redirect(
    LEGACY_GAME_MANAGE_REDIRECT_STATUS,
    build_live_game_detail_url(params.id),
  );
