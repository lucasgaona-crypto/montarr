-- Esquema de tabla en Supabase para puntos de muestreo hidrológico
create extension if not exists pgcrypto;

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

create index if not exists idx_puntos_muestreo_tramo
  on public.puntos_muestreo (tramo);

-- Tres ejemplos iniciales en ubicaciones distintas
insert into public.puntos_muestreo (nombre, latitud, longitud, arroyo, fecha_muestreo, tramo)
values
  ('Puente Viejo — Naciente', -34.991240, -57.882410, 'Arroyo El Pescado', '2026-10-12', 'aguas arriba'),
  ('Reserva Parque Pereyra', -34.838710, -58.136920, 'Arroyo Pereyra', '2026-10-18', 'aguas abajo'),
  ('Toma Dique Roggero', -34.674320, -58.867540, 'Arroyo La Choza', '2026-11-02', 'aguas arriba');
