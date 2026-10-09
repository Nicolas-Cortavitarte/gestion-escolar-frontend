import { EVENTO_SESION_EXPIRADA } from "../utils/sesion";

export const API_URL = import.meta.env.VITE_API_URL.replace(/\/+$/, "");

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
