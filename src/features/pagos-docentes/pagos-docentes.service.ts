import type { PagoDocente } from "./pagos-docentes.types";
import { API_URL, fetchApi } from "../../shared/api/api";

async function comprobarRespuesta(respuesta: Response): Promise<void> {
  if (respuesta.ok) return;

  if (respuesta.status === 401) {
    throw new Error("Tu sesión ya no es válida. Inicia sesión nuevamente.");
  }

  if (respuesta.status === 403) {
    throw new Error("No tienes permiso para realizar esta operación.");
  }

  let mensaje = "No se pudo completar la operación de pagos a docentes.";

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

export async function obtenerPagosDocentes(
  token: string,
): Promise<PagoDocente[]> {
  const respuesta = await fetchApi(`${API_URL}/api/v1/pagos-docentes`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  await comprobarRespuesta(respuesta);

  return (await respuesta.json()) as PagoDocente[];
}

export async function pagarDocente(
  token: string,
  id: string,
): Promise<PagoDocente> {
  const respuesta = await fetchApi(
    `${API_URL}/api/v1/pagos-docentes/${id}/pagar`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  await comprobarRespuesta(respuesta);

  return (await respuesta.json()) as PagoDocente;
}
