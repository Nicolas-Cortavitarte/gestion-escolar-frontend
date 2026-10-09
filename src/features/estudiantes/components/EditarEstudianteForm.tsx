import { useRef, useState, type FormEvent } from "react";
import { actualizarEstudiante } from "../estudiantes.service";
import type { Estudiante } from "../estudiantes.types";
import { CampoEntrada } from "../../../shared/components/CampoEntrada";
import { Boton } from "../../../shared/components/Boton";
import { useValidacion } from "../../../shared/hooks/useValidacion";

interface EditarEstudianteFormProps {
  token: string;
  estudiante: Estudiante;
  tituloId: string;
  onActualizado: (estudiante: Estudiante) => void;
  onCancelar: () => void;
  onGuardando: (guardando: boolean) => void;
}

function fechaHoy() {
  const hoy = new Date();

  return [
    hoy.getFullYear(),
    String(hoy.getMonth() + 1).padStart(2, "0"),
    String(hoy.getDate()).padStart(2, "0"),
  ].join("-");
}

export function EditarEstudianteForm({
  token,
  estudiante,
  tituloId,
  onActualizado,
  onCancelar,
  onGuardando,
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

  const guardandoRef = useRef(false);
  const validacion = useValidacion();

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (guardandoRef.current) return;

    setError("");

    if (!validacion.validar(evento.currentTarget)) return;

    if (!estudiante.apoderadoId) {
      setError("El estudiante no tiene un apoderado asignado.");
      return;
    }

    guardandoRef.current = true;
    setGuardando(true);
    onGuardando(true);

    try {
      const actualizado = await actualizarEstudiante(token, estudiante.id, {
        dni,
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        fechaNacimiento,
        direccion: direccion.trim(),
        idApoderado: estudiante.apoderadoId,
      });

      onActualizado(actualizado);
    } catch (fallo: unknown) {
      setError(
        fallo instanceof Error
          ? fallo.message
          : "No se pudieron guardar los cambios. Inténtalo nuevamente.",
      );
    } finally {
      guardandoRef.current = false;
      setGuardando(false);
      onGuardando(false);
    }
  }

  return (
    <form
      onSubmit={guardar}
      {...validacion.eventos}
      noValidate
      aria-busy={guardando}
    >
      <h2 id={tituloId}>Editar estudiante</h2>

      <CampoEntrada
        id="editar-dni"
        name="dni"
        etiqueta="DNI"
        value={dni}
        onChange={(evento) => {
          setDni(evento.target.value.replace(/\D/g, "").slice(0, 8));
          setError("");
        }}
        inputMode="numeric"
        pattern="[0-9]{8}"
        data-mensaje-patron="El DNI debe tener 8 dígitos."
        maxLength={8}
        ayuda="Ingresa los 8 dígitos del DNI."
        error={validacion.errores["editar-dni"]}
        disabled={guardando}
        required
      />

      <CampoEntrada
        id="editar-nombres"
        name="nombres"
        etiqueta="Nombres"
        value={nombres}
        onChange={(evento) => {
          setNombres(evento.target.value);
          setError("");
        }}
        error={validacion.errores["editar-nombres"]}
        disabled={guardando}
        required
      />

      <CampoEntrada
        id="editar-apellidos"
        name="apellidos"
        etiqueta="Apellidos"
        value={apellidos}
        onChange={(evento) => {
          setApellidos(evento.target.value);
          setError("");
        }}
        error={validacion.errores["editar-apellidos"]}
        disabled={guardando}
        required
      />

      <CampoEntrada
        id="editar-fecha"
        name="fechaNacimiento"
        etiqueta="Fecha de nacimiento"
        type="date"
        max={fechaHoy()}
        value={fechaNacimiento}
        onChange={(evento) => {
          setFechaNacimiento(evento.target.value);
          setError("");
        }}
        error={validacion.errores["editar-fecha"]}
        disabled={guardando}
        required
      />

      <CampoEntrada
        id="editar-direccion"
        name="direccion"
        etiqueta="Dirección (opcional)"
        value={direccion}
        onChange={(evento) => {
          setDireccion(evento.target.value);
          setError("");
        }}
        disabled={guardando}
      />

      {error && (
        <p className="estudiantes-page__error" role="alert">
          {error}
        </p>
      )}

      <div className="estudiantes-page__modal-actions">
        <Boton onClick={onCancelar} disabled={guardando}>
          Cancelar
        </Boton>

        <Boton
          type="submit"
          variante="principal"
          cargando={guardando}
          textoCargando="Guardando..."
        >
          Guardar cambios
        </Boton>
      </div>
    </form>
  );
}
