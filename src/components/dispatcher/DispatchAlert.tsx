"use client";

import { useState } from "react";

type DispatchAlertProps = {
  incidentType: string;
  location: string;
  onClose: () => void;
  onDispatch: () => void;
};

export function DispatchAlert({ incidentType, location, onClose, onDispatch }: DispatchAlertProps) {
  const [isSending, setIsSending] = useState(false);

  const handleDispatch = async () => {
    setIsSending(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSending(false);
    onDispatch();
  };

  return (
    <div className="absolute bottom-6 right-6 w-96 bg-white border border-blue-300 rounded-lg shadow-2xl shadow-blue-500/20 z-50 flex flex-col animate-fade-in-up">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-3 py-2 rounded-t-lg flex justify-between items-center border-b border-blue-800">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5 text-white"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
          <span className="text-white font-semibold text-xs uppercase tracking-wider">Dispatch Alert</span>
        </div>
        <button onClick={onClose} className="text-blue-200 hover:text-white transition">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      <div className="p-3">
        <p className="text-slate-600 text-xs mb-3 leading-relaxed">
          Sufficient data detected. Ready to dispatch rescue units.
        </p>

        <div className="bg-slate-50 p-2.5 rounded border border-slate-200 mb-3">
          <div className="flex items-start gap-2 mb-1.5">
            <span className="text-[10px] font-semibold text-red-600 uppercase w-14 tracking-wider">Event:</span>
            <span className="text-xs text-slate-900 font-medium">{incidentType}</span>
          </div>
          <div className="flex items-start gap-2 mb-1.5">
            <span className="text-[10px] font-semibold text-yellow-600 uppercase w-14 tracking-wider">
              Location:
            </span>
            <span className="text-xs text-slate-900 font-mono">{location}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[10px] font-semibold text-slate-500 uppercase w-14 tracking-wider">
              Units:
            </span>
            <span className="text-xs text-emerald-600 font-mono">2 available • ETA &lt; 3min</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded text-xs font-semibold transition uppercase tracking-wider border border-slate-300"
          >
            Edit
          </button>
          <button
            onClick={handleDispatch}
            disabled={isSending}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded text-xs font-semibold transition flex items-center justify-center gap-1.5 uppercase tracking-wider border border-blue-700 disabled:opacity-75"
          >
            {isSending ? (
              <>
                <svg
                  className="animate-spin h-3 w-3 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Enviando...
              </>
            ) : (
              <>
                <span>Dispatch</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

