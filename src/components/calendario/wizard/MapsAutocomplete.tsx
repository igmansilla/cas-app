import { Input } from "../../ui/input";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import { useEffect, useRef } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../ui/popover";
import { ScrollArea } from "../../ui/scroll-area";
import { Button } from "../../ui/button";

export interface UbicacionMaps {
  direccion: string;
  lat: number;
  lng: number;
  url: string;
}

interface MapsAutocompleteProps {
  value: string;
  onChange: (ubicacion: UbicacionMaps) => void;
  placeholder?: string;
}

export function MapsAutocomplete({
  value,
  onChange,
  placeholder = "Busca una ubicación...",
}: MapsAutocompleteProps) {
  const {
    ready,
    value: inputValue,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      /* Opciones como región si es necesario */
    },
    debounce: 300,
    defaultValue: value,
  });

  const contenedorRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Si el value prop cambia desde afuera (ej: edicion) setear
    if (value && value !== inputValue && !data.length) {
      setValue(value, false);
    }
  }, [value, inputValue, data.length, setValue]);

  const handleSelect = async (address: string, placeId: string) => {
    setValue(address, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      
      const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${placeId}`;
      
      onChange({
        direccion: address,
        lat,
        lng,
        url,
      });
    } catch (error) {
      console.error("Error al obtener datos de Google Maps: ", error);
      // Fallback
      onChange({
        direccion: address,
        lat: 0,
        lng: 0,
        url: "",
      });
    }
  };

  return (
    <div ref={contenedorRef} className="relative w-full">
      <Popover open={status === "OK"} onOpenChange={(o) => !o && clearSuggestions()}>
        <PopoverTrigger asChild>
          <div className="w-full">
            <Input
              value={inputValue}
              onChange={(e) => setValue(e.target.value)}
              disabled={!ready}
              placeholder={placeholder}
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
              {status === "OK" &&
                data.map(({ place_id, description }) => (
                  <Button
                    key={place_id}
                    variant="ghost"
                    className="w-full justify-start text-left font-normal rounded-none"
                    onClick={() => handleSelect(description, place_id)}
                  >
                    {description}
                  </Button>
                ))}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}
