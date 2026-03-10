const GOOGLE_MAPS_SCRIPT_SELECTOR = 'script[data-google-maps-places="true"]';
const GOOGLE_MAPS_SCRIPT_SRC_MATCH = 'script[src*="maps.googleapis.com/maps/api/js"]';
const GOOGLE_MAPS_SCRIPT_TIMEOUT_MS = 15000;
const GOOGLE_MAPS_REQUIRED_LIBRARIES = "marker";
const GOOGLE_MAPS_DEMO_MAP_ID = "DEMO_MAP_ID";

export const BULIN_OPERATIONS_CENTER = {
  nombre: "Bulín",
  lat: -34.79176321292345,
  lng: -58.40476476487758,
} as const;

type GoogleMapsWindow = Window & {
  __casGoogleMapsScriptPromise?: Promise<boolean> | null;
  google?: {
    maps?: {
      Map?: unknown;
      importLibrary?: (libraryName: "maps" | "marker") => Promise<unknown>;
      marker?: {
        AdvancedMarkerElement?: unknown;
      };
    };
  };
};

interface GoogleMapsSearchOptions {
  lat?: number;
  lng?: number;
  placeId?: string;
}

interface GooglePlacesAutocompleteRequestOptions {
  lat?: number;
  lng?: number;
}

interface GooglePlacesAutocompleteResponse {
  suggestions?: Array<{
    placePrediction?: {
      placeId?: string;
      text?: {
        text?: string;
      };
      structuredFormat?: {
        mainText?: {
          text?: string;
        };
        secondaryText?: {
          text?: string;
        };
      };
    };
  }>;
  error?: {
    message?: string;
    status?: string;
  };
}

interface GooglePlaceDetailsResponse {
  id?: string;
  formattedAddress?: string;
  displayName?: {
    text?: string;
  };
  location?: {
    latitude?: number;
    longitude?: number;
  };
  error?: {
    message?: string;
    status?: string;
  };
}

export interface GooglePlacesSuggestion {
  placeId: string;
  text: string;
  primaryText?: string;
  secondaryText?: string;
}

export interface GooglePlaceDetails {
  placeId: string;
  direccion: string;
  lat: number;
  lng: number;
}

let googleMapsScriptPromise: Promise<boolean> | null = null;
let googlePlacesApiDisabledMessage: string | null = null;

function getSharedGoogleMapsScriptPromise(): Promise<boolean> | null {
  if (typeof window === "undefined") {
    return null;
  }

  return (window as GoogleMapsWindow).__casGoogleMapsScriptPromise ?? null;
}

function setSharedGoogleMapsScriptPromise(promise: Promise<boolean> | null) {
  googleMapsScriptPromise = promise;

  if (typeof window !== "undefined") {
    (window as GoogleMapsWindow).__casGoogleMapsScriptPromise = promise;
  }
}

function findExistingGoogleMapsScript(): HTMLScriptElement | null {
  return document.querySelector<HTMLScriptElement>(`${GOOGLE_MAPS_SCRIPT_SELECTOR}, ${GOOGLE_MAPS_SCRIPT_SRC_MATCH}`);
}

function scriptHasRequiredLibraries(script?: HTMLScriptElement | null): boolean {
  if (!script?.src) {
    return false;
  }

  try {
    const scriptUrl = new URL(script.src);
    const libraries = (scriptUrl.searchParams.get("libraries") ?? "")
      .split(",")
      .map((library) => library.trim())
      .filter(Boolean);

    return libraries.includes(GOOGLE_MAPS_REQUIRED_LIBRARIES);
  } catch {
    return script.src.includes(`libraries=${GOOGLE_MAPS_REQUIRED_LIBRARIES}`);
  }
}

async function ensureGoogleMapsRequiredLibraries() {
  if (typeof window === "undefined") {
    return;
  }

  const maps = (window as GoogleMapsWindow).google?.maps;

  if (!maps?.importLibrary) {
    return;
  }

  await Promise.all([
    maps.Map ? Promise.resolve() : maps.importLibrary("maps"),
    maps.marker?.AdvancedMarkerElement ? Promise.resolve() : maps.importLibrary("marker"),
  ]);
}

export function getGoogleMapsApiKey(): string {
  return (import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "").trim();
}

