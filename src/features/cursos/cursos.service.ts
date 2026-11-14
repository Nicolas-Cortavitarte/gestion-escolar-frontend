import type { Curso, CursoRequest, EstudianteCurso } from "./cursos.types";
import { API_URL, asegurarRespuestaOk, fetchApi } from "../../shared/api/api";

const MENSAJE_ERROR_CURSOS = "No se pudo completar la operación de cursos.";

export async function obtenerCursos(token: string): Promise<Curso[]> {
  const respuesta = await fetchApi(`${API_URL}/api/v1/cursos`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  await asegurarRespuestaOk(respuesta, MENSAJE_ERROR_CURSOS);

  return (await respuesta.json()) as Curso[];
}

export async function crearCurso(
  token: string,
  datos: CursoRequest,
): Promise<Curso> {
  const respuesta = await fetchApi(`${API_URL}/api/v1/cursos`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(datos),
  });

  await asegurarRespuestaOk(respuesta, MENSAJE_ERROR_CURSOS);

  return (await respuesta.json()) as Curso;
}

export async function actualizarCurso(
  token: string,
  id: string,
  datos: CursoRequest,
): Promise<Curso> {
  const respuesta = await fetchApi(
    `${API_URL}/api/v1/cursos/${encodeURIComponent(id)}`,
    {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(datos),
  });

  await asegurarRespuestaOk(respuesta, MENSAJE_ERROR_CURSOS);

  return (await respuesta.json()) as Curso;
}

export async function obtenerMisCursos(token: string): Promise<Curso[]> {
  const respuesta = await fetchApi(`${API_URL}/api/v1/cursos/mis-cursos`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  await asegurarRespuestaOk(respuesta, MENSAJE_ERROR_CURSOS);

  return (await respuesta.json()) as Curso[];
}

export async function obtenerEstudiantesPorCurso(
  token: string,
  cursoId: string,
): Promise<EstudianteCurso[]> {
  const respuesta = await fetchApi(
    `${API_URL}/api/v1/cursos/${encodeURIComponent(cursoId)}/estudiantes`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  await asegurarRespuestaOk(respuesta, MENSAJE_ERROR_CURSOS);

  return (await respuesta.json()) as EstudianteCurso[];
}
