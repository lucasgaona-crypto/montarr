import { X } from 'lucide-react';
import { useState } from 'react';
import type { PuntoMuestreo } from '../types/punto.ts';

interface DeleteConfirmModalProps {
  punto: PuntoMuestreo | null;
  onCancel: () => void;
  onConfirm: (punto: PuntoMuestreo) => Promise<void>;
}

export function DeleteConfirmModal({
  punto,
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!punto) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(punto);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 id="delete-modal-title" className="text-base font-semibold text-slate-900">
            Eliminar punto de muestreo
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cerrar confirmación"
            className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm text-slate-700">
            ¿Querés eliminar el registro{' '}
            <span className="font-semibold text-slate-900">{punto.nombre}</span> del{' '}
            {punto.arroyo}? Esta acción no se puede deshacer.
          </p>
          <p className="mt-2 font-mono text-xs tabular-nums text-slate-500">
            {punto.latitud.toFixed(6)}, {punto.longitud.toFixed(6)} · {punto.fecha_muestreo}
          </p>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="whitespace-nowrap rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isDeleting}
              className="whitespace-nowrap rounded-md bg-rose-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-rose-700 disabled:opacity-60"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
