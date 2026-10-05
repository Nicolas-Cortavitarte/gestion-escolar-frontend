import type { Boleta } from "./boletas.types";

const API_URL = import.meta.env.VITE_API_URL;

export async function obtenerBoleta(
  token: string,
  estudianteId: string,
  anioLectivo: number,
): Promise<Boleta> {
  const parametros = new URLSearchParams({
    anioLectivo: String(anioLectivo),
  });

  const respuesta = await fetch(
    `${API_URL}/api/v1/boletas/estudiante/${estudianteId}?${parametros}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (respuesta.status === 401) {
    throw new Error("Tu sesión ya no es válida. Inicia sesión nuevamente.");
  }

  if (respuesta.status === 403) {
    throw new Error("No tienes permiso para consultar esta boleta.");
  }

  if (!respuesta.ok) {
    let mensaje = "No se pudo consultar la boleta.";

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

  return (await respuesta.json()) as Boleta;
}