export function getGoogleMapsMapId(): string {
  return (import.meta.env.VITE_GOOGLE_MAPS_MAP_ID ?? GOOGLE_MAPS_DEMO_MAP_ID).trim() || GOOGLE_MAPS_DEMO_MAP_ID;
}

export function getKnownGooglePlacesApiDisabledMessage(): string | null {
  return googlePlacesApiDisabledMessage;
}

function isGooglePlacesApiDisabledErrorMessage(message: string): boolean {
  return message.includes("has not been used in project") || message.includes("SERVICE_DISABLED");
}

function rememberGooglePlacesApiDisabledMessage(message: string) {
  if (isGooglePlacesApiDisabledErrorMessage(message)) {
    googlePlacesApiDisabledMessage = message;
  }
}

export function isGoogleMapsPlacesReady(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const maps = (window as GoogleMapsWindow).google?.maps;

  return Boolean(maps?.Map && maps?.marker?.AdvancedMarkerElement);
}

export function buildGoogleMapsSearchUrl(query: string, options: GoogleMapsSearchOptions = {}): string {
  const normalizedQuery = query.trim();
  const hasCoordinates = typeof options.lat === "number" && typeof options.lng === "number";

  if (!normalizedQuery && !hasCoordinates) {
    return "";
  }

  const params = new URLSearchParams({ api: "1" });

  if (hasCoordinates) {
    params.set("query", `${options.lat},${options.lng}`);
  } else {
    params.set("query", normalizedQuery);
  }

  if (options.placeId) {
    params.set("query_place_id", options.placeId);
  }

  return `https://www.google.com/maps/search/?${params.toString()}`;
}

export function getDefaultMeetingLocation() {
  return {
    direccion: BULIN_OPERATIONS_CENTER.nombre,
    lat: BULIN_OPERATIONS_CENTER.lat,
    lng: BULIN_OPERATIONS_CENTER.lng,
    url: buildGoogleMapsSearchUrl(BULIN_OPERATIONS_CENTER.nombre, {
      lat: BULIN_OPERATIONS_CENTER.lat,
      lng: BULIN_OPERATIONS_CENTER.lng,
    }),
  };
}

export async function fetchGooglePlacesSuggestions(
  query: string,
  options: GooglePlacesAutocompleteRequestOptions = {},
): Promise<GooglePlacesSuggestion[]> {
  const apiKey = getGoogleMapsApiKey();
  const normalizedQuery = query.trim();

  if (!apiKey || !normalizedQuery) {
    return [];
  }

  if (googlePlacesApiDisabledMessage) {
    throw new Error(googlePlacesApiDisabledMessage);
  }

  const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text,suggestions.placePrediction.structuredFormat.mainText.text,suggestions.placePrediction.structuredFormat.secondaryText.text",
    },
    body: JSON.stringify({
      input: normalizedQuery,
      languageCode: "es-AR",
      regionCode: "ar",
      includedRegionCodes: ["ar"],
      ...(typeof options.lat === "number" && typeof options.lng === "number"
        ? {
            locationBias: {
              circle: {
                center: {
                  latitude: options.lat,
                  longitude: options.lng,
                },
                radius: 15000,
              },
            },
          }
        : {}),
    }),
  });

  const payload = await response.json() as GooglePlacesAutocompleteResponse;

  if (!response.ok) {
    const errorMessage = payload.error?.message || "No se pudieron obtener sugerencias de Google Places.";
    rememberGooglePlacesApiDisabledMessage(errorMessage);
    throw new Error(errorMessage);
  }

  return (payload.suggestions ?? [])
    .map((item) => item.placePrediction)
    .filter((prediction): prediction is NonNullable<typeof prediction> => Boolean(prediction?.placeId && prediction.text?.text))
    .map((prediction) => ({
      placeId: prediction.placeId as string,
      text: prediction.text?.text as string,
      primaryText: prediction.structuredFormat?.mainText?.text,
      secondaryText: prediction.structuredFormat?.secondaryText?.text,
    }));
}

