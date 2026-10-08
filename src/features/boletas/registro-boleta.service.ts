import type { ResumenFinal } from "./boletas.types";
import type {
  EvaluacionPadre,
  EvaluacionPadreRequest,
  ReporteConducta,
  ReporteConductaRequest,
} from "./registro-boleta.types";

const API_URL = import.meta.env.VITE_API_URL;

async function solicitar<T>(
  token: string,
  ruta: string,
  mensajeError: string,
  datos?: ReporteConductaRequest | EvaluacionPadreRequest,
): Promise<T> {
  const respuesta = await fetch(`${API_URL}${ruta}`, {
    method: datos === undefined ? "GET" : "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(datos === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(datos === undefined ? {} : { body: JSON.stringify(datos) }),
  });

  if (!respuesta.ok) {
    if (respuesta.status === 401) {
      throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");
    }

    if (respuesta.status === 403) {
      throw new Error("No tienes permiso para realizar esta acción.");
    }

    let mensaje = mensajeError;

    try {
      const error: unknown = await respuesta.json();

      if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof error.message === "string"
      ) {
        mensaje = error.message;
      }
    } catch {
      // Conserva el mensaje si la respuesta no contiene JSON.
    }

    throw new Error(mensaje);
  }

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
    `/api/v1/estudiantes/${estudianteId}/reportes-conducta`,
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
    `/api/v1/estudiantes/${estudianteId}/reportes-conducta`,
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
    `/api/v1/estudiantes/${estudianteId}/evaluacion-padre`,
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
    `/api/v1/estudiantes/${estudianteId}/evaluacion-padre`,
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

  const respuesta = await fetch(
    `${API_URL}/api/v1/estudiantes/${estudianteId}/resumen-final/calcular?${parametros}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!respuesta.ok) {
    if (respuesta.status === 401) {
      throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");
    }

    if (respuesta.status === 403) {
      throw new Error("No tienes permiso para calcular el resumen final.");
    }

    let mensaje = "No se pudo calcular el resumen final.";

    try {
      const fallo: unknown = await respuesta.json();

      if (
        typeof fallo === "object" &&
        fallo !== null &&
        "message" in fallo &&
        typeof fallo.message === "string"
      ) {
        mensaje = fallo.message;
      }
    } catch {
      // Conserva el mensaje si la respuesta no contiene JSON.
    }

    throw new Error(mensaje);
  }

  return (await respuesta.json()) as ResumenFinal;
}
