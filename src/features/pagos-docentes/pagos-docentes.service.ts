import type { PagoDocente } from "./pagos-docentes.types";
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
