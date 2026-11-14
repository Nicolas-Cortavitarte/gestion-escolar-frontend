import type {
  MovimientoFinanciero,
  MovimientoFinancieroRequest,
} from "./movimientos-financieros.types";
import { API_URL, asegurarRespuestaOk, fetchApi } from "../../shared/api/api";

const MENSAJE_ERROR_MOVIMIENTOS = "No se pudo completar la operación.";

export async function obtenerMovimientos(
  token: string,
  desde: string,
  hasta: string,
): Promise<MovimientoFinanciero[]> {
  if (!desde || !hasta || desde > hasta) {
    throw new Error("Selecciona un rango de fechas válido.");
  }

  const parametros = new URLSearchParams({ desde, hasta });

  const respuesta = await fetchApi(
    `${API_URL}/api/v1/movimientos-financieros?${parametros}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  await asegurarRespuestaOk(respuesta, MENSAJE_ERROR_MOVIMIENTOS);

  return (await respuesta.json()) as MovimientoFinanciero[];
}

export async function crearMovimiento(
  token: string,
  datos: MovimientoFinancieroRequest,
): Promise<MovimientoFinanciero> {
  const respuesta = await fetchApi(`${API_URL}/api/v1/movimientos-financieros`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(datos),
  });

  await asegurarRespuestaOk(respuesta, MENSAJE_ERROR_MOVIMIENTOS);

  return (await respuesta.json()) as MovimientoFinanciero;
}

export async function eliminarMovimiento(
  token: string,
  id: string,
): Promise<void> {
  const respuesta = await fetchApi(
    `${API_URL}/api/v1/movimientos-financieros/${id}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  await asegurarRespuestaOk(respuesta, MENSAJE_ERROR_MOVIMIENTOS);
}
