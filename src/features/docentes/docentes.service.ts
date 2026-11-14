import type { Docente, DocenteRequest, DocenteUpdate } from "./docentes.types";
import { API_URL, asegurarRespuestaOk, fetchApi } from "../../shared/api/api";

const MENSAJE_ERROR_DOCENTES = "No se pudo completar la operación de docentes.";

export async function obtenerDocentes(token: string): Promise<Docente[]> {
  const respuesta = await fetchApi(`${API_URL}/api/v1/docentes`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  await asegurarRespuestaOk(respuesta, MENSAJE_ERROR_DOCENTES);

  return (await respuesta.json()) as Docente[];
}

export async function crearDocente(
  token: string,
  datos: DocenteRequest,
): Promise<Docente> {
  const respuesta = await fetchApi(`${API_URL}/api/v1/docentes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(datos),
  });

  await asegurarRespuestaOk(respuesta, MENSAJE_ERROR_DOCENTES);

  return (await respuesta.json()) as Docente;
}

export async function actualizarDocente(
  token: string,
  id: string,
  datos: DocenteUpdate,
): Promise<Docente> {
  const respuesta = await fetchApi(`${API_URL}/api/v1/docentes/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(datos),
  });

  await asegurarRespuestaOk(respuesta, MENSAJE_ERROR_DOCENTES);

  return (await respuesta.json()) as Docente;
}

export async function cambiarEstadoDocente(
  token: string,
  id: string,
  activo: boolean,
): Promise<void> {
  const accion = activo ? "reactivar" : "desactivar";

  const respuesta = await fetchApi(
    `${API_URL}/api/v1/docentes/${id}/${accion}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  await asegurarRespuestaOk(respuesta, MENSAJE_ERROR_DOCENTES);
}
