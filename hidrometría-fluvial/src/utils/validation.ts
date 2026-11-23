import type { PuntoPayload, Tramo } from '../types/punto.ts';

export interface ValidationErrors {
  nombre?: string;
  arroyo?: string;
  fecha_muestreo?: string;
  tramo?: string;
  latitud?: string;
  longitud?: string;
}

export function parseDecimalCoordinate(raw: unknown): number {
  if (typeof raw === 'number') {
    return raw;
  }
  if (typeof raw === 'string') {
    const normalized = raw.trim().replace(',', '.');
    if (normalized === '') {
      return Number.NaN;
    }
    if (!/^[+-]?\d+(\.\d+)?$/.test(normalized)) {
      return Number.NaN;
    }
    return Number(normalized);
  }
  return Number.NaN;
}

export function validateLatitude(lat: number): string | undefined {
  if (!Number.isFinite(lat)) {
    return 'Ingresá una latitud numérica en grados decimales.';
  }
  if (lat < -90 || lat > 90) {
    return 'La latitud debe estar entre −90 y 90 grados decimales.';
  }
  return undefined;
}

export function validateLongitude(lng: number): string | undefined {
  if (!Number.isFinite(lng)) {
    return 'Ingresá una longitud numérica en grados decimales.';
  }
  if (lng < -180 || lng > 180) {
    return 'La longitud debe estar entre −180 y 180 grados decimales.';
  }
  return undefined;
}

export function isValidTramo(value: unknown): value is Tramo {
  return value === 'aguas arriba' || value === 'aguas abajo';
}

export function isValidIsoDate(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

export function validatePuntoInput(input: {
  nombre?: unknown;
  arroyo?: unknown;
  fecha_muestreo?: unknown;
  tramo?: unknown;
  latitud?: unknown;
  longitud?: unknown;
}): { valid: true; data: PuntoPayload } | { valid: false; errors: ValidationErrors } {
  const errors: ValidationErrors = {};

  const nombre = typeof input.nombre === 'string' ? input.nombre.trim() : '';
  if (nombre.length < 2 || nombre.length > 120) {
    errors.nombre = 'El nombre del punto debe tener entre 2 y 120 caracteres.';
  }

  const arroyo = typeof input.arroyo === 'string' ? input.arroyo.trim() : '';
  if (arroyo.length < 2 || arroyo.length > 120) {
    errors.arroyo = 'El nombre del arroyo debe tener entre 2 y 120 caracteres.';
  }

  const fecha = typeof input.fecha_muestreo === 'string' ? input.fecha_muestreo.trim() : '';
  if (!isValidIsoDate(fecha)) {
    errors.fecha_muestreo = 'Ingresá una fecha de muestreo válida (AAAA-MM-DD).';
  }

  if (!isValidTramo(input.tramo)) {
    errors.tramo = 'Seleccioná el tramo: aguas arriba o aguas abajo.';
  }

  const lat = parseDecimalCoordinate(input.latitud);
  const latError = validateLatitude(lat);
  if (latError) {
    errors.latitud = latError;
  }

  const lng = parseDecimalCoordinate(input.longitud);
  const lngError = validateLongitude(lng);
  if (lngError) {
    errors.longitud = lngError;
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      nombre,
      arroyo,
      fecha_muestreo: fecha,
      tramo: input.tramo as Tramo,
      latitud: Number(lat.toFixed(6)),
      longitud: Number(lng.toFixed(6)),
    },
  };
}
