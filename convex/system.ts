import { query } from "./_generated/server";

/**
 * Get current server timestamp
 */
export const now = query({
  handler: async () => {
    return Date.now();
  },
});

