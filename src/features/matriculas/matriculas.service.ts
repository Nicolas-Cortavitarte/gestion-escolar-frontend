import type {
  InscripcionRequest,
  InscripcionResponse,
  ApoderadoExistente,
} from "./matriculas.types";

const API_URL = import.meta.env.VITE_API_URL;

export async function crearInscripcion(
  token: string,
  datos: InscripcionRequest,
): Promise<InscripcionResponse> {
  const respuesta = await fetch(`${API_URL}/api/v1/inscripciones`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(datos),
  });

  if (respuesta.status === 401) {
    throw new Error("Tu sesión ya no es válida. Inicia sesión nuevamente.");
  }

  if (respuesta.status === 403) {
    throw new Error("No tienes permiso para registrar matrículas.");
  }

  if (!respuesta.ok) {
    throw new Error("No se pudo completar la matrícula. Revisa los datos.");
  }

  return (await respuesta.json()) as InscripcionResponse;
}

export async function buscarApoderadoPorDni(
  token: string,
  dni: string,
): Promise<ApoderadoExistente> {
  const respuesta = await fetch(
    `${API_URL}/api/v1/apoderados/${encodeURIComponent(dni)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (respuesta.status === 404) {
    throw new Error("No se encontró un apoderado con ese DNI.");
  }

  if (!respuesta.ok) {
    throw new Error("No se pudo consultar al apoderado.");
  }

  return (await respuesta.json()) as ApoderadoExistente;
}
