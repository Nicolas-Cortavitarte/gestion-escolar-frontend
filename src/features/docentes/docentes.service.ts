import type { Docente, DocenteRequest, DocenteUpdate } from "./docentes.types";

const API_URL = import.meta.env.VITE_API_URL;

async function comprobarRespuesta(respuesta: Response): Promise<void> {
  if (respuesta.ok) return;

  if (respuesta.status === 401) {
    throw new Error("Tu sesión ya no es válida. Inicia sesión nuevamente.");
  }

  if (respuesta.status === 403) {
    throw new Error("No tienes permiso para realizar esta operación.");
  }

  let mensaje = "No se pudo completar la operación de docentes.";

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

export async function obtenerDocentes(token: string): Promise<Docente[]> {
  const respuesta = await fetch(`${API_URL}/api/v1/docentes`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  await comprobarRespuesta(respuesta);

  return (await respuesta.json()) as Docente[];
}

export async function crearDocente(
  token: string,
  datos: DocenteRequest,
): Promise<Docente> {
  const respuesta = await fetch(`${API_URL}/api/v1/docentes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(datos),
  });

  await comprobarRespuesta(respuesta);

  return (await respuesta.json()) as Docente;
}

export async function actualizarDocente(
  token: string,
  id: string,
  datos: DocenteUpdate,
): Promise<Docente> {
  const respuesta = await fetch(`${API_URL}/api/v1/docentes/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(datos),
  });

  await comprobarRespuesta(respuesta);

  return (await respuesta.json()) as Docente;
}

export async function cambiarEstadoDocente(
  token: string,
  id: string,
  activo: boolean,
): Promise<void> {
  const accion = activo ? "reactivar" : "desactivar";

  const respuesta = await fetch(`${API_URL}/api/v1/docentes/${id}/${accion}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  await comprobarRespuesta(respuesta);
}
