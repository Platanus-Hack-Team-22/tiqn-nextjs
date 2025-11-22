"use client";

type Patient = {
  firstName: string;
  lastName: string;
  age?: number;
  sex?: "M" | "F" | "Other";
  medicalHistory: string[];
  medications: string[];
  allergies: string[];
};

type IncidentFormProps = {
  incidentType?: string;
  location: {
    address: string;
    city?: string;
    district?: string;
    reference?: string;
  };
  patient?: Patient;
};

export function IncidentForm({ incidentType, location, patient }: IncidentFormProps) {
  const hasPatientData = patient && (patient.firstName || patient.age);

  return (
    <div className="p-5 max-w-4xl mx-auto w-full">
      {/* AI Status Banner */}
      {incidentType && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-2.5 flex items-start gap-2.5">
          <div className="mt-0.5 text-blue-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-xs text-blue-700 leading-relaxed">
              <span className="font-semibold text-blue-800">AI Analysis:</span> Critical keywords
              detected. Protocol{" "}
              <span className="font-mono text-blue-900">{incidentType.toUpperCase().replace(/\s+/g, "_")}</span>{" "}
              suggested.
            </p>
          </div>
        </div>
      )}

      {/* Form Grid */}
      <div className="grid grid-cols-1 gap-4">
        {/* Section 1: Critical */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              01. Incident & Location
            </h4>
            <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-200 uppercase font-mono">
              Critical
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] text-slate-600 uppercase mb-1.5 tracking-wider">
                Incident Type
              </label>
              <input
                type="text"
                readOnly
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 font-medium"
                value={incidentType ?? ""}
                placeholder="Describe incident..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-[10px] text-slate-600 uppercase mb-1.5 tracking-wider">
                  Location
                </label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    className="w-full bg-white border border-yellow-400/50 rounded-md px-3 py-2 text-sm text-slate-900 pl-9 font-mono"
                    value={location.address}
                    placeholder="Address..."
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5 text-yellow-600 absolute left-2.5 top-2.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="absolute right-2 top-1.5">
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200 font-mono">
                      VERIFIED
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-slate-600 uppercase mb-1.5 tracking-wider">
                  Reference
                </label>
                <input
                  type="text"
                  readOnly
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900"
                  value={location.reference ?? ""}
                  placeholder="Landmark"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-600 uppercase mb-1.5 tracking-wider">
                  City/District
                </label>
                <input
                  type="text"
                  readOnly
                  className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 font-mono"
                  value={location.district ?? location.city ?? ""}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Patient */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              02. Patient Information
            </h4>
          </div>
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-6">
              <label className="block text-[10px] text-slate-600 uppercase mb-1.5 tracking-wider">
                Name
              </label>
              <input
                type="text"
                readOnly
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900"
                value={hasPatientData ? `${patient.firstName} ${patient.lastName}`.trim() : ""}
                placeholder="Unknown"
              />
            </div>
            <div className="col-span-3">
              <label className="block text-[10px] text-slate-600 uppercase mb-1.5 tracking-wider">
                Age
              </label>
              <input
                type="text"
                readOnly
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 font-mono"
                value={patient?.age?.toString() ?? ""}
                placeholder="--"
              />
            </div>
            <div className="col-span-3">
              <label className="block text-[10px] text-slate-600 uppercase mb-1.5 tracking-wider">
                Sex
              </label>
              <select
                disabled
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900"
              >
                <option>{patient?.sex ?? "--"}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Medical History */}
        <div className={`bg-white p-4 rounded-lg border border-slate-200 ${hasPatientData ? "" : "opacity-50"}`}>
          <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">
            03. Medical History
          </h4>
          {hasPatientData && (patient.medicalHistory.length > 0 || patient.medications.length > 0) ? (
            <div className="space-y-2">
              {patient.medicalHistory.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-600 uppercase mb-1.5 tracking-wider">Conditions</p>
                  <div className="space-y-1">
                    {patient.medicalHistory.map((condition, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{condition}</p>
                          <p className="text-xs text-slate-500">Chronic condition</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {patient.medications.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-600 uppercase mb-1.5 tracking-wider">Medications</p>
                  <div className="space-y-1">
                    {patient.medications.map((med, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{med}</p>
                          <p className="text-xs text-slate-500">Current medication</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[10px] text-slate-400 font-mono">Awaiting data...</p>
          )}
        </div>
      </div>
    </div>
  );
}

