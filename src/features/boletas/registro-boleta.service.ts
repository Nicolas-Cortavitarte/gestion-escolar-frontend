import type { ResumenFinal } from "./boletas.types";
import type {
  EvaluacionPadre,
  EvaluacionPadreRequest,
  ReporteConducta,
  ReporteConductaRequest,
} from "./registro-boleta.types";
import { API_URL, asegurarRespuestaOk, fetchApi } from "../../shared/api/api";

async function solicitar<T>(
  token: string,
  ruta: string,
  mensajeError: string,
  datos?: ReporteConductaRequest | EvaluacionPadreRequest,
): Promise<T> {
  const respuesta = await fetchApi(`${API_URL}${ruta}`, {
    method: datos === undefined ? "GET" : "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(datos === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(datos === undefined ? {} : { body: JSON.stringify(datos) }),
  });

  await asegurarRespuestaOk(respuesta, mensajeError);

  const contenido = respuesta.headers.get("content-type") ?? "";

  if (!contenido.includes("application/json")) {
    throw new Error(
      "El servidor devolvió una respuesta inesperada. Revisa la URL de la API.",
    );
  }

  return (await respuesta.json()) as T;
}

export async function obtenerReportesConducta(
  token: string,
  estudianteId: string,
  anioLectivo: number,
): Promise<ReporteConducta[]> {
  const reportes = await solicitar<ReporteConducta[]>(
    token,
    `/api/v1/estudiantes/${encodeURIComponent(estudianteId)}/reportes-conducta`,
    "No se pudieron cargar los registros de conducta y asistencia.",
  );

  return reportes.filter((reporte) => reporte.anioLectivo === anioLectivo);
}

export function guardarReporteConducta(
  token: string,
  estudianteId: string,
  datos: ReporteConductaRequest,
): Promise<ReporteConducta> {
  return solicitar<ReporteConducta>(
    token,
    `/api/v1/estudiantes/${encodeURIComponent(estudianteId)}/reportes-conducta`,
    "No se pudo guardar la conducta y asistencia.",
    datos,
  );
}

export async function obtenerEvaluacionesPadre(
  token: string,
  estudianteId: string,
  anioLectivo: number,
): Promise<EvaluacionPadre[]> {
  const evaluaciones = await solicitar<EvaluacionPadre[]>(
    token,
    `/api/v1/estudiantes/${encodeURIComponent(estudianteId)}/evaluacion-padre`,
    "No se pudieron cargar las evaluaciones del padre.",
  );

  return evaluaciones.filter(
    (evaluacion) => evaluacion.anioLectivo === anioLectivo,
  );
}

export function guardarEvaluacionPadre(
  token: string,
  estudianteId: string,
  datos: EvaluacionPadreRequest,
): Promise<EvaluacionPadre> {
  return solicitar<EvaluacionPadre>(
    token,
    `/api/v1/estudiantes/${encodeURIComponent(estudianteId)}/evaluacion-padre`,
    "No se pudo guardar la evaluación del padre.",
    datos,
  );
}

export async function calcularResumenFinal(
  token: string,
  estudianteId: string,
  anioLectivo: number,
): Promise<ResumenFinal> {
  const parametros = new URLSearchParams({
    anioLectivo: String(anioLectivo),
  });

  const respuesta = await fetchApi(
    `${API_URL}/api/v1/estudiantes/${encodeURIComponent(estudianteId)}/resumen-final/calcular?${parametros}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  await asegurarRespuestaOk(respuesta, "No se pudo calcular el resumen final.");

  return (await respuesta.json()) as ResumenFinal;
}
