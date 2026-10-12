import type { LoginRequest, LoginResponse } from "./auth.types";
import { API_URL, fetchApi } from "../../shared/api/api";

export async function iniciarSesion(
  credenciales: LoginRequest,
): Promise<LoginResponse> {
  let respuesta: Response;

  try {
    respuesta = await fetchApi(`${API_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credenciales),
    });
  } catch {
    throw new Error(
      "No se pudo conectar con el sistema. Revisa tu conexión e intenta nuevamente.",
    );
  }

  if (respuesta.status === 429) {
    throw new Error(
      "Demasiados intentos de inicio de sesión. Espera un minuto antes de volver a intentarlo.",
    );
  }

  if (respuesta.status === 401 || respuesta.status === 403) {
    throw new Error(
      "No se pudo iniciar sesión. Revisa tu correo y contraseña. Si el problema continúa, consulta con administración.",
    );
  }

  if (!respuesta.ok) {
    throw new Error(
      "El sistema no pudo iniciar sesión. Intenta nuevamente en unos momentos.",
    );
  }

  return (await respuesta.json()) as LoginResponse;
}
