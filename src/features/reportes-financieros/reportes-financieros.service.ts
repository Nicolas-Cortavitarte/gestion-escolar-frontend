import type { ReporteFinanciero } from "./reportes-financieros.types";

const API_URL = import.meta.env.VITE_API_URL;

export async function obtenerReporteFinanciero(
  token: string,
  desde: string,
  hasta: string,
): Promise<ReporteFinanciero> {
  if (!desde || !hasta || desde > hasta) {
    throw new Error("Selecciona un rango de fechas válido.");
  }

  const parametros = new URLSearchParams({ desde, hasta });

  const respuesta = await fetch(
    `${API_URL}/api/v1/reportes-financieros?${parametros}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (respuesta.status === 401) {
    throw new Error("Tu sesión ya no es válida. Inicia sesión nuevamente.");
  }

  if (respuesta.status === 403) {
    throw new Error("No tienes permiso para consultar el reporte financiero.");
  }

  if (!respuesta.ok) {
    throw new Error("No se pudo cargar el reporte financiero.");
  }

  return (await respuesta.json()) as ReporteFinanciero;
}
