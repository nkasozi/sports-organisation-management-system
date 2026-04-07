<script lang="ts">
    import type { SignInFeatureHighlight } from "../../logic/signInPageState";

    export let current_year: number;
    export let feature_highlights: SignInFeatureHighlight[] = [];
</script>

<div
    class="hidden lg:flex lg:w-1/2 bg-gray-900 relative overflow-hidden flex-col justify-between p-12"
>
    <div class="relative z-10">
        <div class="flex items-center gap-3 mb-16">
            <div
                class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center"
            >
                <svg
                    class="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                </svg>
            </div>
            <span class="text-white text-xl font-semibold tracking-tight"
                >SportSync</span
            >
        </div>

        <h1
            class="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6"
        >
            Manage your sports organization with confidence
        </h1>
        <p class="text-lg text-gray-400 leading-relaxed max-w-lg">
            Everything you need to run competitions, manage teams, track live
            games, and coordinate officials — all in one place.
        </p>
    </div>

    <div class="relative z-10 grid grid-cols-2 gap-6 mt-12">
        {#each feature_highlights as feature}
            <div
                class="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10"
            >
                <div
                    class="w-9 h-9 rounded-lg bg-blue-600/20 flex items-center justify-center flex-shrink-0 mt-0.5"
                >
                    {#if feature.icon === "trophy"}
                        <svg
                            class="w-5 h-5 text-blue-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="1.5"
                                d="M5 3h14l-1.405 8.426A5 5 0 0112.63 16H11.37a5 5 0 01-4.965-4.574L5 3zM9 21h6m-3-5v5"
                            />
                        </svg>
                    {:else if feature.icon === "users"}
                        <svg
                            class="w-5 h-5 text-blue-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="1.5"
                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                        </svg>
                    {:else if feature.icon === "clock"}
                        <svg
                            class="w-5 h-5 text-blue-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="1.5"
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    {:else}
                        <svg
                            class="w-5 h-5 text-blue-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="1.5"
                                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                        </svg>
                    {/if}
                </div>
                <div>
                    <h3 class="text-sm font-semibold text-white">
                        {feature.title}
                    </h3>
                    <p class="text-xs text-gray-400 mt-0.5">
                        {feature.description}
                    </p>
                </div>
            </div>
        {/each}
    </div>

    <div class="relative z-10 mt-12">
        <p class="text-sm text-gray-500">
            &copy; {current_year} SportSync. All rights reserved.
        </p>
    </div>

    <div
        class="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full -translate-y-1/2 translate-x-1/3"
    ></div>
    <div
        class="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/5 rounded-full translate-y-1/3 -translate-x-1/4"
    ></div>
</div>
