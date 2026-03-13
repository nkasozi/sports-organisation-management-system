/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin_seed from "../admin_seed.js";
import type * as audit_logs from "../audit_logs.js";
import type * as authorization from "../authorization.js";
import type * as crons from "../crons.js";
import type * as lib_auth_middleware from "../lib/auth_middleware.js";
import type * as seed_permissions from "../seed_permissions.js";
import type * as shared_permission_definitions from "../shared_permission_definitions.js";
import type * as sync from "../sync.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin_seed: typeof admin_seed;
  audit_logs: typeof audit_logs;
  authorization: typeof authorization;
  crons: typeof crons;
  "lib/auth_middleware": typeof lib_auth_middleware;
  seed_permissions: typeof seed_permissions;
  shared_permission_definitions: typeof shared_permission_definitions;
  sync: typeof sync;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
