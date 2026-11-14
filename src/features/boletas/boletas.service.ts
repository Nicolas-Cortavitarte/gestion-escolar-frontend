import type { Boleta } from "./boletas.types";
import { API_URL, asegurarRespuestaOk, fetchApi } from "../../shared/api/api";

export async function obtenerBoleta(
  token: string,
  estudianteId: string,
  anioLectivo: number,
): Promise<Boleta> {
  const parametros = new URLSearchParams({
    anioLectivo: String(anioLectivo),
  });

  const respuesta = await fetchApi(
    `${API_URL}/api/v1/boletas/estudiante/${encodeURIComponent(estudianteId)}?${parametros}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  await asegurarRespuestaOk(respuesta, "No se pudo consultar la boleta.");

  return (await respuesta.json()) as Boleta;
}
