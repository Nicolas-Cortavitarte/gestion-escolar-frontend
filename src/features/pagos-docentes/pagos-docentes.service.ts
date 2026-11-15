import type { MetodoPago, PagoDocente } from "./pagos-docentes.types";
import { API_URL, asegurarRespuestaOk, fetchApi } from "../../shared/api/api";

const MENSAJE_ERROR_PAGOS =
  "No se pudo completar la operación de pagos a docentes.";

export async function obtenerPagosDocentes(
  token: string,
): Promise<PagoDocente[]> {
  const respuesta = await fetchApi(`${API_URL}/api/v1/pagos-docentes`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  await asegurarRespuestaOk(respuesta, MENSAJE_ERROR_PAGOS);

  return (await respuesta.json()) as PagoDocente[];
}

export async function pagarDocente(
  token: string,
  id: string,
  metodoPago?: MetodoPago,
  codigoOperacion?: string,
): Promise<PagoDocente> {
  const params = new URLSearchParams();
  if (metodoPago) params.set("metodoPago", metodoPago);
  if (codigoOperacion?.trim()) params.set("codigoOperacion", codigoOperacion.trim());
  const queryString = params.toString();
  const query = queryString ? `?${queryString}` : "";
  const respuesta = await fetchApi(
    `${API_URL}/api/v1/pagos-docentes/${encodeURIComponent(id)}/pagar${query}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  await asegurarRespuestaOk(respuesta, MENSAJE_ERROR_PAGOS);

  return (await respuesta.json()) as PagoDocente;
}

export async function generarPagosAnuales(token: string): Promise<void> {
  const respuesta = await fetchApi(
    `${API_URL}/api/v1/pagos-docentes/generar-anuales`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  await asegurarRespuestaOk(respuesta, MENSAJE_ERROR_PAGOS);
}
