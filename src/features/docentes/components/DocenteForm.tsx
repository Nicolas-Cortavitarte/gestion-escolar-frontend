import { useRef, useState, type FormEvent } from "react";
import { actualizarDocente, crearDocente } from "../docentes.service";
import type { Docente } from "../docentes.types";
import { CampoEntrada } from "../../../shared/components/CampoEntrada";
import { Boton } from "../../../shared/components/Boton";
import { useValidacion } from "../../../shared/hooks/useValidacion";

interface DocenteFormProps {
  token: string;
  docente?: Docente;
  tituloId: string;
  onGuardado: (docente: Docente) => void;
  onCancelar: () => void;
  onGuardando: (guardando: boolean) => void;
}

export function DocenteForm({
  token,
  docente,
  tituloId,
  onGuardado,
  onCancelar,
  onGuardando,
}: DocenteFormProps) {
  const [dni, setDni] = useState(docente?.dni ?? "");
  const [nombres, setNombres] = useState(docente?.nombres ?? "");
  const [apellidos, setApellidos] = useState(docente?.apellidos ?? "");
  const [sueldo, setSueldo] = useState(
    docente ? String(docente.sueldoMensual) : "",
  );
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const guardandoRef = useRef(false);
  const validacion = useValidacion();

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (guardandoRef.current) return;

    setError("");

    if (!validacion.validar(evento.currentTarget)) return;

    if (nombres.trim().length < 3 || apellidos.trim().length < 3) {
      setError("Los nombres y apellidos deben tener al menos 3 caracteres.");
      return;
    }

    const monto = Number(sueldo);

    if (!sueldo.trim() || !Number.isFinite(monto) || monto < 0) {
      setError("Ingresa un sueldo mensual válido.");
      return;
    }

    guardandoRef.current = true;
    setGuardando(true);
    onGuardando(true);

    try {
      const datos = {
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        sueldoMensual: monto,
      };

      const guardado = docente
        ? await actualizarDocente(token, docente.id, datos)
        : await crearDocente(token, {
            ...datos,
            dni,
            correo: correo.trim(),
            contrasena,
          });

      onGuardado(guardado);
    } catch (fallo: unknown) {
      setError(
        fallo instanceof Error
          ? fallo.message
          : "No se pudo guardar al docente. Inténtalo nuevamente.",
      );
    } finally {
      guardandoRef.current = false;
      setGuardando(false);
      onGuardando(false);
    }
  }

  return (
    <form
      className="docentes__formulario"
      onSubmit={guardar}
      {...validacion.eventos}
      onChange={() => setError("")}
      noValidate
      aria-busy={guardando}
    >
      <h2 id={tituloId}>{docente ? "Editar docente" : "Registrar docente"}</h2>

      <p>
        {docente
          ? "Actualiza los datos personales y el sueldo mensual."
          : "Registra al docente y crea su cuenta de acceso."}
      </p>

      <fieldset disabled={guardando}>
        <legend>Datos personales</legend>

        <div className="docentes__form-grid">
          <CampoEntrada
            id="docente-dni"
            etiqueta="DNI"
            value={dni}
            onChange={(evento) =>
              setDni(evento.target.value.replace(/\D/g, "").slice(0, 8))
            }
            inputMode="numeric"
            pattern="[0-9]{8}"
            data-mensaje-patron="El DNI debe tener 8 dígitos."
            maxLength={8}
            readOnly={docente !== undefined}
            ayuda={
              docente
                ? "El DNI no se modifica desde este formulario."
                : "Ingresa los 8 dígitos del DNI."
            }
            error={validacion.errores["docente-dni"]}
            autoFocus={!docente}
            required
          />

          <CampoEntrada
            id="docente-nombres"
            etiqueta="Nombres"
            value={nombres}
            onChange={(evento) => setNombres(evento.target.value)}
            minLength={3}
            maxLength={100}
            autoComplete="given-name"
            autoFocus={docente !== undefined}
            error={validacion.errores["docente-nombres"]}
            required
          />

          <CampoEntrada
            id="docente-apellidos"
            etiqueta="Apellidos"
            value={apellidos}
            onChange={(evento) => setApellidos(evento.target.value)}
            minLength={3}
            maxLength={100}
            autoComplete="family-name"
            error={validacion.errores["docente-apellidos"]}
            required
          />
        </div>
      </fieldset>

      <fieldset disabled={guardando}>
        <legend>Remuneración</legend>

        <CampoEntrada
          id="docente-sueldo"
          etiqueta="Sueldo mensual (S/)"
          type="number"
          value={sueldo}
          onChange={(evento) => setSueldo(evento.target.value)}
          min="0"
          step="0.01"
          error={validacion.errores["docente-sueldo"]}
          required
        />
      </fieldset>

      {!docente && (
        <fieldset disabled={guardando}>
          <legend>Cuenta de acceso</legend>

          <div className="docentes__form-grid">
            <CampoEntrada
              id="docente-correo"
              etiqueta="Correo de acceso"
              type="email"
              value={correo}
              onChange={(evento) => setCorreo(evento.target.value)}
              maxLength={100}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              ayuda="El docente utilizará este correo para iniciar sesión."
              error={validacion.errores["docente-correo"]}
              required
            />

            <div className="docentes__contrasena">
              <CampoEntrada
                id="docente-contrasena"
                etiqueta="Contraseña"
                type={mostrarContrasena ? "text" : "password"}
                value={contrasena}
                onChange={(evento) => setContrasena(evento.target.value)}
                minLength={8}
                maxLength={150}
                autoComplete="new-password"
                error={validacion.errores["docente-contrasena"]}
                disabled={guardando}
                required
              />

              <button
                type="button"
                className="docentes__ver-contrasena"
                onClick={() => setMostrarContrasena((actual) => !actual)}
                aria-label={
                  mostrarContrasena
                    ? "Ocultar contraseña"
                    : "Mostrar contraseña"
                }
                aria-controls="docente-contrasena"
                title={
                  mostrarContrasena
                    ? "Ocultar contraseña"
                    : "Mostrar contraseña"
                }
                disabled={guardando}
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
          </div>
        </fieldset>
      )}

      {error && (
        <p className="docentes__error" role="alert">
          {error}
        </p>
      )}

      <div className="docentes__acciones">
        <Boton onClick={onCancelar} disabled={guardando}>
          Cancelar
        </Boton>

        <Boton
          type="submit"
          variante="principal"
          cargando={guardando}
          textoCargando="Guardando..."
        >
          {docente ? "Guardar cambios" : "Registrar docente"}
        </Boton>
      </div>
    </form>
  );
}
