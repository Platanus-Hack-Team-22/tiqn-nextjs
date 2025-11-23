"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useState } from "react";

type KnownPatientRecord = {
  _id: Id<"known_patient_records">;
  profilePicture?: string;
  firstName: string;
  lastName: string;
  bloodType?: string;
  visitNotes?: string;
};

export default function KnownPatientsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<"known_patient_records"> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "firstName" | "lastName">("all");

  // Queries
  const allRecords = useQuery(api.known_patient_records.getAll) as KnownPatientRecord[] | undefined;

  // Mutations
  const createRecord = useMutation(api.known_patient_records.create);
  const updateRecord = useMutation(api.known_patient_records.update);
  const deleteRecord = useMutation(api.known_patient_records.remove);

  // Client-side filtering - much faster than server calls
  const displayRecords = allRecords?.filter((record) => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();

    if (filterType === "firstName") {
      return record.firstName.toLowerCase().includes(searchLower);
    }
    if (filterType === "lastName") {
      return record.lastName.toLowerCase().includes(searchLower);
    }
    // "all" filter type - search both names
    return (
      record.firstName.toLowerCase().includes(searchLower) ||
      record.lastName.toLowerCase().includes(searchLower)
    );
  });

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      await createRecord({
        firstName: formData.get("firstName") as string,
        lastName: formData.get("lastName") as string,
        profilePicture: (formData.get("profilePicture") as string) || undefined,
        bloodType: (formData.get("bloodType") as string) || undefined,
        visitNotes: (formData.get("visitNotes") as string) || undefined,
      });

      setIsCreateModalOpen(false);
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error("Error creating record:", error);
      alert("Failed to create record");
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent<HTMLFormElement>, id: Id<"known_patient_records">) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      await updateRecord({
        id,
        firstName: (formData.get("firstName") as string) || undefined,
        lastName: (formData.get("lastName") as string) || undefined,
        profilePicture: (formData.get("profilePicture") as string) || undefined,
        bloodType: (formData.get("bloodType") as string) || undefined,
        visitNotes: (formData.get("visitNotes") as string) || undefined,
      });

      setEditingId(null);
    } catch (error) {
      console.error("Error updating record:", error);
      alert("Failed to update record");
    }
  };

  const handleDelete = async (id: Id<"known_patient_records">) => {
    if (confirm("Are you sure you want to delete this record?")) {
      try {
        await deleteRecord({ id });
      } catch (error) {
        console.error("Error deleting record:", error);
        alert("Failed to delete record");
      }
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Known Patient Records</h1>
            <p className="text-slate-600 mt-1">Manage patient records and medical history</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
          >
            + New Record
          </button>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6 shadow-sm">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                Search
              </label>
              <input
                type="text"
                placeholder="Search patient records..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                Filter By
              </label>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value as "all" | "firstName" | "lastName");
                }}
                className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Records</option>
                <option value="firstName">First Name</option>
                <option value="lastName">Last Name</option>
              </select>
            </div>
          </div>
        </div>

        {/* Records Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">Photo</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">First Name</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">Last Name</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">Blood Type</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">Visit Notes</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {!displayRecords ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      Loading...
                    </td>
                  </tr>
                ) : displayRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      {filterType === "all" && !searchQuery
                        ? "No patient records found"
                        : "No results matching your search"}
                    </td>
                  </tr>
                ) : (
                  displayRecords.map((record) => (
                    <tr key={record._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3">
                        {record.profilePicture ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={record.profilePicture}
                            alt={`${record.firstName} ${record.lastName}`}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600">
                            {record.firstName.charAt(0)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3 font-medium text-slate-900">{record.firstName}</td>
                      <td className="px-6 py-3 font-medium text-slate-900">{record.lastName}</td>
                      <td className="px-6 py-3">
                        {record.bloodType ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {record.bloodType}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-slate-600 max-w-xs truncate">
                        {record.visitNotes ?? <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingId(record._id)}
                            className="text-blue-600 hover:text-blue-700 font-medium text-xs uppercase tracking-wider"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(record._id)}
                            className="text-red-600 hover:text-red-700 font-medium text-xs uppercase tracking-wider"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Create New Record</h2>
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Profile Picture URL
                  </label>
                  <input
                    type="url"
                    name="profilePicture"
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Blood Type
                  </label>
                  <input
                    type="text"
                    name="bloodType"
                    placeholder="O+, A-, B+, etc."
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Visit Notes
                  </label>
                  <textarea
                    name="visitNotes"
                    rows={3}
                    placeholder="Add any notes about patient visits..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-md text-slate-700 font-medium hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingId && displayRecords && (
          <EditModal
            record={displayRecords.find((r) => r._id === editingId)!}
            onSubmit={(e) => handleUpdateSubmit(e, editingId)}
            onClose={() => setEditingId(null)}
          />
        )}
      </div>
    </div>
  );
}

function EditModal({
  record,
  onSubmit,
  onClose,
}: {
  record: KnownPatientRecord;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onClose: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true);
    try {
      await onSubmit(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Edit Record</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="firstName"
              defaultValue={record.firstName}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="lastName"
              defaultValue={record.lastName}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Profile Picture URL
            </label>
            <input
              type="url"
              name="profilePicture"
              defaultValue={record.profilePicture ?? ""}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Blood Type
            </label>
            <input
              type="text"
              name="bloodType"
              defaultValue={record.bloodType ?? ""}
              placeholder="O+, A-, B+, etc."
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Visit Notes
            </label>
            <textarea
              name="visitNotes"
              defaultValue={record.visitNotes ?? ""}
              rows={3}
              placeholder="Add any notes about patient visits..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-md text-slate-700 font-medium hover:bg-slate-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
