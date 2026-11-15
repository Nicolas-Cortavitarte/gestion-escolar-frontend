import type { DashboardResumen } from "./dashboard.types";
import { API_URL, asegurarRespuestaOk, fetchApi } from "../../shared/api/api";

export async function obtenerResumenDashboard(
  token: string,
): Promise<DashboardResumen> {
  const respuesta = await fetchApi(`${API_URL}/api/v1/dashboard/resumen`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  await asegurarRespuestaOk(
    respuesta,
    "No se pudo cargar el resumen del panel.",
  );

  return (await respuesta.json()) as DashboardResumen;
}
