import { h as head, e as escape_html, a as ensure_array_like, p as pop, b as push } from "../../chunks/index2.js";
function _page($$payload, $$props) {
  push();
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Dashboard - Sports Organisation Management</title>`;
    $$payload2.out.push(`<meta name="description" content="Overview of your sports organization management system" class="svelte-7vi1ls"/>`);
  });
  $$payload.out.push(`<div class="space-y-6 svelte-7vi1ls"><div class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700 p-6 svelte-7vi1ls"><div class="flex flex-col sm:flex-row sm:items-center sm:justify-between svelte-7vi1ls"><div class="svelte-7vi1ls"><h1 class="text-2xl sm:text-3xl font-bold text-accent-900 dark:text-accent-100 mb-2 svelte-7vi1ls">Welcome to Sports<span class="text-secondary-600 svelte-7vi1ls">Org</span></h1> <p class="text-accent-600 dark:text-accent-300 text-mobile svelte-7vi1ls">Manage your sports organization with ease. Track competitions, teams,
          and games all in one place.</p></div> <div class="mt-4 sm:mt-0 svelte-7vi1ls"><button class="btn btn-secondary mobile-touch svelte-7vi1ls"><svg class="h-5 w-5 mr-2 svelte-7vi1ls" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" class="svelte-7vi1ls"></path></svg> Quick Action</button></div></div></div> <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 svelte-7vi1ls"><div class="card p-6 svelte-7vi1ls"><div class="flex items-center svelte-7vi1ls"><div class="flex-shrink-0 svelte-7vi1ls"><div class="h-12 w-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center svelte-7vi1ls">`);
  {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="loading-spinner h-6 w-6 svelte-7vi1ls"></div>`);
  }
  $$payload.out.push(`<!--]--></div></div> <div class="ml-4 flex-1 min-w-0 svelte-7vi1ls"><p class="text-sm font-medium text-accent-500 dark:text-accent-400 truncate svelte-7vi1ls">Organizations</p> <p class="text-2xl font-bold text-accent-900 dark:text-accent-100 svelte-7vi1ls">${escape_html("---")}</p></div></div></div> <div class="card p-6 svelte-7vi1ls"><div class="flex items-center svelte-7vi1ls"><div class="flex-shrink-0 svelte-7vi1ls"><div class="h-12 w-12 bg-secondary-100 dark:bg-secondary-900 rounded-lg flex items-center justify-center svelte-7vi1ls">`);
  {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="loading-spinner h-6 w-6 svelte-7vi1ls"></div>`);
  }
  $$payload.out.push(`<!--]--></div></div> <div class="ml-4 flex-1 min-w-0 svelte-7vi1ls"><p class="text-sm font-medium text-accent-500 dark:text-accent-400 truncate svelte-7vi1ls">Competitions</p> <p class="text-2xl font-bold text-accent-900 dark:text-accent-100 svelte-7vi1ls">${escape_html("---")}</p></div></div></div> <div class="card p-6 svelte-7vi1ls"><div class="flex items-center svelte-7vi1ls"><div class="flex-shrink-0 svelte-7vi1ls"><div class="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center svelte-7vi1ls">`);
  {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="loading-spinner h-6 w-6 svelte-7vi1ls"></div>`);
  }
  $$payload.out.push(`<!--]--></div></div> <div class="ml-4 flex-1 min-w-0 svelte-7vi1ls"><p class="text-sm font-medium text-accent-500 dark:text-accent-400 truncate svelte-7vi1ls">Teams</p> <p class="text-2xl font-bold text-accent-900 dark:text-accent-100 svelte-7vi1ls">${escape_html("---")}</p></div></div></div> <div class="card p-6 svelte-7vi1ls"><div class="flex items-center svelte-7vi1ls"><div class="flex-shrink-0 svelte-7vi1ls"><div class="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center svelte-7vi1ls">`);
  {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="loading-spinner h-6 w-6 svelte-7vi1ls"></div>`);
  }
  $$payload.out.push(`<!--]--></div></div> <div class="ml-4 flex-1 min-w-0 svelte-7vi1ls"><p class="text-sm font-medium text-accent-500 dark:text-accent-400 truncate svelte-7vi1ls">Games</p> <p class="text-2xl font-bold text-accent-900 dark:text-accent-100 svelte-7vi1ls">${escape_html("---")}</p></div></div></div></div> <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 svelte-7vi1ls"><div class="card p-6 svelte-7vi1ls"><h2 class="text-lg font-semibold text-accent-900 dark:text-accent-100 mb-4 svelte-7vi1ls">Recent Competitions</h2> <div class="space-y-4 svelte-7vi1ls">`);
  {
    $$payload.out.push("<!--[-->");
    const each_array = ensure_array_like(Array(3));
    $$payload.out.push(`<!--[-->`);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      each_array[$$index];
      $$payload.out.push(`<div class="animate-pulse svelte-7vi1ls"><div class="flex items-center space-x-4 svelte-7vi1ls"><div class="h-10 w-10 bg-accent-200 dark:bg-accent-700 rounded-lg svelte-7vi1ls"></div> <div class="flex-1 space-y-2 svelte-7vi1ls"><div class="h-4 bg-accent-200 dark:bg-accent-700 rounded w-3/4 svelte-7vi1ls"></div> <div class="h-3 bg-accent-200 dark:bg-accent-700 rounded w-1/2 svelte-7vi1ls"></div></div></div></div>`);
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--></div></div> <div class="card p-6 svelte-7vi1ls"><h2 class="text-lg font-semibold text-accent-900 dark:text-accent-100 mb-4 svelte-7vi1ls">Upcoming Games</h2> <div class="space-y-4 svelte-7vi1ls">`);
  {
    $$payload.out.push("<!--[-->");
    const each_array_1 = ensure_array_like(Array(3));
    $$payload.out.push(`<!--[-->`);
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      each_array_1[$$index_1];
      $$payload.out.push(`<div class="animate-pulse svelte-7vi1ls"><div class="flex items-center justify-between svelte-7vi1ls"><div class="flex items-center space-x-3 svelte-7vi1ls"><div class="h-8 w-8 bg-accent-200 dark:bg-accent-700 rounded svelte-7vi1ls"></div> <div class="space-y-1 svelte-7vi1ls"><div class="h-4 bg-accent-200 dark:bg-accent-700 rounded w-20 svelte-7vi1ls"></div> <div class="h-3 bg-accent-200 dark:bg-accent-700 rounded w-16 svelte-7vi1ls"></div></div></div> <div class="h-4 bg-accent-200 dark:bg-accent-700 rounded w-16 svelte-7vi1ls"></div></div></div>`);
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--></div></div></div> <div class="card p-6 svelte-7vi1ls"><h2 class="text-lg font-semibold text-accent-900 dark:text-accent-100 mb-4 svelte-7vi1ls">Quick Actions</h2> <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 svelte-7vi1ls"><a href="/organizations/create" class="flex flex-col items-center p-4 text-center hover:bg-accent-50 dark:hover:bg-accent-700 rounded-lg transition-colors duration-200 mobile-touch svelte-7vi1ls"><div class="h-12 w-12 bg-secondary-500 rounded-lg flex items-center justify-center mb-3 svelte-7vi1ls"><svg class="h-6 w-6 text-white svelte-7vi1ls" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" class="svelte-7vi1ls"></path></svg></div> <span class="text-sm font-medium text-accent-900 dark:text-accent-100 svelte-7vi1ls">Add Organization</span></a> <a href="/competitions/create" class="flex flex-col items-center p-4 text-center hover:bg-accent-50 dark:hover:bg-accent-700 rounded-lg transition-colors duration-200 mobile-touch svelte-7vi1ls"><div class="h-12 w-12 bg-secondary-600 rounded-lg flex items-center justify-center mb-3 svelte-7vi1ls"><svg class="h-6 w-6 text-white svelte-7vi1ls" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" class="svelte-7vi1ls"></path></svg></div> <span class="text-sm font-medium text-accent-900 dark:text-accent-100 svelte-7vi1ls">New Competition</span></a> <a href="/teams/create" class="flex flex-col items-center p-4 text-center hover:bg-accent-50 dark:hover:bg-accent-700 rounded-lg transition-colors duration-200 mobile-touch svelte-7vi1ls"><div class="h-12 w-12 bg-secondary-700 rounded-lg flex items-center justify-center mb-3 svelte-7vi1ls"><svg class="h-6 w-6 text-white svelte-7vi1ls" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" class="svelte-7vi1ls"></path></svg></div> <span class="text-sm font-medium text-accent-900 dark:text-accent-100 svelte-7vi1ls">Add Team</span></a> <a href="/games/create" class="flex flex-col items-center p-4 text-center hover:bg-accent-50 dark:hover:bg-accent-700 rounded-lg transition-colors duration-200 mobile-touch svelte-7vi1ls"><div class="h-12 w-12 bg-secondary-800 rounded-lg flex items-center justify-center mb-3 svelte-7vi1ls"><svg class="h-6 w-6 text-white svelte-7vi1ls" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" class="svelte-7vi1ls"></path></svg></div> <span class="text-sm font-medium text-accent-900 dark:text-accent-100 svelte-7vi1ls">Schedule Game</span></a></div></div></div>`);
  pop();
}
export {
  _page as default
};