export async function fetchGooglePlaceDetails(placeId: string): Promise<GooglePlaceDetails | null> {
  const apiKey = getGoogleMapsApiKey();
  const normalizedPlaceId = placeId.trim();

  if (!apiKey || !normalizedPlaceId) {
    return null;
  }

  if (googlePlacesApiDisabledMessage) {
    throw new Error(googlePlacesApiDisabledMessage);
  }

  const queryParams = new URLSearchParams({
    languageCode: "es-AR",
    regionCode: "AR",
  });

  const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(normalizedPlaceId)}?${queryParams.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "id,formattedAddress,displayName,location",
    },
  });

  const payload = await response.json() as GooglePlaceDetailsResponse;

  if (!response.ok) {
    const errorMessage = payload.error?.message || "No se pudieron obtener los detalles del lugar.";
    rememberGooglePlacesApiDisabledMessage(errorMessage);
    throw new Error(errorMessage);
  }

  const lat = payload.location?.latitude;
  const lng = payload.location?.longitude;

  if (typeof lat !== "number" || typeof lng !== "number") {
    return null;
  }

  return {
    placeId: payload.id || normalizedPlaceId,
    direccion: payload.formattedAddress || payload.displayName?.text || normalizedPlaceId,
    lat,
    lng,
  };
}

export function loadGoogleMapsPlacesApi(): Promise<boolean> {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }

  if (isGoogleMapsPlacesReady()) {
    return Promise.resolve(true);
  }

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    return Promise.resolve(false);
  }

  const sharedPromise = getSharedGoogleMapsScriptPromise();
  if (sharedPromise) {
    googleMapsScriptPromise = sharedPromise;
    return sharedPromise;
  }

  if (googleMapsScriptPromise) {
    return googleMapsScriptPromise;
  }

  const promise = new Promise<boolean>((resolve, reject) => {
    const existingScript = findExistingGoogleMapsScript();
    const script = existingScript ?? document.createElement("script");
    const startedAt = Date.now();
    let timeoutId = 0;
    let settled = false;
    let ensureLibrariesPromise: Promise<void> | null = null;

    const ensureLibraries = () => {
      if (!ensureLibrariesPromise) {
        ensureLibrariesPromise = ensureGoogleMapsRequiredLibraries().catch((error) => {
          ensureLibrariesPromise = null;
          throw error;
        });
      }

      return ensureLibrariesPromise;
    };

    const cleanup = () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      script.removeEventListener("load", onLoad);
      script.removeEventListener("error", onError);
    };

    const finish = (loaded: boolean, error?: Error) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();

      if (loaded) {
        resolve(true);
        return;
      }

      setSharedGoogleMapsScriptPromise(null);
      reject(error ?? new Error("No se pudo cargar Google Maps Places API."));
    };

    const checkReady = () => {
      if (isGoogleMapsPlacesReady()) {
        finish(true);
        return;
      }

      const maps = (window as GoogleMapsWindow).google?.maps;

      if (maps?.importLibrary) {
        void ensureLibraries().catch(() => {
          // Si la importacion diferida falla, dejamos que el timeout reporte el problema.
        });
      }

      if (Date.now() - startedAt >= GOOGLE_MAPS_SCRIPT_TIMEOUT_MS) {
        finish(false, new Error("Google Maps Places API tardó demasiado en responder."));
        return;
      }

      timeoutId = window.setTimeout(checkReady, 100);
    };

    function onLoad() {
      void ensureLibraries()
        .catch(() => {
          // Reintentamos con polling hasta que Maps termine de exponer las librerias requeridas.
        })
        .finally(() => {
          checkReady();
        });
    }

    function onError() {
      finish(false, new Error("No se pudo cargar Google Maps Places API."));
    }

    script.addEventListener("load", onLoad);
    script.addEventListener("error", onError);

    script.dataset.googleMapsPlaces = "true";

    if (!existingScript) {
      script.async = true;
      script.defer = true;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&language=es&region=AR&loading=async&v=weekly&libraries=${GOOGLE_MAPS_REQUIRED_LIBRARIES}`;
      document.head.appendChild(script);
    } else if (scriptHasRequiredLibraries(existingScript)) {
      void ensureLibraries().catch(() => {
        // El script ya existe; si la libreria marker todavia no esta lista, seguimos esperando.
      });
    }

    checkReady();
  });

  setSharedGoogleMapsScriptPromise(promise);

  return promise;
}