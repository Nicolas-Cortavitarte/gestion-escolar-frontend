import type {
  ActualizarEstudianteRequest,
  Estudiante,
} from "./estudiantes.types";
import { API_URL, asegurarRespuestaOk, fetchApi } from "../../shared/api/api";

export async function obtenerEstudiantes(token: string): Promise<Estudiante[]> {
  const respuesta = await fetchApi(`${API_URL}/api/v1/estudiantes`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  await asegurarRespuestaOk(
    respuesta,
    "No se pudo cargar la lista de estudiantes.",
  );

  return (await respuesta.json()) as Estudiante[];
}

export async function actualizarEstudiante(
  token: string,
  id: string,
  datos: ActualizarEstudianteRequest,
): Promise<Estudiante> {
  const respuesta = await fetchApi(
    `${API_URL}/api/v1/estudiantes/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(datos),
    },
  );

  if (respuesta.status === 404) {
    throw new Error("El estudiante ya no existe.");
  }

  await asegurarRespuestaOk(
    respuesta,
    "No se pudo actualizar el estudiante. Revisa los datos.",
  );

  return (await respuesta.json()) as Estudiante;
}

export async function buscarEstudiantePorDni(
  token: string,
  dni: string,
): Promise<Estudiante> {
  const estudiantes = await obtenerEstudiantes(token);
  const estudiante = estudiantes.find((actual) => actual.dni === dni);

  if (!estudiante) {
    throw new Error("No se encontró un estudiante con ese DNI.");
  }

  return estudiante;
}
