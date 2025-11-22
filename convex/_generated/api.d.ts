/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as addTranscription from "../addTranscription.js";
import type * as app_state from "../app_state.js";
import type * as calls from "../calls.js";
import type * as cleanup from "../cleanup.js";
import type * as copyFromProd from "../copyFromProd.js";
import type * as dispatchers from "../dispatchers.js";
import type * as findIncident from "../findIncident.js";
import type * as incidents from "../incidents.js";
import type * as init from "../init.js";
import type * as patients from "../patients.js";
import type * as readAll from "../readAll.js";
import type * as rescuers from "../rescuers.js";
import type * as seedFromProd from "../seedFromProd.js";
import type * as seedTestData from "../seedTestData.js";
import type * as simulate from "../simulate.js";
import type * as system from "../system.js";
import type * as testCreateAssignment from "../testCreateAssignment.js";
import type * as verification from "../verification.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  addTranscription: typeof addTranscription;
  app_state: typeof app_state;
  calls: typeof calls;
  cleanup: typeof cleanup;
  copyFromProd: typeof copyFromProd;
  dispatchers: typeof dispatchers;
  findIncident: typeof findIncident;
  incidents: typeof incidents;
  init: typeof init;
  patients: typeof patients;
  readAll: typeof readAll;
  rescuers: typeof rescuers;
  seedFromProd: typeof seedFromProd;
  seedTestData: typeof seedTestData;
  simulate: typeof simulate;
  system: typeof system;
  testCreateAssignment: typeof testCreateAssignment;
  verification: typeof verification;
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
