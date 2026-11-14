import { EVENTO_SESION_EXPIRADA } from "../utils/sesion";

const urlConfigurada = import.meta.env.VITE_API_URL?.trim();

if (!urlConfigurada) {
  throw new Error(
    "Falta configurar VITE_API_URL en las variables de entorno del frontend.",
  );
}

export const API_URL = urlConfigurada.replace(/\/+$/, "");

export async function fetchApi(
  url: string,
  opciones?: RequestInit,
): Promise<Response> {
  const respuesta = await fetch(url, opciones);

  const autorizacion = new Headers(opciones?.headers).get("Authorization");

  if (respuesta.status === 401 && autorizacion?.startsWith("Bearer ")) {
    window.dispatchEvent(
      new CustomEvent(EVENTO_SESION_EXPIRADA, {
        detail: {
          token: autorizacion.slice(7),
        },
      }),
    );
  }

  return respuesta;
}

export async function asegurarRespuestaOk(
  respuesta: Response,
  mensajePorDefecto = "No se pudo completar la operación.",
): Promise<void> {
  if (respuesta.ok) return;

  if (respuesta.status === 401) {
    throw new Error("Tu sesión ya no es válida. Inicia sesión nuevamente.");
  }

  if (respuesta.status === 403) {
    throw new Error("No tienes permiso para realizar esta operación.");
  }

  let mensaje = mensajePorDefecto;

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
