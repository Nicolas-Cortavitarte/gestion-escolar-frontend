import type { ReporteFinanciero } from "./reportes-financieros.types";
import { API_URL, asegurarRespuestaOk, fetchApi } from "../../shared/api/api";

export async function obtenerReporteFinanciero(
  token: string,
  desde: string,
  hasta: string,
): Promise<ReporteFinanciero> {
  if (!desde || !hasta || desde > hasta) {
    throw new Error("Selecciona un rango de fechas válido.");
  }

  const parametros = new URLSearchParams({ desde, hasta });

  const respuesta = await fetchApi(
    `${API_URL}/api/v1/reportes-financieros?${parametros}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  await asegurarRespuestaOk(
    respuesta,
    "No se pudo cargar el reporte financiero.",
  );

  return (await respuesta.json()) as ReporteFinanciero;
}
