export type Tramo = 'aguas arriba' | 'aguas abajo';

export interface PuntoMuestreo {
  id: string;
  nombre: string;
  latitud: number;
  longitud: number;
  arroyo: string;
  fecha_muestreo: string;
  tramo: Tramo;
  created_at?: string;
}

export interface PuntoPayload {
  nombre: string;
  latitud: number;
  longitud: number;
  arroyo: string;
  fecha_muestreo: string;
  tramo: Tramo;
}
