"use client";

import { useState } from "react";

type EmergencyConfirmationPopupProps = {
  onClose: () => void;
  onConfirm: () => void;
};

export function EmergencyConfirmationPopup({
  onClose,
  onConfirm,
}: EmergencyConfirmationPopupProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = () => {
    setIsConfirming(true);
    try {
      onConfirm();
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="absolute bottom-6 right-6 w-96 bg-white border border-red-300 rounded-lg shadow-2xl shadow-red-500/20 z-50 flex flex-col animate-fade-in-up">
      <div className="bg-gradient-to-r from-red-600 to-red-700 px-3 py-2 rounded-t-lg flex justify-between items-center border-b border-red-800">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5 text-white"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-white font-semibold text-xs uppercase tracking-wider">
            Confirmar Emergencia
          </span>
        </div>
        <button onClick={onClose} className="text-red-200 hover:text-white transition">
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
          ¿Deseas confirmar que esta es una emergencia real?
        </p>
        <p className="text-slate-500 text-[10px] mb-3 leading-relaxed">
          Al confirmar, se notificará a los rescatistas disponibles para que puedan aceptar esta emergencia.
        </p>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded text-xs font-semibold transition uppercase tracking-wider border border-slate-300"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConfirming}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded text-xs font-semibold transition flex items-center justify-center gap-1.5 uppercase tracking-wider border border-red-700 disabled:opacity-75"
          >
            {isConfirming ? (
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
                Confirmando...
              </>
            ) : (
              <>
                <span>Confirmar</span>
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
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

