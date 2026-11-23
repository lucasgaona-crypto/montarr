import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { DeleteConfirmModal } from './components/DeleteConfirmModal.tsx';
import { PuntoFormModal } from './components/PuntoFormModal.tsx';
import { SamplingMap } from './components/SamplingMap.tsx';
import { SqlSchemaModal } from './components/SqlSchemaModal.tsx';
import {
  createPuntoApi,
  deletePuntoApi,
  fetchPuntos,
  updatePuntoApi,
} from './services/puntosApi.ts';
import type { PuntoMuestreo, PuntoPayload, Tramo } from './types/punto.ts';

type FilterTramo = 'todos' | Tramo;

export default function App() {
  const [puntos, setPuntos] = useState<PuntoMuestreo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTramo, setFilterTramo] = useState<FilterTramo>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPunto, setSelectedPunto] = useState<PuntoMuestreo | null>(null);
  const [focusTrigger, setFocusTrigger] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingPunto, setEditingPunto] = useState<PuntoMuestreo | null>(null);
  const [deletingPunto, setDeletingPunto] = useState<PuntoMuestreo | null>(null);
  const [sqlModalOpen, setSqlModalOpen] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const onQuotaExceeded = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
  }, []);

  const loadPuntos = useCallback(
    async (tramo: FilterTramo, q: string, preferredId?: string | null) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchPuntos({ tramo, q });
        setPuntos(res.puntos);
        setSelectedPunto((prev) => {
          const targetId = preferredId !== undefined ? preferredId : prev?.id;
          if (targetId) {
            const found = res.puntos.find((p) => p.id === targetId);
            if (found) return found;
          }
          return res.puntos[0] ?? null;
        });
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'No se pudieron obtener los puntos.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadPuntos(filterTramo, searchQuery);
    }, 150);
    return () => clearTimeout(timeout);
  }, [filterTramo, searchQuery, loadPuntos]);

  const handleOpenCreate = () => {
    setFormMode('create');
    setEditingPunto(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (punto: PuntoMuestreo) => {
    setFormMode('edit');
    setEditingPunto(punto);
    setFormOpen(true);
  };

  const handleFormSubmit = async (payload: PuntoPayload) => {
    if (formMode === 'create') {
      const created = await createPuntoApi(payload);
      await loadPuntos(filterTramo, searchQuery, created.id);
      setFocusTrigger((n) => n + 1);
    } else if (editingPunto) {
      const updated = await updatePuntoApi(editingPunto.id, payload);
      await loadPuntos(filterTramo, searchQuery, updated.id);
      setFocusTrigger((n) => n + 1);
    }
  };

  const handleDeleteConfirm = async (punto: PuntoMuestreo) => {
    await deletePuntoApi(punto.id);
    setDeletingPunto(null);
    const nextPreferred = selectedPunto?.id === punto.id ? null : selectedPunto?.id;
    await loadPuntos(filterTramo, searchQuery, nextPreferred);
  };

  const handleSelectPunto = (punto: PuntoMuestreo) => {
    setSelectedPunto(punto);
    setFocusTrigger((n) => n + 1);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {quotaExceeded && (
        <div className="sticky top-0 z-50 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-xs text-amber-900 shadow-sm md:text-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-amber-950 underline hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Top Bar: strict 3-zone contract */}
      <header className="flex items-center justify-between gap-8 border-b border-slate-200 bg-white px-6 py-3.5">
        <a
          href="#puntos"
          className="shrink-0 whitespace-nowrap text-lg font-bold tracking-tight text-slate-900"
        >
          Hidrometría Fluvial
        </a>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <a
            href="#puntos"
            className="shrink-0 whitespace-nowrap transition-colors hover:text-slate-900"
          >
            Puntos de muestreo
          </a>
          <button
            type="button"
            onClick={() => setSqlModalOpen(true)}
            className="shrink-0 whitespace-nowrap transition-colors hover:text-slate-900"
          >
            Esquema SQL
          </button>
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-teal-700 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nuevo punto</span>
          </button>
        </div>
      </header>

      {/* Main Split Workspace */}
      <main
        id="puntos"
        className="flex flex-1 flex-col lg:h-[calc(100vh-57px)] lg:flex-row lg:overflow-hidden"
      >
        {/* Left List & Filters Column */}
        <aside className="flex w-full shrink-0 flex-col border-b border-slate-200 bg-white lg:w-[430px] lg:border-b-0 lg:border-r">
          <div className="space-y-3 border-b border-slate-200 p-4">
            <div className="flex items-baseline justify-between gap-4">
              <h1 className="text-base font-semibold text-slate-900">
                Estaciones registradas
              </h1>
              <span className="font-mono text-xs tabular-nums text-slate-500">
                {puntos.length} {puntos.length === 1 ? 'punto' : 'puntos'}
              </span>
            </div>

            {/* Tramo segmented filter */}
            <div
              className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1"
              role="tablist"
              aria-label="Filtrar por tramo"
            >
              {(
                [
                  { id: 'todos', label: 'Todos' },
                  { id: 'aguas arriba', label: 'Aguas arriba' },
                  { id: 'aguas abajo', label: 'Aguas abajo' },
                ] as const
              ).map((option) => {
                const active = filterTramo === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setFilterTramo(option.id)}
                    className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            {/* Search input */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o arroyo..."
                aria-label="Buscar por nombre o arroyo"
                className="w-full rounded-md border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 md:hidden">
              <button
                type="button"
                onClick={() => setSqlModalOpen(true)}
                className="font-medium text-teal-700 hover:underline"
              >
                Ver esquema SQL de Supabase
              </button>
            </div>
          </div>

          {/* Sampling Points List */}
          <div className="flex-1 overflow-y-auto">
            {error && (
              <div className="m-4 rounded-md border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800">
                {error}
              </div>
            )}

            {loading ? (
              <div className="divide-y divide-slate-100">
                {[0, 1, 2].map((idx) => (
                  <div key={idx} className="space-y-2 p-4">
                    <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
                    <div className="h-3 w-64 animate-pulse rounded bg-slate-100" />
                    <div className="h-3 w-40 animate-pulse rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : puntos.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                <p className="text-sm font-medium text-slate-800">
                  No hay puntos para mostrar
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Cambiá el filtro de tramo o agregá un nuevo punto de muestreo.
                </p>
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="mt-4 inline-flex items-center gap-1.5 whitespace-nowrap rounded-md bg-teal-700 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-teal-800"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Agregar punto</span>
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-slate-200">
                {puntos.map((punto) => {
                  const isSelected = selectedPunto?.id === punto.id;
                  return (
                    <li
                      key={punto.id}
                      onClick={() => handleSelectPunto(punto)}
                      className={`cursor-pointer px-4 py-3.5 transition-colors ${
                        isSelected ? 'bg-teal-50/70' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {punto.nombre}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-600">
                            <span>{punto.arroyo}</span>
                            <span aria-hidden="true">·</span>
                            <span
                              className={
                                punto.tramo === 'aguas arriba'
                                  ? 'font-medium text-teal-800'
                                  : 'font-medium text-sky-800'
                              }
                            >
                              {punto.tramo === 'aguas arriba'
                                ? 'Aguas arriba'
                                : 'Aguas abajo'}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums text-slate-500">
                              {punto.fecha_muestreo}
                            </span>
                          </div>
                          <p className="mt-1.5 font-mono text-xs tabular-nums text-slate-500">
                            {punto.latitud.toFixed(6)}, {punto.longitud.toFixed(6)}
                          </p>
                        </div>

                        <div
                          className="flex shrink-0 items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(punto)}
                            aria-label={`Editar ${punto.nombre}`}
                            title="Editar"
                            className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingPunto(punto)}
                            aria-label={`Eliminar ${punto.nombre}`}
                            title="Eliminar"
                            className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* Right Interactive Google Maps Stage */}
        <section
          aria-label="Mapa de puntos de muestreo"
          className="relative h-[520px] flex-1 bg-slate-100 lg:h-full"
        >
          <SamplingMap
            puntos={puntos}
            selectedPunto={selectedPunto}
            onSelectPunto={handleSelectPunto}
            focusTrigger={focusTrigger}
          />
        </section>
      </main>

      <PuntoFormModal
        isOpen={formOpen}
        mode={formMode}
        initialPunto={editingPunto}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <DeleteConfirmModal
        punto={deletingPunto}
        onCancel={() => setDeletingPunto(null)}
        onConfirm={handleDeleteConfirm}
      />

      <SqlSchemaModal
        isOpen={sqlModalOpen}
        onClose={() => setSqlModalOpen(false)}
      />
    </div>
  );
}
