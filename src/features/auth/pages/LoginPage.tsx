import { useState, type FormEvent } from "react";
import { Boton } from "../../../shared/components/Boton";
import { CampoEntrada } from "../../../shared/components/CampoEntrada";
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
  const [tocados, setTocados] = useState({
    correo: false,
    contrasena: false,
  });
  const [mostrarContrasena, setMostrarContrasena] = useState(false);

  function validarCorreo(valor: string) {
    if (!valor.trim()) return "Ingresa tu correo electrónico.";

    if (!/^[^\s@]+@[^\s@]+$/.test(valor.trim())) {
      return "Ingresa un correo electrónico válido.";
    }

    return "";
  }

  function validarContrasena(valor: string) {
    return valor.length === 0 ? "Ingresa tu contraseña." : "";
  }

  const errorCorreo = validarCorreo(correo);
  const errorContrasena = validarContrasena(contrasena);

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (cargando) return;

    setTocados({ correo: true, contrasena: true });
    setError("");

    if (errorCorreo || errorContrasena) {
      const formulario = evento.currentTarget;
      const campoId = errorCorreo ? "correo" : "contrasena";

      formulario.querySelector<HTMLInputElement>(`#${campoId}`)?.focus();
      return;
    }

    const formulario = evento.currentTarget;

    if (!formulario.reportValidity()) return;

    setCargando(true);

    try {
      const sesion = await iniciarSesion({
        correo: correo.trim(),
        contrasena,
      });

      onLogin(sesion);
    } catch (fallo: unknown) {
      setError(
        fallo instanceof Error
          ? fallo.message
          : "No se pudo iniciar sesión. Inténtalo nuevamente.",
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

          <form
            className="login-page__formulario"
            onSubmit={manejarEnvio}
            noValidate
            aria-busy={cargando}
          >
            <CampoEntrada
              id="correo"
              name="correo"
              etiqueta="Correo electrónico"
              type="email"
              value={correo}
              onChange={(evento) => {
                setCorreo(evento.target.value);
                setError("");
              }}
              onBlur={() => {
                setTocados((actuales) => ({ ...actuales, correo: true }));
              }}
              error={tocados.correo ? errorCorreo : ""}
              placeholder="nombre@ejemplo.com"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              disabled={cargando}
              required
            />

            <div className="login-page__contrasena">
              <CampoEntrada
                id="contrasena"
                etiqueta="Contraseña"
                type={mostrarContrasena ? "text" : "password"}
                value={contrasena}
                onChange={(evento) => setContrasena(evento.target.value)}
                placeholder="Ingresa tu contraseña"
                autoComplete="current-password"
                disabled={cargando}
                required
              />

              <button
                type="button"
                className="login-page__ver-contrasena"
                onClick={() => setMostrarContrasena((actual) => !actual)}
                aria-label={
                  mostrarContrasena
                    ? "Ocultar contraseña"
                    : "Mostrar contraseña"
                }
                aria-controls="contrasena"
                title={
                  mostrarContrasena
                    ? "Ocultar contraseña"
                    : "Mostrar contraseña"
                }
                disabled={cargando}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3" />
                  {mostrarContrasena && <path d="m3 3 18 18" />}
                </svg>
              </button>
            </div>

            {error && (
              <p className="login-page__error" role="alert">
                {error}
              </p>
            )}

            <Boton
              type="submit"
              variante="principal"
              cargando={cargando}
              textoCargando="Ingresando..."
            >
              Iniciar sesión
            </Boton>
          </form>
        </div>
      </section>
    </main>
  );
}
