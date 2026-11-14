import type { Pension } from "./pensiones.types";
import { API_URL, asegurarRespuestaOk, fetchApi } from "../../shared/api/api";

const MENSAJE_ERROR_PENSIONES = "No se pudo completar la operación de pensiones.";

export async function obtenerPensiones(token: string): Promise<Pension[]> {
  const respuesta = await fetchApi(`${API_URL}/api/v1/pensiones`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  await asegurarRespuestaOk(respuesta, MENSAJE_ERROR_PENSIONES);

  return (await respuesta.json()) as Pension[];
}

export async function pagarPension(
  token: string,
  id: string,
): Promise<Pension> {
  const respuesta = await fetchApi(`${API_URL}/api/v1/pensiones/${id}/pagar`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  await asegurarRespuestaOk(respuesta, MENSAJE_ERROR_PENSIONES);

  return (await respuesta.json()) as Pension;
}
