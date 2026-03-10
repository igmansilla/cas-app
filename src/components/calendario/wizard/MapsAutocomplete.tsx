import { Input } from "../../ui/input";
import { useEffect, useRef, useState } from "react";
import { Label } from "../../ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../ui/popover";
import { ScrollArea } from "../../ui/scroll-area";
import { Button } from "../../ui/button";
import {
  BULIN_OPERATIONS_CENTER,
  buildGoogleMapsSearchUrl,
  fetchGooglePlaceDetails,
  fetchGooglePlacesSuggestions,
  getGoogleMapsApiKey,
  getGoogleMapsMapId,
  getKnownGooglePlacesApiDisabledMessage,
  type GooglePlaceDetails,
  type GooglePlacesSuggestion,
  isGoogleMapsPlacesReady,
  loadGoogleMapsPlacesApi,
} from "../../../lib/google-maps";

export interface UbicacionMaps {
  direccion: string;
  lat?: number;
  lng?: number;
  url: string;
  source: "manual" | "selection" | "clear";
}

interface MapsAutocompleteProps {
  value: string;
  lat?: number;
  lng?: number;
  onChange: (ubicacion: UbicacionMaps) => void;
  placeholder?: string;
}

type MapMouseEvent = {
  latLng?: {
    lat: () => number;
    lng: () => number;
  };
};

type LatLngLike =
  | {
      lat: number;
      lng: number;
    }
  | {
      lat: () => number;
      lng: () => number;
    };

type GoogleMapsWindow = Window & {
  google?: {
    maps?: {
      Map: new (container: HTMLElement, options: Record<string, unknown>) => {
        addListener: (eventName: string, handler: (event: MapMouseEvent) => void) => { remove: () => void };
        panTo: (position: { lat: number; lng: number }) => void;
        setZoom: (zoom: number) => void;
        getZoom: () => number | undefined;
      };
      marker?: {
        AdvancedMarkerElement: new (options: Record<string, unknown>) => {
          addListener: (eventName: string, handler: (event?: unknown) => void) => { remove: () => void };
          map: unknown;
          position?: LatLngLike | null;
        };
      };
    };
  };
};

type GoogleMapsNamespace = NonNullable<NonNullable<GoogleMapsWindow["google"]>["maps"]>;
type GoogleMapsMarkerNamespace = NonNullable<GoogleMapsNamespace["marker"]>;

const PLACES_API_DISABLED_MESSAGE =
  "La API Places API (New) del proyecto de Google todavia esta deshabilitada. Activala en Google Cloud y recarga la pagina.";

const PLACE_DETAILS_UNAVAILABLE_MESSAGE =
  "No se pudieron obtener las coordenadas del lugar. Podés marcar el punto en el mapa o escribir el nombre visible manualmente.";

const DEFAULT_CENTER = {
  lat: BULIN_OPERATIONS_CENTER.lat,
  lng: BULIN_OPERATIONS_CENTER.lng,
};

function getGoogleMapsNamespace(): GoogleMapsNamespace | null {
  if (typeof window === "undefined") {
    return null;
  }

  return (window as GoogleMapsWindow).google?.maps ?? null;
}

function isLatLngFunctionValue(position: LatLngLike): position is { lat: () => number; lng: () => number } {
  return typeof position.lat === "function" && typeof position.lng === "function";
}

function getLatLngFromValue(position?: LatLngLike | null): { lat: number; lng: number } | null {
  if (!position) {
    return null;
  }

  if (isLatLngFunctionValue(position)) {
    return {
      lat: position.lat(),
      lng: position.lng(),
    };
  }

  return {
    lat: position.lat,
    lng: position.lng,
  };
}

function isGooglePlacesApiDisabledError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.message.includes("has not been used in project") || error.message.includes("SERVICE_DISABLED");
}

function isCoordinateLabel(label: string) {
  return /^-?\d+(?:\.\d+)?,\s*-?\d+(?:\.\d+)?$/.test(label.trim());
}

