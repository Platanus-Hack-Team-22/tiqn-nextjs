import { type FunctionReference, anyApi } from "convex/server";
import { type GenericId as Id } from "convex/values";

export const api: PublicApiType = anyApi as unknown as PublicApiType;
export const internal: InternalApiType = anyApi as unknown as InternalApiType;

export type PublicApiType = {
  tasks: {
    get: FunctionReference<"query", "public", Record<string, never>, any>;
  };
  verification: {
    getDispatchers: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      any
    >;
    getIncidents: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      any
    >;
    getPatients: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      any
    >;
  };
  rescuers: {
    getAvailableIncidents: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      any
    >;
    getRescuerActiveAssignment: FunctionReference<
      "query",
      "public",
      { rescuerId: Id<"rescuers"> },
      any
    >;
    getRescuerDetails: FunctionReference<
      "query",
      "public",
      { rescuerId: Id<"rescuers"> },
      any
    >;
    getAllRescuers: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      any
    >;
    acceptIncident: FunctionReference<
      "mutation",
      "public",
      {
        incidentAssignmentId: Id<"incidentAssignments">;
        rescuerId: Id<"rescuers">;
      },
      any
    >;
    rejectIncident: FunctionReference<
      "mutation",
      "public",
      { incidentAssignmentId: Id<"incidentAssignments"> },
      any
    >;
    completeIncident: FunctionReference<
      "mutation",
      "public",
      { incidentAssignmentId: Id<"incidentAssignments"> },
      any
    >;
    updateRescuerLocation: FunctionReference<
      "mutation",
      "public",
      { coordinates: { lat: number; lng: number }; rescuerId: Id<"rescuers"> },
      any
    >;
  };
};
export type InternalApiType = {};
