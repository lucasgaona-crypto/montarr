import { Check, Copy, X } from 'lucide-react';
import { useState } from 'react';

interface SqlSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUPABASE_SQL = `create extension if not exists pgcrypto;

create table if not exists public.puntos_muestreo (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  latitud double precision not null check (latitud >= -90 and latitud <= 90),
  longitud double precision not null check (longitud >= -180 and longitud <= 180),
  arroyo text not null,
  fecha_muestreo date not null,
  tramo text not null check (tramo in ('aguas arriba', 'aguas abajo')),
  created_at timestamptz not null default now()
);

insert into public.puntos_muestreo (nombre, latitud, longitud, arroyo, fecha_muestreo, tramo)
values
  ('Puente Viejo — Naciente', -34.991240, -57.882410, 'Arroyo El Pescado', '2026-10-12', 'aguas arriba'),
  ('Reserva Parque Pereyra', -34.838710, -58.136920, 'Arroyo Pereyra', '2026-10-18', 'aguas abajo'),
  ('Toma Dique Roggero', -34.674320, -58.867540, 'Arroyo La Choza', '2026-11-02', 'aguas arriba');`;

export function SqlSchemaModal({ isOpen, onClose }: SqlSchemaModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SQL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sql-modal-title"
    >
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 id="sql-modal-title" className="text-base font-semibold text-slate-900">
            Esquema SQL para Supabase
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar esquema SQL"
            className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <p className="text-sm text-slate-600">
            Ejecutá este script en el editor SQL de tu proyecto Supabase para crear la tabla{' '}
            <span className="font-mono text-xs font-medium text-slate-800">puntos_muestreo</span> y cargar los tres puntos de ejemplo. Luego configurá las variables de entorno{' '}
            <span className="font-mono text-xs font-medium text-slate-800">SUPABASE_URL</span> y{' '}
            <span className="font-mono text-xs font-medium text-slate-800">SUPABASE_SERVICE_ROLE_KEY</span> en el servidor.
          </p>

          <div className="relative rounded-lg border border-slate-200 bg-slate-950 p-4">
            <button
              type="button"
              onClick={handleCopy}
              className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-800"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copiar SQL</span>
                </>
              )}
            </button>
            <pre className="overflow-x-auto pt-6 font-mono text-xs leading-relaxed text-slate-100">
              <code>{SUPABASE_SQL}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
