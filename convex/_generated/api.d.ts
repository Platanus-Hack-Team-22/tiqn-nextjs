/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as app_state from "../app_state.js";
import type * as calls from "../calls.js";
import type * as dispatchers from "../dispatchers.js";
import type * as incidentAssignments from "../incidentAssignments.js";
import type * as incidents from "../incidents.js";
import type * as init from "../init.js";
import type * as known_patient_records from "../known_patient_records.js";
import type * as patients from "../patients.js";
import type * as rescuers from "../rescuers.js";
import type * as seedTestData from "../seedTestData.js";
import type * as system from "../system.js";
import type * as tasks from "../tasks.js";
import type * as testCreateAssignment from "../testCreateAssignment.js";
import type * as verification from "../verification.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  app_state: typeof app_state;
  calls: typeof calls;
  dispatchers: typeof dispatchers;
  incidentAssignments: typeof incidentAssignments;
  incidents: typeof incidents;
  init: typeof init;
  known_patient_records: typeof known_patient_records;
  patients: typeof patients;
  rescuers: typeof rescuers;
  seedTestData: typeof seedTestData;
  system: typeof system;
  tasks: typeof tasks;
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
