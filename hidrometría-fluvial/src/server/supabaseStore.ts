import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { PuntoMuestreo, PuntoPayload, Tramo } from '../types/punto.ts';

const TABLE_NAME = 'puntos_muestreo';
const DATA_DIR = path.resolve(process.cwd(), 'data');
const LOCAL_STORE_FILE = path.join(DATA_DIR, 'puntos.json');

export const SEED_PUNTOS: PuntoPayload[] = [
  {
    nombre: 'Puente Viejo — Naciente',
    latitud: -34.99124,
    longitud: -57.88241,
    arroyo: 'Arroyo El Pescado',
    fecha_muestreo: '2026-10-12',
    tramo: 'aguas arriba',
  },
  {
    nombre: 'Reserva Parque Pereyra',
    latitud: -34.83871,
    longitud: -58.13692,
    arroyo: 'Arroyo Pereyra',
    fecha_muestreo: '2026-10-18',
    tramo: 'aguas abajo',
  },
  {
    nombre: 'Toma Dique Roggero',
    latitud: -34.67432,
    longitud: -58.86754,
    arroyo: 'Arroyo La Choza',
    fecha_muestreo: '2026-11-02',
    tramo: 'aguas arriba',
  },
];

let supabaseClient: SupabaseClient | null = null;
let supabaseSeeded = false;

function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL?.trim();
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim();

  if (!url || !key) {
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return supabaseClient;
}

function readLocalStore(): PuntoMuestreo[] {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(LOCAL_STORE_FILE)) {
    const initial: PuntoMuestreo[] = SEED_PUNTOS.map((item, index) => ({
      id: crypto.randomUUID(),
      ...item,
      created_at: new Date(Date.now() - (SEED_PUNTOS.length - index) * 60000).toISOString(),
    }));
    fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }

  const raw = fs.readFileSync(LOCAL_STORE_FILE, 'utf-8');
  const parsed = JSON.parse(raw) as PuntoMuestreo[];
  return Array.isArray(parsed) ? parsed : [];
}

function writeLocalStore(items: PuntoMuestreo[]): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(items, null, 2), 'utf-8');
}

async function ensureSupabaseSeeded(client: SupabaseClient): Promise<void> {
  if (supabaseSeeded) return;
  const { count, error } = await client
    .from(TABLE_NAME)
    .select('id', { count: 'exact', head: true });

  if (error) {
    throw new Error('No se pudo consultar la tabla en Supabase.', { cause: error });
  }

  if ((count ?? 0) === 0) {
    const { error: insertError } = await client.from(TABLE_NAME).insert(SEED_PUNTOS);
    if (insertError) {
      throw new Error('No se pudieron cargar los ejemplos iniciales en Supabase.', {
        cause: insertError,
      });
    }
  }
  supabaseSeeded = true;
}

export async function listPuntos(filters?: {
  tramo?: Tramo;
  q?: string;
}): Promise<{ data: PuntoMuestreo[]; backend: 'supabase' | 'local' }> {
  const client = getSupabaseClient();
  const queryText = filters?.q?.trim().toLowerCase() ?? '';

  if (client) {
    await ensureSupabaseSeeded(client);
    let query = client
      .from(TABLE_NAME)
      .select('id, nombre, latitud, longitud, arroyo, fecha_muestreo, tramo, created_at')
      .order('fecha_muestreo', { ascending: false })
      .order('created_at', { ascending: false });

    if (filters?.tramo) {
      query = query.eq('tramo', filters.tramo);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error('Error al leer puntos desde Supabase.', { cause: error });
    }

    const rows = (data ?? []) as PuntoMuestreo[];
    const filtered = queryText
      ? rows.filter(
          (row) =>
            row.nombre.toLowerCase().includes(queryText) ||
            row.arroyo.toLowerCase().includes(queryText)
        )
      : rows;

    return { data: filtered, backend: 'supabase' };
  }

  const rows = readLocalStore()
    .slice()
    .sort((a, b) => b.fecha_muestreo.localeCompare(a.fecha_muestreo));

  const filtered = rows.filter((row) => {
    if (filters?.tramo && row.tramo !== filters.tramo) return false;
    if (
      queryText &&
      !row.nombre.toLowerCase().includes(queryText) &&
      !row.arroyo.toLowerCase().includes(queryText)
    ) {
      return false;
    }
    return true;
  });

  return { data: filtered, backend: 'local' };
}

export async function createPunto(payload: PuntoPayload): Promise<PuntoMuestreo> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from(TABLE_NAME)
      .insert(payload)
      .select('id, nombre, latitud, longitud, arroyo, fecha_muestreo, tramo, created_at')
      .single();

    if (error || !data) {
      throw new Error('Error al guardar el punto en Supabase.', { cause: error });
    }
    return data as PuntoMuestreo;
  }

  const items = readLocalStore();
  const created: PuntoMuestreo = {
    id: crypto.randomUUID(),
    ...payload,
    created_at: new Date().toISOString(),
  };
  items.unshift(created);
  writeLocalStore(items);
  return created;
}

export async function updatePunto(
  id: string,
  payload: PuntoPayload
): Promise<PuntoMuestreo | null> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from(TABLE_NAME)
      .update(payload)
      .eq('id', id)
      .select('id, nombre, latitud, longitud, arroyo, fecha_muestreo, tramo, created_at')
      .maybeSingle();

    if (error) {
      throw new Error('Error al actualizar el punto en Supabase.', { cause: error });
    }
    return (data as PuntoMuestreo | null) ?? null;
  }

  const items = readLocalStore();
  const idx = items.findIndex((item) => item.id === id);
  if (idx === -1) return null;

  const updated: PuntoMuestreo = {
    ...items[idx],
    ...payload,
  };
  items[idx] = updated;
  writeLocalStore(items);
  return updated;
}

export async function deletePunto(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from(TABLE_NAME)
      .delete()
      .eq('id', id)
      .select('id');

    if (error) {
      throw new Error('Error al eliminar el punto en Supabase.', { cause: error });
    }
    return Array.isArray(data) && data.length > 0;
  }

  const items = readLocalStore();
  const next = items.filter((item) => item.id !== id);
  if (next.length === items.length) return false;
  writeLocalStore(next);
  return true;
}
