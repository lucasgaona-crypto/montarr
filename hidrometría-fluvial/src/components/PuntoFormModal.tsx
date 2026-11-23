import { X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import type { PuntoMuestreo, PuntoPayload, Tramo } from '../types/punto.ts';
import { validatePuntoInput, type ValidationErrors } from '../utils/validation.ts';

interface PuntoFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialPunto: PuntoMuestreo | null;
  onClose: () => void;
  onSubmit: (payload: PuntoPayload) => Promise<void>;
}

export function PuntoFormModal({
  isOpen,
  mode,
  initialPunto,
  onClose,
  onSubmit,
}: PuntoFormModalProps) {
  const [nombre, setNombre] = useState('');
  const [arroyo, setArroyo] = useState('');
  const [tramo, setTramo] = useState<Tramo>('aguas arriba');
  const [fechaMuestreo, setFechaMuestreo] = useState('');
  const [latitud, setLatitud] = useState('');
  const [longitud, setLongitud] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && initialPunto) {
      setNombre(initialPunto.nombre);
      setArroyo(initialPunto.arroyo);
      setTramo(initialPunto.tramo);
      setFechaMuestreo(initialPunto.fecha_muestreo);
      setLatitud(String(initialPunto.latitud));
      setLongitud(String(initialPunto.longitud));
    } else {
      const today = new Date().toISOString().slice(0, 10);
      setNombre('');
      setArroyo('');
      setTramo('aguas arriba');
      setFechaMuestreo(today);
      setLatitud('');
      setLongitud('');
    }
    setErrors({});
    setSubmitError(null);
  }, [isOpen, mode, initialPunto]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const validation = validatePuntoInput({
      nombre,
      arroyo,
      fecha_muestreo: fechaMuestreo,
      tramo,
      latitud,
      longitud,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      await onSubmit(validation.data);
      onClose();
    } catch (err) {
      const anyErr = err as { message?: string; fieldErrors?: ValidationErrors };
      if (anyErr.fieldErrors) {
        setErrors(anyErr.fieldErrors);
      }
      setSubmitError(anyErr.message || 'Ocurrió un error al guardar el punto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="punto-modal-title"
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 id="punto-modal-title" className="text-base font-semibold text-slate-900">
            {mode === 'create' ? 'Agregar punto de muestreo' : 'Editar punto de muestreo'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar formulario"
            className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5" noValidate>
          {submitError && (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800">
              {submitError}
            </div>
          )}

          <div>
            <label htmlFor="campo-nombre" className="block text-xs font-medium text-slate-700">
              Nombre del punto
            </label>
            <input
              id="campo-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Puente Viejo — Naciente"
              className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none"
            />
            {errors.nombre && (
              <p className="mt-1 text-xs text-rose-600">{errors.nombre}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="campo-arroyo" className="block text-xs font-medium text-slate-700">
                Arroyo
              </label>
              <input
                id="campo-arroyo"
                type="text"
                value={arroyo}
                onChange={(e) => setArroyo(e.target.value)}
                placeholder="Ej. Arroyo El Pescado"
                className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none"
              />
              {errors.arroyo && (
                <p className="mt-1 text-xs text-rose-600">{errors.arroyo}</p>
              )}
            </div>

            <div>
              <label htmlFor="campo-fecha" className="block text-xs font-medium text-slate-700">
                Fecha de muestreo
              </label>
              <input
                id="campo-fecha"
                type="date"
                value={fechaMuestreo}
                onChange={(e) => setFechaMuestreo(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-sm tabular-nums text-slate-900 focus:border-teal-700 focus:outline-none"
              />
              {errors.fecha_muestreo && (
                <p className="mt-1 text-xs text-rose-600">{errors.fecha_muestreo}</p>
              )}
            </div>
          </div>

          <div>
            <span className="block text-xs font-medium text-slate-700">Tramo</span>
            <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setTramo('aguas arriba')}
                className={`whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                  tramo === 'aguas arriba'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Aguas arriba
              </button>
              <button
                type="button"
                onClick={() => setTramo('aguas abajo')}
                className={`whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                  tramo === 'aguas abajo'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Aguas abajo
              </button>
            </div>
            {errors.tramo && (
              <p className="mt-1 text-xs text-rose-600">{errors.tramo}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="campo-latitud" className="block text-xs font-medium text-slate-700">
                Latitud (grados decimales)
              </label>
              <input
                id="campo-latitud"
                type="text"
                inputMode="decimal"
                value={latitud}
                onChange={(e) => setLatitud(e.target.value)}
                placeholder="-34.991240"
                className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-sm tabular-nums text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-slate-500">Rango válido: −90 a 90</p>
              {errors.latitud && (
                <p className="mt-0.5 text-xs text-rose-600">{errors.latitud}</p>
              )}
            </div>

            <div>
              <label htmlFor="campo-longitud" className="block text-xs font-medium text-slate-700">
                Longitud (grados decimales)
              </label>
              <input
                id="campo-longitud"
                type="text"
                inputMode="decimal"
                value={longitud}
                onChange={(e) => setLongitud(e.target.value)}
                placeholder="-57.882410"
                className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-sm tabular-nums text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-slate-500">Rango válido: −180 a 180</p>
              {errors.longitud && (
                <p className="mt-0.5 text-xs text-rose-600">{errors.longitud}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="whitespace-nowrap rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="whitespace-nowrap rounded-md bg-teal-700 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-teal-800 disabled:opacity-60"
            >
              {isSubmitting
                ? 'Guardando...'
                : mode === 'create'
                  ? 'Guardar punto'
                  : 'Actualizar punto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
