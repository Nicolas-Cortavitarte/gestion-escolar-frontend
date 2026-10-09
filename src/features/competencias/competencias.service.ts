import type { Competencia, CompetenciaRequest } from "./competencias.types";
import { API_URL, fetchApi } from "../../shared/api/api";

async function comprobarRespuesta(respuesta: Response): Promise<void> {
  if (respuesta.ok) return;

  if (respuesta.status === 401) {
    throw new Error("Tu sesión ya no es válida. Inicia sesión nuevamente.");
  }

  if (respuesta.status === 403) {
    throw new Error("No tienes permiso para gestionar competencias.");
  }

  let mensaje = "No se pudo completar la operación de competencias.";

  try {
    const datos: unknown = await respuesta.json();

    if (
      typeof datos === "object" &&
      datos !== null &&
      "message" in datos &&
      typeof datos.message === "string"
    ) {
      mensaje = datos.message;
    }
  } catch {
    // Conserva el mensaje general si la respuesta no contiene JSON.
  }

  throw new Error(mensaje);
}

export async function obtenerCompetenciasPorCurso(
  token: string,
  cursoId: string,
): Promise<Competencia[]> {
  const respuesta = await fetchApi(`${API_URL}/api/v1/competencias`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  await comprobarRespuesta(respuesta);

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

  await comprobarRespuesta(respuesta);

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

  await comprobarRespuesta(respuesta);

  return (await respuesta.json()) as Competencia;
}
