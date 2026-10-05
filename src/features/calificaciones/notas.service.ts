import type {
  Bimestre,
  NotaCompetencia,
  NotaCompetenciaRequest,
} from "./notas.types";

const API_URL = import.meta.env.VITE_API_URL;

async function comprobarRespuesta(respuesta: Response): Promise<void> {
  if (respuesta.ok) return;

  if (respuesta.status === 401) {
    throw new Error("Tu sesión ya no es válida. Inicia sesión nuevamente.");
  }

  let mensaje =
    respuesta.status === 403
      ? "No tienes permiso para registrar notas de este curso."
      : "No se pudo completar la operación de notas.";

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

export async function obtenerNotasPorBimestre(
  token: string,
  estudianteId: string,
  bimestre: Bimestre,
): Promise<NotaCompetencia[]> {
  const parametros = new URLSearchParams({
    bimestre: String(bimestre),
  });

  const respuesta = await fetch(
    `${API_URL}/api/v1/estudiantes/${estudianteId}/notas-competencias?${parametros}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  await comprobarRespuesta(respuesta);

  return (await respuesta.json()) as NotaCompetencia[];
}

export async function guardarNotaCompetencia(
  token: string,
  estudianteId: string,
  datos: NotaCompetenciaRequest,
): Promise<NotaCompetencia> {
  const respuesta = await fetch(
    `${API_URL}/api/v1/estudiantes/${estudianteId}/notas-competencias`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datos),
    },
  );

  await comprobarRespuesta(respuesta);

  return (await respuesta.json()) as NotaCompetencia;
}
