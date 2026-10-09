import type {
  InscripcionRequest,
  InscripcionResponse,
  ApoderadoExistente,
  CrearMatriculaRequest,
  Matricula,
} from "./matriculas.types";
import { API_URL, fetchApi } from "../../shared/api/api";

export async function crearInscripcion(
  token: string,
  datos: InscripcionRequest,
): Promise<InscripcionResponse> {
  const respuesta = await fetchApi(`${API_URL}/api/v1/inscripciones`, {
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
  const respuesta = await fetchApi(
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

export async function crearMatricula(
  token: string,
  datos: CrearMatriculaRequest,
): Promise<void> {
  const respuesta = await fetchApi(`${API_URL}/api/v1/matriculas`, {
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
    let mensaje = "No se pudo registrar la matrícula.";

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
      // Conserva el mensaje general si la respuesta no contiene JSON.
    }

    throw new Error(mensaje);
  }
}

export async function obtenerMatriculas(token: string): Promise<Matricula[]> {
  const respuesta = await fetchApi(`${API_URL}/api/v1/matriculas`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (respuesta.status === 401) {
    throw new Error("Tu sesión ya no es válida. Inicia sesión nuevamente.");
  }

  if (respuesta.status === 403) {
    throw new Error("No tienes permiso para consultar matrículas.");
  }

  if (!respuesta.ok) {
    throw new Error("No se pudo cargar la lista de matrículas.");
  }

  return (await respuesta.json()) as Matricula[];
}

export async function pagarMatricula(
  token: string,
  id: string,
): Promise<Matricula> {
  const respuesta = await fetchApi(
    `${API_URL}/api/v1/matriculas/${id}/pagar-matricula`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (respuesta.status === 401) {
    throw new Error("Tu sesión ya no es válida. Inicia sesión nuevamente.");
  }

  if (respuesta.status === 403) {
    throw new Error("No tienes permiso para registrar pagos.");
  }

  if (!respuesta.ok) {
    let mensaje = "No se pudo registrar el pago de matrícula.";

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

  return (await respuesta.json()) as Matricula;
}
