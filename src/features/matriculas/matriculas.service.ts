import type {
  InscripcionRequest,
  InscripcionResponse,
  ApoderadoExistente,
  CrearMatriculaRequest,
  Matricula,
} from "./matriculas.types";
import { API_URL, asegurarRespuestaOk, fetchApi } from "../../shared/api/api";

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

  await asegurarRespuestaOk(
    respuesta,
    "No se pudo completar la matrícula. Revisa los datos.",
  );

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

  await asegurarRespuestaOk(respuesta, "No se pudo consultar al apoderado.");

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

  await asegurarRespuestaOk(respuesta, "No se pudo registrar la matrícula.");
}

export async function obtenerMatriculas(token: string): Promise<Matricula[]> {
  const respuesta = await fetchApi(`${API_URL}/api/v1/matriculas`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  await asegurarRespuestaOk(
    respuesta,
    "No se pudo cargar la lista de matrículas.",
  );

  return (await respuesta.json()) as Matricula[];
}

export async function pagarMatricula(
  token: string,
  id: string,
): Promise<Matricula> {
  const respuesta = await fetchApi(
    `${API_URL}/api/v1/matriculas/${encodeURIComponent(id)}/pagar-matricula`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  await asegurarRespuestaOk(
    respuesta,
    "No se pudo registrar el pago de matrícula.",
  );

  return (await respuesta.json()) as Matricula;
}
