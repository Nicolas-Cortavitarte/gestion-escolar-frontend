import type { Competencia, CompetenciaRequest } from "./competencias.types";
import { API_URL, asegurarRespuestaOk, fetchApi } from "../../shared/api/api";

const MENSAJE_ERROR_COMPETENCIAS =
  "No se pudo completar la operación de competencias.";

export async function obtenerCompetenciasPorCurso(
  token: string,
  cursoId: string,
): Promise<Competencia[]> {
  const respuesta = await fetchApi(`${API_URL}/api/v1/competencias`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  await asegurarRespuestaOk(respuesta, MENSAJE_ERROR_COMPETENCIAS);

  const competencias = (await respuesta.json()) as Competencia[];

  return competencias.filter((competencia) => competencia.cursoId === cursoId);
}

export async function crearCompetencia(
  token: string,
  datos: CompetenciaRequest,
): Promise<Competencia> {
  const respuesta = await fetchApi(`${API_URL}/api/v1/competencias`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(datos),
  });

  await asegurarRespuestaOk(respuesta, MENSAJE_ERROR_COMPETENCIAS);

  return (await respuesta.json()) as Competencia;
}

export async function actualizarCompetencia(
  token: string,
  id: string,
  datos: CompetenciaRequest,
): Promise<Competencia> {
  const respuesta = await fetchApi(`${API_URL}/api/v1/competencias/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(datos),
  });

  await asegurarRespuestaOk(respuesta, MENSAJE_ERROR_COMPETENCIAS);

  return (await respuesta.json()) as Competencia;
}
