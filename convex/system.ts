import { query } from "./_generated/server";

// Get current server timestamp (called by backend)
export const now = query({
  args: {},
  handler: async () => {
    return Date.now();
  },
});

