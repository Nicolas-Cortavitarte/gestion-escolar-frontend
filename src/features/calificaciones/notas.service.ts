import type {
  Bimestre,
  NotaCompetencia,
  NotaCompetenciaRequest,
} from "./notas.types";
import { API_URL, asegurarRespuestaOk, fetchApi } from "../../shared/api/api";

const MENSAJE_ERROR_NOTAS = "No se pudo completar la operación de notas.";

export async function obtenerNotasPorBimestre(
  token: string,
  estudianteId: string,
  bimestre: Bimestre,
): Promise<NotaCompetencia[]> {
  const parametros = new URLSearchParams({
    bimestre: String(bimestre),
  });

  const respuesta = await fetchApi(
    `${API_URL}/api/v1/estudiantes/${estudianteId}/notas-competencias?${parametros}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  await asegurarRespuestaOk(respuesta, MENSAJE_ERROR_NOTAS);

  return (await respuesta.json()) as NotaCompetencia[];
}

export async function guardarNotaCompetencia(
  token: string,
  estudianteId: string,
  datos: NotaCompetenciaRequest,
): Promise<NotaCompetencia> {
  const respuesta = await fetchApi(
    `${API_URL}/api/v1/estudiantes/${estudianteId}/notas-competencias`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datos),
    },
  );

  await asegurarRespuestaOk(respuesta, MENSAJE_ERROR_NOTAS);

  return (await respuesta.json()) as NotaCompetencia;
}
