import type { Curso, CursoRequest } from "./cursos.types";

const API_URL = import.meta.env.VITE_API_URL;

async function comprobarRespuesta(respuesta: Response): Promise<void> {
  if (respuesta.ok) return;

  if (respuesta.status === 401) {
    throw new Error("Tu sesión ya no es válida. Inicia sesión nuevamente.");
  }

  if (respuesta.status === 403) {
    throw new Error("No tienes permiso para realizar esta operación.");
  }

  let mensaje = "No se pudo completar la operación de cursos.";

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

export async function obtenerCursos(token: string): Promise<Curso[]> {
  const respuesta = await fetch(`${API_URL}/api/v1/cursos`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  await comprobarRespuesta(respuesta);

  return (await respuesta.json()) as Curso[];
}

export async function crearCurso(
  token: string,
  datos: CursoRequest,
): Promise<Curso> {
  const respuesta = await fetch(`${API_URL}/api/v1/cursos`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(datos),
  });

  await comprobarRespuesta(respuesta);

  return (await respuesta.json()) as Curso;
}

export async function actualizarCurso(
  token: string,
  id: string,
  datos: CursoRequest,
): Promise<Curso> {
  const respuesta = await fetch(`${API_URL}/api/v1/cursos/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(datos),
  });

  await comprobarRespuesta(respuesta);

  return (await respuesta.json()) as Curso;
}