function getVisibleLabelForPointSelection(label: string) {
  if (!label.trim() || isCoordinateLabel(label)) {
    return "";
  }

  return label;
}

function mapPlaceDetailsToUbicacion(place: GooglePlaceDetails): UbicacionMaps {
  return {
    direccion: place.direccion,
    lat: place.lat,
    lng: place.lng,
    url: buildGoogleMapsSearchUrl(place.direccion, {
      lat: place.lat,
      lng: place.lng,
      placeId: place.placeId,
    }),
    source: "selection",
  };
}

export function MapsAutocomplete({
  value,
  lat,
  lng,
  onChange,
  placeholder = "Ej: Casa de Juan, plaza, portón lateral...",
}: MapsAutocompleteProps) {
  const googleMapsApiKey = getGoogleMapsApiKey();
  const googleMapsMapId = getGoogleMapsMapId();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<InstanceType<GoogleMapsNamespace["Map"]> | null>(null);
  const markerRef = useRef<InstanceType<GoogleMapsMarkerNamespace["AdvancedMarkerElement"]> | null>(null);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GooglePlacesSuggestion[]>([]);
  const [cargandoSugerencias, setCargandoSugerencias] = useState(false);
  const [errorSugerencias, setErrorSugerencias] = useState<string | null>(null);
  const [placesApiDeshabilitada, setPlacesApiDeshabilitada] = useState(() => Boolean(getKnownGooglePlacesApiDisabledMessage()));
  const [estadoGoogleMaps, setEstadoGoogleMaps] = useState<"manual" | "loading" | "ready" | "error">(() => {
    if (!googleMapsApiKey) {
      return "manual";
    }

    return isGoogleMapsPlacesReady() ? "ready" : "loading";
  });

  const tieneCoordenadas = typeof lat === "number" && typeof lng === "number";

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (!googleMapsApiKey) {
      setEstadoGoogleMaps("manual");
      return;
    }

    let cancelled = false;

    if (isGoogleMapsPlacesReady()) {
      setEstadoGoogleMaps("ready");
      return () => {
        cancelled = true;
      };
    }

    setEstadoGoogleMaps("loading");
    loadGoogleMapsPlacesApi()
      .then((loaded) => {
        if (cancelled) {
          return;
        }

        if (loaded) {
          setEstadoGoogleMaps("ready");
          return;
        }

        setEstadoGoogleMaps("manual");
      })
      .catch(() => {
        if (!cancelled) {
          setEstadoGoogleMaps("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [googleMapsApiKey]);

  useEffect(() => {
    const normalizedQuery = searchQuery.trim();

    if (estadoGoogleMaps !== "ready" || !normalizedQuery) {
      setSuggestions([]);
      setCargandoSugerencias(false);
      setErrorSugerencias(null);
      return;
    }

    if (placesApiDeshabilitada) {
      setSuggestions([]);
      setCargandoSugerencias(false);
      setErrorSugerencias(PLACES_API_DISABLED_MESSAGE);
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      setCargandoSugerencias(true);
      setErrorSugerencias(null);

      try {
        const nextSuggestions = await fetchGooglePlacesSuggestions(normalizedQuery, {
          lat,
          lng,
        });

        if (!cancelled) {
          setSuggestions(nextSuggestions);
        }
      } catch (error) {
        if (!cancelled) {
          const errorMessage = error instanceof Error ? error.message : "";
          const apiDeshabilitada =
            errorMessage.includes("has not been used in project") || errorMessage.includes("SERVICE_DISABLED");

          setSuggestions([]);

          if (apiDeshabilitada) {
            setPlacesApiDeshabilitada(true);
            setErrorSugerencias(PLACES_API_DISABLED_MESSAGE);
          } else {
            console.error("Error al obtener sugerencias de Google Places (New): ", error);
            setErrorSugerencias("No se pudieron cargar sugerencias. Revisa la configuracion de Google Maps.");
          }
        }
      } finally {
        if (!cancelled) {
          setCargandoSugerencias(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [estadoGoogleMaps, searchQuery, lat, lng, placesApiDeshabilitada]);

  useEffect(() => {
    if (estadoGoogleMaps !== "ready" || !mapContainerRef.current || mapRef.current) {
      return;
    }

    const googleMaps = getGoogleMapsNamespace();
    const markerLibrary = googleMaps?.marker;

    if (!googleMaps || !markerLibrary) {
      return;
    }

    const initialHasCoordinates = typeof lat === "number" && typeof lng === "number";
    const initialCenter = initialHasCoordinates ? { lat, lng } : DEFAULT_CENTER;
    const map = new googleMaps.Map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialHasCoordinates ? 16 : 13,
      mapId: googleMapsMapId,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      clickableIcons: false,
      gestureHandling: "greedy",
    });

    const marker = new markerLibrary.AdvancedMarkerElement({
      map: initialHasCoordinates ? map : null,
      position: initialCenter,
      gmpDraggable: true,
      title: "Punto de reunión",
    });

    mapRef.current = map;
    markerRef.current = marker;

    const emitirSeleccion = (nextLat: number, nextLng: number) => {
      const direccion = getVisibleLabelForPointSelection(valueRef.current);

      marker.map = map;
      marker.position = { lat: nextLat, lng: nextLng };
      map.panTo({ lat: nextLat, lng: nextLng });
      if ((map.getZoom() ?? 0) < 16) {
        map.setZoom(16);
      }
      setSearchQuery("");
      setSuggestions([]);
      setErrorSugerencias(null);
      onChangeRef.current({
        direccion,
        lat: nextLat,
        lng: nextLng,
        url: buildGoogleMapsSearchUrl(direccion, { lat: nextLat, lng: nextLng }),
        source: "selection",
      });
    };

    const mapClickListener = map.addListener("click", (event: MapMouseEvent) => {
      const clickedLat = event.latLng?.lat();
      const clickedLng = event.latLng?.lng();

      if (typeof clickedLat !== "number" || typeof clickedLng !== "number") {
        return;
      }

      emitirSeleccion(clickedLat, clickedLng);
    });

    const dragEndListener = marker.addListener("dragend", () => {
      const draggedPosition = getLatLngFromValue(marker.position);
      const draggedLat = draggedPosition?.lat;
      const draggedLng = draggedPosition?.lng;

      if (typeof draggedLat !== "number" || typeof draggedLng !== "number") {
        return;
      }

      emitirSeleccion(draggedLat, draggedLng);
    });

    return () => {
      mapClickListener.remove();
      dragEndListener.remove();
      marker.map = null;
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [estadoGoogleMaps, googleMapsMapId]);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;

    if (!map || !marker) {
      return;
    }

    if (tieneCoordenadas) {
      const position = { lat: lat as number, lng: lng as number };
      marker.map = map;
      marker.position = position;
      map.panTo(position);
      if ((map.getZoom() ?? 0) < 16) {
        map.setZoom(16);
      }
      return;
    }

    marker.map = null;
    map.panTo(DEFAULT_CENTER);
    map.setZoom(13);
  }, [tieneCoordenadas, lat, lng]);

  const handleInputChange = (nextValue: string) => {
    setSearchQuery(nextValue);

    if (!nextValue.trim()) {
      setSuggestions([]);
      setErrorSugerencias(null);
    }
  };

  const handleSelect = async (suggestion: GooglePlacesSuggestion) => {
    setSearchQuery(suggestion.text);
    setSuggestions([]);
    setErrorSugerencias(null);

    try {
      const placeDetails = await fetchGooglePlaceDetails(suggestion.placeId);

      if (placeDetails) {
        onChange(mapPlaceDetailsToUbicacion(placeDetails));
        return;
      }
    } catch (error) {
      if (isGooglePlacesApiDisabledError(error)) {
        setPlacesApiDeshabilitada(true);
        setErrorSugerencias(PLACES_API_DISABLED_MESSAGE);
      } else {
        setErrorSugerencias(PLACE_DETAILS_UNAVAILABLE_MESSAGE);
      }
    }

    onChange({
      direccion: suggestion.text,
      url: buildGoogleMapsSearchUrl(suggestion.text, { placeId: suggestion.placeId }),
      source: "selection",
    });
  };

  const ayudaGoogleMaps =
    estadoGoogleMaps === "manual"
      ? "Sin VITE_GOOGLE_MAPS_API_KEY no hay mapa ni sugerencias; el lugar se guarda como texto."
      : estadoGoogleMaps === "loading"
        ? "Cargando mapa..."
        : estadoGoogleMaps === "error"
          ? "No se pudo cargar Google Maps. Podés escribir el lugar manualmente."
          : null;

  const handleClearPoint = () => {
    setSearchQuery("");
    setSuggestions([]);
    setErrorSugerencias(null);
    onChange({
      direccion: "",
      url: "",
      source: "clear",
    });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">Buscar punto</Label>
        <Popover open={suggestions.length > 0} onOpenChange={(open) => !open && setSuggestions([])}>
          <PopoverTrigger asChild>
            <div className="w-full">
              <Input
                value={searchQuery}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                  }
                }}
                placeholder="Dirección o referencia"
                className="w-full"
              />
            </div>
          </PopoverTrigger>
          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] p-0"
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <ScrollArea className="h-60">
              <div className="flex flex-col">
                {suggestions.map((suggestion) => (
                    <Button
                      key={suggestion.placeId}
                      type="button"
                      variant="ghost"
                      className="w-full justify-start rounded-none px-3 py-2 text-left font-normal"
                      onClick={() => handleSelect(suggestion)}
                    >
                      <span className="block leading-tight">
                        <span className="block text-sm text-foreground">{suggestion.primaryText || suggestion.text}</span>
                        {suggestion.secondaryText && (
                          <span className="block text-xs text-muted-foreground">{suggestion.secondaryText}</span>
                        )}
                      </span>
                    </Button>
                  ))}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
        {cargandoSugerencias && (
          <p className="text-xs text-muted-foreground">Buscando sugerencias...</p>
        )}
        {errorSugerencias && (
          <p className="text-xs text-amber-700">{errorSugerencias}</p>
        )}
        {ayudaGoogleMaps && (
          <p className="text-xs text-muted-foreground">{ayudaGoogleMaps}</p>
        )}
      </div>

      {estadoGoogleMaps === "ready" ? (
        <div className="overflow-hidden rounded-xl border bg-white">
          <div ref={mapContainerRef} className="h-64 w-full" />
          <div className="flex items-center justify-between gap-3 border-t px-3 py-2 text-xs text-muted-foreground">
            <span>Click para marcar. Arrastrá el pin para ajustar.</span>
            <Button type="button" variant="ghost" className="h-auto px-2 py-1 text-xs" onClick={handleClearPoint}>
              Quitar punto
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
          {estadoGoogleMaps === "loading"
            ? "Cargando Google Maps..."
            : "Cuando configures la API key de Google Maps, acá vas a poder marcar el punto exacto sobre el mapa."}
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">Nombre visible</Label>
        <Input
          value={value}
          onChange={(e) => onChange({
            direccion: e.target.value,
            lat,
            lng,
            url: buildGoogleMapsSearchUrl(e.target.value, { lat, lng }),
            source: "manual",
          })}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
            }
          }}
          placeholder={placeholder}
          className="w-full"
        />
      </div>

      {tieneCoordenadas && (
        <p className="text-xs text-muted-foreground">
          Coordenada elegida: {lat?.toFixed(6)}, {lng?.toFixed(6)}
        </p>
      )}
    </div>
  );
}
