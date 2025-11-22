import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    incidentId: v.id("incidents"),
    transcription: v.optional(v.string()),
    transcriptionChunks: v.optional(
      v.array(
        v.object({
          offset: v.number(),
          speaker: v.union(v.literal("caller"), v.literal("dispatcher"), v.literal("system")),
          text: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const callId = await ctx.db.insert("calls", args);
    return callId;
  },
});

