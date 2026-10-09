import type { LoginResponse } from "../../features/auth/auth.types";

const CLAVE_SESION = "lst.sesion";
export const EVENTO_SESION_EXPIRADA = "lst:sesion-expirada";

export function vencimientoToken(token: string): number | null {
  try {
    const partes = token.split(".");
    if (partes.length !== 3) return null;

    const base64 = partes[1].replace(/-/g, "+").replace(/_/g, "/");
    const contenido = atob(
      base64.padEnd(Math.ceil(base64.length / 4) * 4, "="),
    );
    const payload: unknown = JSON.parse(contenido);

    if (
      typeof payload !== "object" ||
      payload === null ||
      !("exp" in payload) ||
      typeof payload.exp !== "number" ||
      !Number.isFinite(payload.exp)
    ) {
      return null;
    }

    return payload.exp * 1000;
  } catch {
    return null;
  }
}

export function conservarSesion(sesion: LoginResponse | null): void {
  try {
    if (sesion) {
      sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    } else {
      sessionStorage.removeItem(CLAVE_SESION);
    }
  } catch {
    // Si el navegador bloquea el almacenamiento,
    // la sesión seguirá funcionando en memoria.
  }
}

export function recuperarSesion(): LoginResponse | null {
  try {
    const guardada = sessionStorage.getItem(CLAVE_SESION);
    if (!guardada) return null;

    const datos: unknown = JSON.parse(guardada);

    if (
      typeof datos !== "object" ||
      datos === null ||
      !("token" in datos) ||
      typeof datos.token !== "string" ||
      !("correo" in datos) ||
      typeof datos.correo !== "string" ||
      !("rol" in datos) ||
      (datos.rol !== "ADMIN" && datos.rol !== "DOCENTE")
    ) {
      conservarSesion(null);
      return null;
    }

    const vence = vencimientoToken(datos.token);

    if (vence === null || vence <= Date.now()) {
      conservarSesion(null);
      return null;
    }

    return datos as LoginResponse;
  } catch {
    conservarSesion(null);
    return null;
  }
}
