import type { PuntoMuestreo, PuntoPayload, Tramo } from '../types/punto.ts';

export interface ListPuntosResponse {
  puntos: PuntoMuestreo[];
  origen: 'supabase' | 'local';
}

export class ApiError extends Error {
  fieldErrors?: Record<string, string>;
  status: number;

  constructor(message: string, status: number, fieldErrors?: Record<string, string>) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export async function fetchPuntos(params?: {
  tramo?: Tramo | 'todos';
  q?: string;
}): Promise<ListPuntosResponse> {
  const searchParams = new URLSearchParams();
  if (params?.tramo && params.tramo !== 'todos') {
    searchParams.set('tramo', params.tramo);
  }
  if (params?.q && params.q.trim()) {
    searchParams.set('q', params.q.trim());
  }

  const query = searchParams.toString();
  const res = await fetch(`/api/puntos${query ? `?${query}` : ''}`);
  const data = await res.json();
  if (!res.ok) {
    throw new ApiError(data?.error || 'No se pudieron cargar los puntos.', res.status);
  }
  return data as ListPuntosResponse;
}

export async function createPuntoApi(payload: PuntoPayload): Promise<PuntoMuestreo> {
  const res = await fetch('/api/puntos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new ApiError(
      data?.error || 'No se pudo crear el punto.',
      res.status,
      data?.errors
    );
  }
  return data.punto as PuntoMuestreo;
}

export async function updatePuntoApi(
  id: string,
  payload: PuntoPayload
): Promise<PuntoMuestreo> {
  const res = await fetch(`/api/puntos/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new ApiError(
      data?.error || 'No se pudo actualizar el punto.',
      res.status,
      data?.errors
    );
  }
  return data.punto as PuntoMuestreo;
}

export async function deletePuntoApi(id: string): Promise<void> {
  const res = await fetch(`/api/puntos/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok) {
    throw new ApiError(data?.error || 'No se pudo eliminar el punto.', res.status);
  }
}
