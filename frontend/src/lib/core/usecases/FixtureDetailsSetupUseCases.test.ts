import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  vi,
} from "vitest";

import { CONFIRMATION_STATUS } from "../entities/StatusConstants";
import { create_failure_result, create_success_result } from "../types/Result";
import { create_fixture_details_setup_use_cases } from "./FixtureDetailsSetupUseCases";

vi.mock("../entities/FixtureDetailsSetup", () => ({
  validate_fixture_details_setup_input: (input: { fixture_id?: string }) =>
    input.fixture_id
      ? { is_valid: true, errors: {} }
      : { is_valid: false, errors: { fixture_id: "Fixture is required" } },
}));

interface SetupRepositoryDouble {
  find_all: Mock;
  find_by_id: Mock;
  create: Mock;
  update: Mock;
  delete_by_id: Mock;
}

const SETUP = { id: "s1", fixture_id: "f1" };

function page(items: unknown[]): unknown {
  return create_success_result({ items, total_count: items.length });
}

function create_repository(): SetupRepositoryDouble {
  return {
    find_all: vi.fn().mockResolvedValue(page([])),
    find_by_id: vi.fn().mockResolvedValue(create_success_result(SETUP)),
    create: vi.fn().mockResolvedValue(create_success_result(SETUP)),
    update: vi.fn().mockResolvedValue(create_success_result(SETUP)),
    delete_by_id: vi.fn().mockResolvedValue(create_success_result(true)),
  };
}

describe("FixtureDetailsSetupUseCases", () => {
  let repository: SetupRepositoryDouble;
  let use_cases: ReturnType<typeof create_fixture_details_setup_use_cases>;

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    repository = create_repository();
    use_cases = create_fixture_details_setup_use_cases(repository as never, {
      sync_setup_officials: vi.fn().mockResolvedValue({
        success: true,
        data: true,
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the first validation error", async () => {
    expect(await use_cases.create({} as never)).toEqual(
      create_failure_result("Fixture is required"),
    );
  });

  it("rejects a second setup for the same fixture", async () => {
    repository.find_all.mockResolvedValue(page([SETUP]));

    expect(await use_cases.create({ fixture_id: "f1" } as never)).toEqual(
      create_failure_result(
        "A fixture details setup already exists for this fixture. Please edit the existing setup instead.",
      ),
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("does not create when the duplicate check cannot run", async () => {
    repository.find_all.mockResolvedValue(create_failure_result("offline"));

    expect(await use_cases.create({ fixture_id: "f1" } as never)).toEqual(
      create_failure_result("offline"),
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("creates a setup when the fixture has none", async () => {
    expect(await use_cases.create({ fixture_id: "f1" } as never)).toEqual(
      create_success_result(SETUP),
    );
  });

  it.each([
    ["confirm_assignment", CONFIRMATION_STATUS.CONFIRMED],
    ["decline_assignment", CONFIRMATION_STATUS.DECLINED],
  ] as const)("%s sets the confirmation status", async (method, status) => {
    expect((await use_cases[method]("s1" as never)).success).toBe(true);
    expect(repository.update).toHaveBeenCalledWith("s1", {
      confirmation_status: status,
    });
  });

  it("reports missing ids and missing setups", async () => {
    repository.find_by_id.mockResolvedValue(create_failure_result("missing"));

    expect(await use_cases.delete(" " as never)).toEqual(
      create_failure_result("Fixture Details Setup ID is required"),
    );
    expect(await use_cases.update("s1" as never, {})).toEqual(
      create_failure_result("Fixture details setup assignment not found"),
    );
    expect(repository.update).not.toHaveBeenCalled();
  });

  it("applies default pagination when listing", async () => {
    expect((await use_cases.list()).success).toBe(true);
    expect(repository.find_all).toHaveBeenCalledWith(
      {},
      { page_number: 1, page_size: 50 },
    );
  });
});
