import { array, boolean, number, object, optional, parse, string } from "valibot";
import { client } from "../client";

const DepartamentoSchema = object({
  id: number(),
  codigo: string(),
  nombre: string(),
  descripcion: optional(string()),
  activo: boolean(),
});

const DepartamentosSchema = array(DepartamentoSchema);

export type Departamento = {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
};

export const departamentosService = {
  listar: async (): Promise<Departamento[]> => {
    const res = await client.get("/departamentos");
    return parse(DepartamentosSchema, res.data ?? []);
  },
};
