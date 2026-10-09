import type { LoginRequest, LoginResponse } from "./auth.types";
import { API_URL, fetchApi } from "../../shared/api/api";

export async function iniciarSesion(
  credenciales: LoginRequest,
): Promise<LoginResponse> {
  const respuesta = await fetchApi(`${API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credenciales),
  });

  if (respuesta.status === 401) {
    throw new Error("Correo o contraseña incorrectos. Intente de nuevo. ");
  }

  if (!respuesta.ok) {
    throw new Error("Ocurrió un error al iniciar sesión. Intente de nuevo. ");
  }

  return (await respuesta.json()) as LoginResponse;
}
