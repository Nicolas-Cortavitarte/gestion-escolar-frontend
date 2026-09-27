import { useState, type FormEvent } from "react";
import { iniciarSesion } from "../auth.service";
import type { LoginResponse } from "../auth.types";
import "./LoginPage.css";

interface LoginPageProps {
  onLogin: (sesion: LoginResponse) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError("");
    setCargando(true);

    try {
      const sesion = await iniciarSesion({ correo, contrasena });
      onLogin(sesion);
    } catch (fallo) {
      setError(
        fallo instanceof Error ? fallo.message : "Ocurrió un error inesperado",
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-page__presentacion" aria-label="Bienvenida">
        <div className="login-page__marca">
          <span>Liceo Santo Toribio</span>
        </div>

        <div className="login-page__mensaje">
          <p>Un espacio para nuestra comunidad educativa</p>
          <h2>Aprender, enseñar y crecer juntos.</h2>
        </div>

        <p className="login-page__pie">© 2026 Liceo Santo Toribio</p>
      </section>

      <section className="login-page__acceso" aria-labelledby="login-titulo">
        <div className="login-page__contenido">
          <p className="login-page__etiqueta">Sistema de gestión escolar</p>
          <h1 id="login-titulo">Bienvenid@</h1>
          <p className="login-page__descripcion">
            Ingresa tus credenciales para continuar.
          </p>

          <form className="login-page__formulario" onSubmit={manejarEnvio}>
            <div className="login-page__campo">
              <label htmlFor="correo">Correo electrónico</label>
              <input
                id="correo"
                type="email"
                value={correo}
                onChange={(evento) => setCorreo(evento.target.value)}
                placeholder="nombre@ejemplo.com"
                autoComplete="username"
                required
              />
            </div>

            <div className="login-page__campo">
              <label htmlFor="contrasena">Contraseña</label>
              <input
                id="contrasena"
                type="password"
                value={contrasena}
                onChange={(evento) => setContrasena(evento.target.value)}
                placeholder="Ingresa tu contraseña"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <p className="login-page__error" role="alert">
                {error}
              </p>
            )}

            <button
              className="login-page__boton"
              type="submit"
              disabled={cargando}
            >
              {cargando ? "Ingresando..." : "Iniciar sesión"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
