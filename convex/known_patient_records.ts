import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a known patient record
export const create = mutation({
  args: {
    profilePicture: v.optional(v.string()),
    firstName: v.string(),
    lastName: v.string(),
    bloodType: v.optional(v.string()),
    visitNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const recordId = await ctx.db.insert("known_patient_records", {
      profilePicture: args.profilePicture,
      firstName: args.firstName,
      lastName: args.lastName,
      bloodType: args.bloodType,
      visitNotes: args.visitNotes,
    });
    return recordId;
  },
});

// Get a known patient record by ID
export const get = query({
  args: {
    id: v.id("known_patient_records"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Search for known patient records by name (loose ILIKE-style matching)
// Returns an array of matching records or empty array if no matches
export const searchByName = query({
  args: {
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Helper function to check if a value loosely matches the search term
    const looseMatch = (value: string, searchTerm: string | undefined): boolean => {
      if (!searchTerm) return true;
      return value.toLowerCase().includes(searchTerm.toLowerCase());
    };

    // Get all records and filter them in-memory
    // This is acceptable for reasonable dataset sizes; for very large datasets, consider full-text search
    const allRecords = await ctx.db.query("known_patient_records").collect();

    const filtered = allRecords.filter((record) => {
      const firstNameMatch = looseMatch(record.firstName, args.firstName);
      const lastNameMatch = looseMatch(record.lastName, args.lastName);
      return firstNameMatch && lastNameMatch;
    });

    return filtered;
  },
});

// Search by first name only (returns array)
export const searchByFirstName = query({
  args: {
    firstName: v.string(),
  },
  handler: async (ctx, args) => {
    const allRecords = await ctx.db.query("known_patient_records").collect();

    return allRecords.filter((record) =>
      record.firstName.toLowerCase().includes(args.firstName.toLowerCase())
    );
  },
});

// Search by last name only (returns array)
export const searchByLastName = query({
  args: {
    lastName: v.string(),
  },
  handler: async (ctx, args) => {
    const allRecords = await ctx.db.query("known_patient_records").collect();

    return allRecords.filter((record) =>
      record.lastName.toLowerCase().includes(args.lastName.toLowerCase())
    );
  },
});

// Get all known patient records
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("known_patient_records").collect();
  },
});

// Update a known patient record
export const update = mutation({
  args: {
    id: v.id("known_patient_records"),
    profilePicture: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    bloodType: v.optional(v.string()),
    visitNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updateArgs } = args;

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    if (updateArgs.profilePicture !== undefined) updateData.profilePicture = updateArgs.profilePicture;
    if (updateArgs.firstName !== undefined) updateData.firstName = updateArgs.firstName;
    if (updateArgs.lastName !== undefined) updateData.lastName = updateArgs.lastName;
    if (updateArgs.bloodType !== undefined) updateData.bloodType = updateArgs.bloodType;
    if (updateArgs.visitNotes !== undefined) updateData.visitNotes = updateArgs.visitNotes;

    await ctx.db.patch(id, updateData);
    return await ctx.db.get(id);
  },
});

// Delete a known patient record
export const remove = mutation({
  args: {
    id: v.id("known_patient_records"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});
