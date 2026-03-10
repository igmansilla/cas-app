import { useQuery } from "@tanstack/react-query";
import { departamentosService } from "../api/services/departamentos";

export function useDepartamentos(enabled = true) {
  const query = useQuery({
    queryKey: ["departamentos"],
    queryFn: departamentosService.listar,
    enabled,
  });

  return {
    departamentos: query.data ?? [],
    cargando: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
