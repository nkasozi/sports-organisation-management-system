<script lang="ts">
    import {
        get_sign_in_notice_content,
        SIGN_IN_NOTICE_CONTENT_STATUS,
        SIGN_IN_NOTICE_TONE,
        type SignInNoticeTone,
        type SignInPageNotice,
    } from "$lib/presentation/logic/signInPageState";

    export let notice: SignInPageNotice;

    const TRIANGLE_ICON_PATH =
        "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z";
    const REFRESH_ICON_PATH =
        "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15";

    const TONE_CONTAINER_CLASSES: Record<SignInNoticeTone, string> = {
        [SIGN_IN_NOTICE_TONE.DANGER]: "bg-red-500/10 border border-red-500/20",
        [SIGN_IN_NOTICE_TONE.INFO]: "banner-info",
        [SIGN_IN_NOTICE_TONE.WARNING]:
            "bg-amber-500/10 border border-amber-500/30",
    };
    const TONE_ICON_CLASSES: Record<SignInNoticeTone, string> = {
        [SIGN_IN_NOTICE_TONE.DANGER]: "text-red-400",
        [SIGN_IN_NOTICE_TONE.INFO]: "banner-info-icon",
        [SIGN_IN_NOTICE_TONE.WARNING]: "text-amber-400",
    };
    const TONE_TITLE_CLASSES: Record<SignInNoticeTone, string> = {
        [SIGN_IN_NOTICE_TONE.DANGER]: "text-red-300",
        [SIGN_IN_NOTICE_TONE.INFO]: "",
        [SIGN_IN_NOTICE_TONE.WARNING]: "text-amber-300",
    };
    const TONE_MESSAGE_CLASSES: Record<SignInNoticeTone, string> = {
        [SIGN_IN_NOTICE_TONE.DANGER]: "text-red-300/80",
        [SIGN_IN_NOTICE_TONE.INFO]: "text-blue-700/80 dark:text-blue-200/80",
        [SIGN_IN_NOTICE_TONE.WARNING]: "text-amber-200/90",
    };
    const TONE_ICON_PATHS: Record<SignInNoticeTone, string> = {
        [SIGN_IN_NOTICE_TONE.DANGER]: TRIANGLE_ICON_PATH,
        [SIGN_IN_NOTICE_TONE.INFO]: REFRESH_ICON_PATH,
        [SIGN_IN_NOTICE_TONE.WARNING]: TRIANGLE_ICON_PATH,
    };

    $: notice_content = get_sign_in_notice_content(notice);
</script>

{#if notice_content.status === SIGN_IN_NOTICE_CONTENT_STATUS.VISIBLE}
    <div
        class="mb-6 rounded-xl p-4 {TONE_CONTAINER_CLASSES[
            notice_content.tone
        ]}"
        role="alert"
    >
        <div class="flex items-center justify-center gap-2 mb-2">
            <svg
                class="w-5 h-5 {TONE_ICON_CLASSES[notice_content.tone]}"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d={TONE_ICON_PATHS[notice_content.tone]}
                />
            </svg>
            <span
                class="text-sm font-semibold {TONE_TITLE_CLASSES[
                    notice_content.tone
                ]}">{notice_content.title}</span
            >
        </div>
        <p class="text-xs {TONE_MESSAGE_CLASSES[notice_content.tone]}">
            {notice_content.message}
        </p>
    </div>
{/if}
