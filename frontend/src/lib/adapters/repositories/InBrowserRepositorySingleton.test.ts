import { describe, expect, it, vi } from "vitest";

import { create_lazy_repository_accessor } from "./InBrowserRepositorySingleton";

describe("create_lazy_repository_accessor", () => {
  it("does not create the repository until first access", () => {
    const factory = vi.fn(() => ({ name: "repository" }));

    create_lazy_repository_accessor(factory);

    expect(factory).not.toHaveBeenCalled();
  });

  it("creates the repository once and reuses it", () => {
    const factory = vi.fn(() => ({ name: "repository" }));
    const get_repository = create_lazy_repository_accessor(factory);

    const first = get_repository();
    const second = get_repository();

    expect(first).toBe(second);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("keeps separate accessors independent", () => {
    const get_first = create_lazy_repository_accessor(() => ({ id: 1 }));
    const get_second = create_lazy_repository_accessor(() => ({ id: 1 }));

    expect(get_first()).not.toBe(get_second());
  });
});
