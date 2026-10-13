import type { Mock } from "vitest";

export type MockFunctions = Record<string, Mock>;

export type MockUseCases = Record<string, MockFunctions>;
