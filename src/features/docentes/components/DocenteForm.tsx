import { useState } from "react";
import type { FormEvent } from "react";
import { actualizarDocente, crearDocente } from "../docentes.service";
import type { Docente } from "../docentes.types";

interface DocenteFormProps {
  token: string;
  docente?: Docente;
  onGuardado: (docente: Docente) => void;
  onCancelar: () => void;
}

export function DocenteForm({
  token,
  docente,
  onGuardado,
  onCancelar,
}: DocenteFormProps) {
  const [dni, setDni] = useState(docente?.dni ?? "");
  const [nombres, setNombres] = useState(docente?.nombres ?? "");
  const [apellidos, setApellidos] = useState(docente?.apellidos ?? "");
  const [sueldo, setSueldo] = useState(
    docente ? String(docente.sueldoMensual) : "",
  );
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (guardando) return;

    setError("");

    const monto = Number(sueldo);

    if (!/^\d{8}$/.test(dni)) {
      setError("El DNI debe tener exactamente 8 dígitos.");
      return;
    }

    if (nombres.trim().length < 3 || apellidos.trim().length < 3) {
      setError("Los nombres y apellidos deben tener al menos 3 caracteres.");
      return;
    }

    if (sueldo.trim() === "" || !Number.isFinite(monto) || monto < 0) {
      setError("Ingresa un sueldo mensual válido.");
      return;
    }

    setGuardando(true);

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
          : "No se pudo guardar al docente.",
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form
      className="docentes__formulario"
      onSubmit={guardar}
      aria-busy={guardando}
    >
      <h2 id="docente-form-titulo">
        {docente ? "Editar docente" : "Registrar docente"}
      </h2>
      <p>
        {docente
          ? "Actualiza los datos personales y el sueldo mensual."
          : "Se creará también su cuenta de acceso con rol Docente."}
      </p>

      <fieldset disabled={guardando}>
        <legend>Datos del docente</legend>

        <div className="docentes__form-grid">
          <div className="docentes__campo">
            <label htmlFor="docente-dni">DNI</label>
            <input
              id="docente-dni"
              value={dni}
              onChange={(evento) => setDni(evento.target.value)}
              inputMode="numeric"
              pattern="[0-9]{8}"
              minLength={8}
              maxLength={8}
              readOnly={docente !== undefined}
              required
            />
          </div>

          <div className="docentes__campo">
            <label htmlFor="docente-sueldo">Sueldo mensual (S/)</label>
            <input
              id="docente-sueldo"
              type="number"
              value={sueldo}
              onChange={(evento) => setSueldo(evento.target.value)}
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="docentes__campo">
            <label htmlFor="docente-nombres">Nombres</label>
            <input
              id="docente-nombres"
              value={nombres}
              onChange={(evento) => setNombres(evento.target.value)}
              minLength={3}
              maxLength={100}
              autoComplete="given-name"
              autoFocus
              required
            />
          </div>

          <div className="docentes__campo">
            <label htmlFor="docente-apellidos">Apellidos</label>
            <input
              id="docente-apellidos"
              value={apellidos}
              onChange={(evento) => setApellidos(evento.target.value)}
              minLength={3}
              maxLength={100}
              autoComplete="family-name"
              required
            />
          </div>

          {!docente && (
            <>
              <div className="docentes__campo">
                <label htmlFor="docente-correo">Correo de acceso</label>
                <input
                  id="docente-correo"
                  type="email"
                  value={correo}
                  onChange={(evento) => setCorreo(evento.target.value)}
                  maxLength={100}
                  autoComplete="off"
                  required
                />
              </div>

              <div className="docentes__campo">
                <label htmlFor="docente-contrasena">Contraseña</label>
                <input
                  id="docente-contrasena"
                  type="password"
                  value={contrasena}
                  onChange={(evento) => setContrasena(evento.target.value)}
                  minLength={8}
                  maxLength={150}
                  autoComplete="new-password"
                  required
                />
              </div>
            </>
          )}
        </div>
      </fieldset>

      {error && <p role="alert">{error}</p>}

      <div className="docentes__acciones">
        <button
          type="button"
          className="docentes__boton-secundario"
          onClick={onCancelar}
          disabled={guardando}
        >
          Cancelar
        </button>

        <button type="submit" className="docentes__boton" disabled={guardando}>
          {guardando
            ? "Guardando..."
            : docente
              ? "Guardar cambios"
              : "Registrar docente"}
        </button>
      </div>
    </form>
  );
}
