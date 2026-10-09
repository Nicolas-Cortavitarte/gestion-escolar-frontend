import type { Pension } from "./pensiones.types";
import { API_URL, fetchApi } from "../../shared/api/api";

async function comprobarRespuesta(respuesta: Response): Promise<void> {
  if (respuesta.ok) return;

  if (respuesta.status === 401) {
    throw new Error("Tu sesión ya no es válida. Inicia sesión nuevamente.");
  }

  if (respuesta.status === 403) {
    throw new Error("No tienes permiso para realizar esta operación.");
  }

  let mensaje = "No se pudo completar la operación de pensiones.";

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
    // Conserva el mensaje general si no hay una respuesta JSON.
  }

  throw new Error(mensaje);
}

export async function obtenerPensiones(token: string): Promise<Pension[]> {
  const respuesta = await fetchApi(`${API_URL}/api/v1/pensiones`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  await comprobarRespuesta(respuesta);

  return (await respuesta.json()) as Pension[];
}

export async function pagarPension(
  token: string,
  id: string,
): Promise<Pension> {
  const respuesta = await fetchApi(`${API_URL}/api/v1/pensiones/${id}/pagar`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  await comprobarRespuesta(respuesta);

  return (await respuesta.json()) as Pension;
}
