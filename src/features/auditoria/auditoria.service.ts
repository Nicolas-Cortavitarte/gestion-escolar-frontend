import type { PaginaAuditoria } from "./auditoria.types";
import { API_URL, asegurarRespuestaOk, fetchApi } from "../../shared/api/api";

export async function obtenerAuditoria(
  token: string,
  pagina = 0,
  tamanio = 20,
): Promise<PaginaAuditoria> {
  const parametros = new URLSearchParams({
    page: String(pagina),
    size: String(tamanio),
  });

  const respuesta = await fetchApi(`${API_URL}/api/v1/auditoria?${parametros}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  await asegurarRespuestaOk(
    respuesta,
    "No se pudo cargar el registro de auditoría.",
  );

  return (await respuesta.json()) as PaginaAuditoria;
}
