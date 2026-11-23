import {
  APILoadingStatus,
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { Crosshair, MapPin } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { PuntoMuestreo } from '../types/punto.ts';

interface SamplingMapProps {
  puntos: PuntoMuestreo[];
  selectedPunto: PuntoMuestreo | null;
  onSelectPunto: (punto: PuntoMuestreo) => void;
  focusTrigger: number;
}

interface SamplingMarkerProps {
  punto: PuntoMuestreo;
  isSelected: boolean;
  infoWindowOpen: boolean;
  onSelect: () => void;
  onCloseInfoWindow: () => void;
}

function SamplingMarker({
  punto,
  isSelected,
  infoWindowOpen,
  onSelect,
  onCloseInfoWindow,
}: SamplingMarkerProps) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const isAguasArriba = punto.tramo === 'aguas arriba';

  const background = isSelected
    ? '#0f172a'
    : isAguasArriba
      ? '#0f766e'
      : '#0284c7';
  const borderColor = isSelected
    ? '#0f172a'
    : isAguasArriba
      ? '#115e59'
      : '#0369a1';

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: punto.latitud, lng: punto.longitud }}
        title={punto.nombre}
        zIndex={isSelected ? 20 : 1}
        onClick={onSelect}
      >
        <Pin
          background={background}
          borderColor={borderColor}
          glyphColor="#ffffff"
          scale={isSelected ? 1.25 : 1}
        />
      </AdvancedMarker>

      {isSelected && infoWindowOpen && marker && (
        <InfoWindow
          anchor={marker}
          maxWidth={280}
          onCloseClick={onCloseInfoWindow}
        >
          <div className="p-1 text-slate-900">
            <p className="text-sm font-semibold leading-snug text-slate-900">
              {punto.nombre}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {punto.arroyo} · {punto.tramo === 'aguas arriba' ? 'Aguas arriba' : 'Aguas abajo'}
            </p>
            <p className="mt-1.5 font-mono text-xs tabular-nums text-slate-700">
              {punto.latitud.toFixed(6)}, {punto.longitud.toFixed(6)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Muestreo: <span className="font-mono tabular-nums">{punto.fecha_muestreo}</span>
            </p>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

function CameraController({
  puntos,
  selectedPunto,
  focusTrigger,
}: {
  puntos: PuntoMuestreo[];
  selectedPunto: PuntoMuestreo | null;
  focusTrigger: number;
}) {
  const map = useMap();
  const coreLib = useMapsLibrary('core');

  useEffect(() => {
    if (!map) return;

    if (selectedPunto) {
      map.panTo({ lat: selectedPunto.latitud, lng: selectedPunto.longitud });
      const currentZoom = map.getZoom() ?? 9;
      if (currentZoom < 12) {
        map.setZoom(13);
      }
      return;
    }

    if (puntos.length > 0 && coreLib) {
      const bounds = new coreLib.LatLngBounds();
      for (const punto of puntos) {
        bounds.extend({ lat: punto.latitud, lng: punto.longitud });
      }
      map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 });
    }
  }, [map, coreLib, selectedPunto, focusTrigger, puntos]);

  return null;
}

function MapStatusOverlay() {
  const status = useApiLoadingStatus();

  if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) {
    return (
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-100 p-8 text-center">
        <MapPin className="h-8 w-8 text-amber-600" />
        <p className="mt-3 text-sm font-semibold text-slate-800">
          No se pudo cargar Google Maps
        </p>
        <p className="mt-1 max-w-md text-xs text-slate-500">
          Verificá la clave de API o la conexión de red e intentá recargar la página.
        </p>
      </div>
    );
  }

  return null;
}

export function SamplingMap({
  puntos,
  selectedPunto,
  onSelectPunto,
  focusTrigger,
}: SamplingMapProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ?? '';
  const [infoOpenForId, setInfoOpenForId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedPunto) {
      setInfoOpenForId(selectedPunto.id);
    } else {
      setInfoOpenForId(null);
    }
  }, [selectedPunto?.id, focusTrigger]);

  const handleCloseInfo = useCallback(() => {
    setInfoOpenForId(null);
  }, []);

  if (!apiKey) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-slate-100 p-8 text-center">
        <MapPin className="h-8 w-8 text-slate-400" />
        <p className="mt-3 text-sm font-semibold text-slate-800">
          Clave de Google Maps no configurada
        </p>
        <p className="mt-1 max-w-md text-xs text-slate-500">
          Configurá <span className="font-mono">VITE_GOOGLE_MAPS_API_KEY</span> para visualizar el mapa interactivo y los marcadores.
        </p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey} libraries={['marker']} language="es" region="AR">
      <div className="relative h-full w-full">
        <MapStatusOverlay />
        <GoogleMap
          mapId="DEMO_MAP_ID"
          defaultCenter={{ lat: -34.834, lng: -58.295 }}
          defaultZoom={9}
          gestureHandling="greedy"
          streetViewControl={false}
          mapTypeControl={true}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          className="h-full w-full"
        >
          <CameraController
            puntos={puntos}
            selectedPunto={selectedPunto}
            focusTrigger={focusTrigger}
          />
          {puntos.map((punto) => (
            <SamplingMarker
              key={punto.id}
              punto={punto}
              isSelected={selectedPunto?.id === punto.id}
              infoWindowOpen={infoOpenForId === punto.id}
              onSelect={() => {
                onSelectPunto(punto);
                setInfoOpenForId(punto.id);
              }}
              onCloseInfoWindow={handleCloseInfo}
            />
          ))}
        </GoogleMap>

        {selectedPunto && (
          <div className="pointer-events-auto absolute bottom-4 left-4 right-4 z-10 max-w-md rounded-lg border border-slate-200 bg-white/95 p-3.5 shadow-sm backdrop-blur-sm sm:right-auto">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {selectedPunto.nombre}
                </p>
                <p className="mt-0.5 text-xs text-slate-600">
                  {selectedPunto.arroyo} ·{' '}
                  <span className="font-medium text-slate-800">
                    {selectedPunto.tramo === 'aguas arriba' ? 'Aguas arriba' : 'Aguas abajo'}
                  </span>{' '}
                  · <span className="font-mono tabular-nums">{selectedPunto.fecha_muestreo}</span>
                </p>
                <p className="mt-1.5 flex items-center gap-1.5 font-mono text-xs tabular-nums text-slate-700">
                  <Crosshair className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                  <span>
                    Lat {selectedPunto.latitud.toFixed(6)} · Lng {selectedPunto.longitud.toFixed(6)}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInfoOpenForId(selectedPunto.id)}
                className="shrink-0 whitespace-nowrap rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
              >
                Ver marcador
              </button>
            </div>
          </div>
        )}
      </div>
    </APIProvider>
  );
}
