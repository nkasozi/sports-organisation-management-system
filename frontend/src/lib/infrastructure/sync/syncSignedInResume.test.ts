import { describe, expect, it, vi } from "vitest";

import { create_signed_in_resume_watcher } from "./syncSignedInResume";

function create_watcher(is_engine_running: boolean): {
  watch: (signed_in: boolean) => boolean;
  request_push: ReturnType<typeof vi.fn>;
} {
  const request_push = vi.fn(() => true);
  const watch = create_signed_in_resume_watcher({
    is_engine_running: () => is_engine_running,
    request_push,
  });
  return { watch, request_push };
}

describe("create_signed_in_resume_watcher", () => {
  it("requests a push when the session becomes signed in again", () => {
    const { watch, request_push } = create_watcher(true);

    watch(false);
    watch(true);

    expect(request_push).toHaveBeenCalledOnce();
  });

  it("ignores the first signed-in value because the engine start already kicks a run", () => {
    const { watch, request_push } = create_watcher(true);

    watch(true);
    watch(true);

    expect(request_push).not.toHaveBeenCalled();
  });

  it("does not request a push while background sync is stopped", () => {
    const { watch, request_push } = create_watcher(false);

    watch(false);
    watch(true);

    expect(request_push).not.toHaveBeenCalled();
  });
});
