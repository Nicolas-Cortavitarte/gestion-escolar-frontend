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
