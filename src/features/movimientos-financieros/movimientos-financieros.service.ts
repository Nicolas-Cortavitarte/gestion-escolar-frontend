import type {
  MovimientoFinanciero,
  MovimientoFinancieroRequest,
} from "./movimientos-financieros.types";

const API_URL = import.meta.env.VITE_API_URL;

async function comprobarRespuesta(respuesta: Response): Promise<void> {
  if (respuesta.ok) return;

  if (respuesta.status === 401) {
    throw new Error("Tu sesión ya no es válida. Inicia sesión nuevamente.");
  }

  if (respuesta.status === 403) {
    throw new Error(
      "No tienes permiso para gestionar movimientos financieros.",
    );
  }

  let mensaje = "No se pudo completar la operación.";

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

export async function obtenerMovimientos(
  token: string,
  desde: string,
  hasta: string,
): Promise<MovimientoFinanciero[]> {
  if (!desde || !hasta || desde > hasta) {
    throw new Error("Selecciona un rango de fechas válido.");
  }

  const parametros = new URLSearchParams({ desde, hasta });

  const respuesta = await fetch(
    `${API_URL}/api/v1/movimientos-financieros?${parametros}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  await comprobarRespuesta(respuesta);

  return (await respuesta.json()) as MovimientoFinanciero[];
}

export async function crearMovimiento(
  token: string,
  datos: MovimientoFinancieroRequest,
): Promise<MovimientoFinanciero> {
  const respuesta = await fetch(`${API_URL}/api/v1/movimientos-financieros`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(datos),
  });

  await comprobarRespuesta(respuesta);

  return (await respuesta.json()) as MovimientoFinanciero;
}

export async function eliminarMovimiento(
  token: string,
  id: string,
): Promise<void> {
  const respuesta = await fetch(
    `${API_URL}/api/v1/movimientos-financieros/${id}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  await comprobarRespuesta(respuesta);
}
