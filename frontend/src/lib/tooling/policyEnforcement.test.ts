import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import eslint_config from "../../../eslint.config.js";

type FlatConfigEntry = {
  files?: string[];
  rules?: Record<string, unknown>;
};

type FrontendPackageJson = {
  scripts?: {
    lint?: string;
  };
};

type ImportEnforcementConfigState =
  | { status: "missing" }
  | { status: "present"; config_entry: FlatConfigEntry };

const IMPORT_TOP_SELECTOR =
  "Program > :not(ImportDeclaration):not(ExpressionStatement[directive=true]) ~ ImportDeclaration";
const IMPORT_TOP_MESSAGE =
  "Move all imports into a single block at the top of the file.";

function load_frontend_package_json(): FrontendPackageJson {
  return JSON.parse(
    readFileSync(new URL("../../../package.json", import.meta.url), "utf8"),
  ) as FrontendPackageJson;
}

function find_matching_flat_configs(file_pattern: string): FlatConfigEntry[] {
  return (eslint_config as FlatConfigEntry[]).filter(
    (config_entry: FlatConfigEntry): boolean => {
      return Array.isArray(config_entry.files)
        ? config_entry.files.includes(file_pattern)
        : false;
    },
  );
}

function find_import_enforcement_config(
  file_pattern: string,
): ImportEnforcementConfigState {
  const matched_config = find_matching_flat_configs(file_pattern).find(
    (config_entry: FlatConfigEntry): boolean => {
      return Boolean(config_entry.rules?.["no-restricted-syntax"]);
    },
  );

  if (!matched_config) {
    return { status: "missing" };
  }

  return { status: "present", config_entry: matched_config };
}

function expect_import_top_enforcement(config_entry: FlatConfigEntry): void {
  expect(config_entry.rules).toMatchObject({
    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",
  });
  expect(config_entry.rules?.["no-restricted-syntax"]).toEqual([
    "error",
    {
      selector: IMPORT_TOP_SELECTOR,
      message: IMPORT_TOP_MESSAGE,
    },
  ]);
}

describe("policy enforcement", () => {
  it("keeps the no-null guard wired into lint", () => {
    const frontend_package_json = load_frontend_package_json();

    expect(frontend_package_json.scripts?.lint).toContain(
      "npm run guard:no-null",
    );
  });

  it("enforces top-of-file imports for ts and js files", () => {
    const config_state = find_import_enforcement_config("**/*.{js,mjs,cjs,ts}");

    if (config_state.status !== "present") {
      expect(config_state.status).toBe("present");
      return;
    }

    expect_import_top_enforcement(config_state.config_entry);
  });

  it("enforces top-of-file imports for svelte files", () => {
    const config_state = find_import_enforcement_config("**/*.svelte");

    if (config_state.status !== "present") {
      expect(config_state.status).toBe("present");
      return;
    }

    expect_import_top_enforcement(config_state.config_entry);
  });
});
