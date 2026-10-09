import { useEffect, useState } from "react";
import { AppRoutes } from "./app/routes/AppRoutes";
import type { LoginResponse } from "./features/auth/auth.types";
import {
  conservarSesion,
  recuperarSesion,
  vencimientoToken,
} from "./shared/utils/sesion";

function App() {
  const [sesion, setSesion] = useState<LoginResponse | null>(recuperarSesion);
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    if (!sesion) return;

    function comprobarVencimiento() {
      const vence = vencimientoToken(sesion!.token);

      if (vence === null || vence <= Date.now()) {
        conservarSesion(null);
        setSesion(null);
        setAviso("Tu sesión expiró. Inicia sesión para continuar.");
      }
    }

    const intervalo = window.setInterval(comprobarVencimiento, 10000);

    window.addEventListener("focus", comprobarVencimiento);

    return () => {
      window.clearInterval(intervalo);
      window.removeEventListener("focus", comprobarVencimiento);
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
