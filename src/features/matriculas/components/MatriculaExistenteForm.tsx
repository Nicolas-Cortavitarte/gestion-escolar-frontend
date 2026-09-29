import { useState, type FormEvent } from "react";
import { buscarEstudiantePorDni } from "../../estudiantes/estudiantes.service";
import type { Estudiante } from "../../estudiantes/estudiantes.types";
import { crearMatricula } from "../matriculas.service";
import "./InscripcionForm.css";

interface MatriculaExistenteFormProps {
  token: string;
}

export function MatriculaExistenteForm({ token }: MatriculaExistenteFormProps) {
  const [dni, setDni] = useState("");
  const [estudiante, setEstudiante] = useState<Estudiante | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [registrada, setRegistrada] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [nivel, setNivel] = useState("");
  const [grado, setGrado] = useState("");
  const [montoMatricula, setMontoMatricula] = useState("");
  const [montoPensionMensual, setMontoPensionMensual] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const anioLectivo = new Date().getFullYear();

  const bloqueado = guardando || registrada;

  async function buscar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (buscando || bloqueado) return;

    setError("");
    setEstudiante(null);

    if (!/^\d{8}$/.test(dni)) {
      setError("El DNI debe tener 8 dígitos.");
      return;
    }

    setBuscando(true);

    try {
      setEstudiante(await buscarEstudiantePorDni(token, dni));
    } catch (fallo) {
      setError(
        fallo instanceof Error ? fallo.message : "Error al buscar estudiante.",
      );
    } finally {
      setBuscando(false);
    }
  }

  async function registrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!estudiante || buscando || bloqueado) return;

    const monto = Number(montoMatricula);
    const pension = Number(montoPensionMensual);
    const dia = Number(fechaVencimiento);

    if (
      !nivel ||
      !grado.trim() ||
      !Number.isFinite(monto) ||
      !Number.isFinite(pension) ||
      monto <= 0 ||
      pension <= 0 ||
      !Number.isInteger(dia) ||
      dia < 1 ||
      dia > 31
    ) {
      setError("Revisa el nivel, grado, montos y día de vencimiento.");
      return;
    }

    setError("");
    setMensaje("");
    setGuardando(true);

    try {
      await crearMatricula(token, {
        estudianteId: estudiante.id,
        anioLectivo,
        nivel,
        grado: grado.trim(),
        montoMatricula: monto,
        montoPensionMensual: pension,
        fechaVencimiento: dia,
      });

      setRegistrada(true);
      setMensaje(
        `Matrícula registrada para ${estudiante.nombres} ${estudiante.apellidos}.`,
      );
    } catch (fallo) {
      setError(
        fallo instanceof Error
          ? fallo.message
          : "Error al registrar matrícula.",
      );
    } finally {
      setGuardando(false);
    }
  }

  function nuevaMatricula() {
    setDni("");
    setEstudiante(null);
    setNivel("");
    setGrado("");
    setMontoMatricula("");
    setMontoPensionMensual("");
    setFechaVencimiento("");
    setError("");
    setMensaje("");
    setRegistrada(false);
  }

  return (
    <div className="inscripcion">
      <form className="inscripcion__tarjeta" onSubmit={buscar}>
        <h2>Matricular estudiante registrado</h2>

        <label htmlFor="matricula-estudiante-dni">DNI del estudiante</label>
        <input
          id="matricula-estudiante-dni"
          value={dni}
          onChange={(evento) => {
            setDni(evento.target.value.replace(/\D/g, "").slice(0, 8));
            setEstudiante(null);
            setError("");
          }}
          inputMode="numeric"
          pattern="[0-9]{8}"
          maxLength={8}
          disabled={buscando || bloqueado}
          required
        />

        <button
          type="submit"
          className="inscripcion__boton-secundario"
          disabled={buscando || bloqueado}
        >
          {buscando ? "Buscando..." : "Buscar estudiante"}
        </button>

        {estudiante && (
          <p>
            Estudiante: {estudiante.nombres} {estudiante.apellidos}
          </p>
        )}
      </form>

      {estudiante && (
        <form
          className="inscripcion__tarjeta"
          onSubmit={registrar}
          style={{ marginTop: 20 }}
        >
          <h2>Configuración de matrícula</h2>
          <p>Año lectivo: {anioLectivo}</p>

          <label htmlFor="existente-nivel">Nivel</label>
          <select
            id="existente-nivel"
            value={nivel}
            onChange={(evento) => {
              setNivel(evento.target.value);
              setGrado("");
            }}
            disabled={bloqueado}
            required
          >
            <option value="">Selecciona un nivel</option>
            <option value="INICIAL">Inicial</option>
            <option value="PRIMARIA">Primaria</option>
          </select>

          <label htmlFor="existente-grado">Grado</label>
          <input
            id="existente-grado"
            value={grado}
            onChange={(evento) => setGrado(evento.target.value)}
            disabled={bloqueado}
            required
          />

          <label htmlFor="existente-matricula">Monto de matrícula (S/)</label>
          <input
            id="existente-matricula"
            type="number"
            min="0.01"
            step="0.01"
            value={montoMatricula}
            onChange={(evento) => setMontoMatricula(evento.target.value)}
            disabled={bloqueado}
            required
          />

          <label htmlFor="existente-pension">Pensión mensual (S/)</label>
          <input
            id="existente-pension"
            type="number"
            min="0.01"
            step="0.01"
            value={montoPensionMensual}
            onChange={(evento) => setMontoPensionMensual(evento.target.value)}
            disabled={bloqueado}
            required
          />

          <label htmlFor="existente-vencimiento">Día de vencimiento</label>
          <select
            id="existente-vencimiento"
            value={fechaVencimiento}
            onChange={(evento) => setFechaVencimiento(evento.target.value)}
            disabled={bloqueado}
            required
          >
            <option value="">Selecciona un día</option>
            {Array.from({ length: 31 }, (_, indice) => indice + 1).map(
              (dia) => (
                <option key={dia} value={dia}>
                  Día {dia}
                </option>
              ),
            )}
          </select>

          <button type="submit" disabled={bloqueado}>
            {guardando
              ? "Registrando..."
              : registrada
                ? "Matrícula registrada"
                : "Registrar matrícula"}
          </button>
        </form>
      )}

      <div className="inscripcion__mensajes">
        {error && <p role="alert">{error}</p>}
        {mensaje && <p role="status">{mensaje}</p>}

        {registrada && (
          <button
            type="button"
            className="inscripcion__boton-secundario"
            onClick={nuevaMatricula}
          >
            Nueva matrícula
          </button>
        )}
      </div>
    </div>
  );
}
