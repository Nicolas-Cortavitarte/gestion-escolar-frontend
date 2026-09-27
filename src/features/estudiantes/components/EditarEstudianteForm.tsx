import { useState, type FormEvent } from "react";
import { actualizarEstudiante } from "../estudiantes.service";
import type { Estudiante } from "../estudiantes.types";

interface EditarEstudianteFormProps {
  token: string;
  estudiante: Estudiante;
  onActualizado: (estudiante: Estudiante) => void;
  onCancelar: () => void;
}

export function EditarEstudianteForm({
  token,
  estudiante,
  onActualizado,
  onCancelar,
}: EditarEstudianteFormProps) {
  const [dni, setDni] = useState(estudiante.dni);
  const [nombres, setNombres] = useState(estudiante.nombres);
  const [apellidos, setApellidos] = useState(estudiante.apellidos);
  const [fechaNacimiento, setFechaNacimiento] = useState(
    estudiante.fechaNacimiento,
  );
  const [direccion, setDireccion] = useState(estudiante.direccion ?? "");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError("");

    if (!estudiante.apoderadoId) {
      setError("El estudiante no tiene un apoderado asignado.");
      return;
    }

    setGuardando(true);

    try {
      const actualizado = await actualizarEstudiante(token, estudiante.id, {
        dni,
        nombres,
        apellidos,
        fechaNacimiento,
        direccion,
        idApoderado: estudiante.apoderadoId,
      });

      onActualizado(actualizado);
    } catch (fallo) {
      setError(
        fallo instanceof Error
          ? fallo.message
          : "Ocurrió un error al editar el estudiante.",
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar}>
      <h2>Editar estudiante</h2>

      <label htmlFor="editar-dni">DNI</label>
      <input
        id="editar-dni"
        value={dni}
        onChange={(evento) =>
          setDni(evento.target.value.replace(/\D/g, "").slice(0, 8))
        }
        inputMode="numeric"
        pattern="[0-9]{8}"
        maxLength={8}
        required
      />

      <label htmlFor="editar-nombres">Nombres</label>
      <input
        id="editar-nombres"
        value={nombres}
        onChange={(evento) => setNombres(evento.target.value)}
        required
      />

      <label htmlFor="editar-apellidos">Apellidos</label>
      <input
        id="editar-apellidos"
        value={apellidos}
        onChange={(evento) => setApellidos(evento.target.value)}
        required
      />

      <label htmlFor="editar-fecha">Fecha de nacimiento</label>
      <input
        id="editar-fecha"
        type="date"
        value={fechaNacimiento}
        onChange={(evento) => setFechaNacimiento(evento.target.value)}
        required
      />

      <label htmlFor="editar-direccion">Dirección</label>
      <input
        id="editar-direccion"
        value={direccion}
        onChange={(evento) => setDireccion(evento.target.value)}
      />

      {error && <p role="alert">{error}</p>}

      <div className="estudiantes-page__modal-actions">
        <button
          className="estudiantes-page__cancelar"
          type="button"
          onClick={onCancelar}
          disabled={guardando}
        >
          Cancelar
        </button>

        <button
          className="estudiantes-page__guardar"
          type="submit"
          disabled={guardando}
        >
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
