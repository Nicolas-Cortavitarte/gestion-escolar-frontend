import { useEffect, useState } from "react";
import { AppRoutes } from "./app/routes/AppRoutes";
import type { LoginResponse } from "./features/auth/auth.types";
import {
  EVENTO_SESION_EXPIRADA,
  conservarSesion,
  recuperarSesion,
  vencimientoToken,
} from "./shared/utils/sesion";

function App() {
  const [sesion, setSesion] = useState<LoginResponse | null>(recuperarSesion);
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    if (!sesion) return;

    const tokenActual = sesion.token;

    function expirarSesion() {
      conservarSesion(null);
      setSesion(null);
      setAviso("Tu sesión expiró. Inicia sesión para continuar.");
    }

    function comprobarVencimiento() {
      const vence = vencimientoToken(tokenActual);

      if (vence === null || vence <= Date.now()) {
        expirarSesion();
      }
    }

    function manejarSesionExpirada(evento: Event) {
      const detalle = (evento as CustomEvent<{ token: string }>).detail;

      if (detalle?.token === tokenActual) {
        expirarSesion();
      }
    }

    const intervalo = window.setInterval(comprobarVencimiento, 10000);

    window.addEventListener("focus", comprobarVencimiento);
    window.addEventListener(EVENTO_SESION_EXPIRADA, manejarSesionExpirada);

    return () => {
      window.clearInterval(intervalo);
      window.removeEventListener("focus", comprobarVencimiento);
      window.removeEventListener(EVENTO_SESION_EXPIRADA, manejarSesionExpirada);
    };
  }, [sesion]);

  function iniciarSesion(datos: LoginResponse) {
    conservarSesion(datos);
    setSesion(datos);
    setAviso("");
  }

  function cerrarSesion() {
    conservarSesion(null);
    setSesion(null);
    setAviso("");
  }

  return (
    <>
      {!sesion && aviso && (
        <p role="alert" className="aviso-sesion">
          {aviso}
        </p>
      )}

      <AppRoutes
        sesion={sesion}
        onLogin={iniciarSesion}
        onLogout={cerrarSesion}
      />
    </>
  );
}

export default App;
