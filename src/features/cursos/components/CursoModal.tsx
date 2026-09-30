import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { actualizarCurso, crearCurso } from "../cursos.service";
import { obtenerDocentes } from "../../docentes/docentes.service";
import type { Curso } from "../cursos.types";
import type { Docente } from "../../docentes/docentes.types";

interface CursoModalProps {
  token: string;
  curso?: Curso;
  anioInicial: number;
  onGuardado: (curso: Curso) => void;
  onCerrar: () => void;
}

export function CursoModal({
  token,
  curso,
  anioInicial,
  onGuardado,
  onCerrar,
}: CursoModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [nombre, setNombre] = useState(curso?.nombre ?? "");
  const [nivel, setNivel] = useState(curso?.nivel ?? "");
  const [grado, setGrado] = useState(curso?.grado ?? "");
  const [anio, setAnio] = useState(String(curso?.anioLectivo ?? anioInicial));
  const [docenteId, setDocenteId] = useState(curso?.docenteId ?? "");
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [cargandoDocentes, setCargandoDocentes] = useState(true);
  const [errorDocentes, setErrorDocentes] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    dialog.showModal();

    return () => {
      dialog.close();
    };
  }, []);

  useEffect(() => {
    let activo = true;

    obtenerDocentes(token)
      .then((datos) => {
        if (activo) setDocentes(datos);
      })
      .catch((fallo: unknown) => {
        if (!activo) return;

        setErrorDocentes(
          fallo instanceof Error
            ? fallo.message
            : "No se pudieron cargar los docentes.",
        );
      })
      .finally(() => {
        if (activo) setCargandoDocentes(false);
      });

    return () => {
      activo = false;
    };
  }, [token]);

  const docentesActivos = docentes
    .filter((docente) => docente.activo)
    .sort((a, b) =>
      `${a.apellidos} ${a.nombres}`.localeCompare(
        `${b.apellidos} ${b.nombres}`,
        "es",
      ),
    );

  const asignadoFueraDeLista =
    curso?.docenteId != null &&
    !docentesActivos.some((docente) => docente.id === curso.docenteId);

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (guardando) return;

    setError("");

    const anioNumero = Number(anio);

    if (
      nombre.trim().length < 3 ||
      nivel.trim().length < 3 ||
      grado.trim().length < 3
    ) {
      setError("El nombre, nivel y grado deben tener al menos 3 caracteres.");
      return;
    }

    if (!Number.isInteger(anioNumero) || anioNumero < 1 || anioNumero > 9999) {
      setError("Ingresa un año lectivo válido.");
      return;
    }

    setGuardando(true);

    try {
      const datos = {
        nombre: nombre.trim(),
        nivel: nivel.trim(),
        grado: grado.trim(),
        anioLectivo: anioNumero,
        docenteId: docenteId || null,
      };

      const guardado = curso
        ? await actualizarCurso(token, curso.id, datos)
        : await crearCurso(token, datos);

      onGuardado(guardado);
    } catch (fallo: unknown) {
      setError(
        fallo instanceof Error ? fallo.message : "No se pudo guardar el curso.",
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="cursos__modal"
      aria-labelledby="curso-modal-titulo"
      onCancel={(evento) => {
        evento.preventDefault();
        if (!guardando) onCerrar();
      }}
    >
      <form
        className="cursos__formulario"
        onSubmit={guardar}
        aria-busy={guardando}
      >
        <h2 id="curso-modal-titulo">
          {curso ? "Editar curso" : "Registrar curso"}
        </h2>

        <p>Completa los datos y selecciona un docente si deseas asignarlo.</p>

        <fieldset disabled={guardando}>
          <legend>Datos del curso</legend>

          <div className="cursos__form-grid">
            <div className="cursos__campo">
              <label htmlFor="curso-nombre">Nombre</label>
              <input
                id="curso-nombre"
                value={nombre}
                onChange={(evento) => setNombre(evento.target.value)}
                minLength={3}
                maxLength={100}
                autoFocus
                required
              />
            </div>

            <div className="cursos__campo">
              <label htmlFor="curso-anio">Año lectivo</label>
              <input
                id="curso-anio"
                type="number"
                value={anio}
                onChange={(evento) => setAnio(evento.target.value)}
                min="1"
                max="9999"
                step="1"
                required
              />
            </div>

            <div className="cursos__campo">
              <label htmlFor="curso-nivel">Nivel</label>
              <input
                id="curso-nivel"
                value={nivel}
                onChange={(evento) => setNivel(evento.target.value)}
                minLength={3}
                maxLength={20}
                placeholder="Ej.: Primaria"
                required
              />
            </div>

            <div className="cursos__campo">
              <label htmlFor="curso-grado">Grado</label>
              <input
                id="curso-grado"
                value={grado}
                onChange={(evento) => setGrado(evento.target.value)}
                minLength={3}
                maxLength={50}
                placeholder="Ej.: Primero"
                required
              />
            </div>

            <div className="cursos__campo">
              <label htmlFor="curso-docente">Docente</label>
              <select
                id="curso-docente"
                value={docenteId}
                onChange={(evento) => setDocenteId(evento.target.value)}
                disabled={cargandoDocentes || errorDocentes !== ""}
              >
                <option value="">Sin asignar</option>

                {asignadoFueraDeLista && (
                  <option value={curso!.docenteId!} disabled>
                    {curso!.nombresDocente ?? "Docente actual"} (asignado)
                  </option>
                )}

                {docentesActivos.map((docente) => (
                  <option key={docente.id} value={docente.id}>
                    {docente.apellidos}, {docente.nombres}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        {cargandoDocentes && <p role="status">Cargando docentes...</p>}
        {errorDocentes && <p role="alert">{errorDocentes}</p>}
        {error && <p role="alert">{error}</p>}

        <div className="cursos__acciones">
          <button
            type="button"
            className="cursos__boton-secundario"
            onClick={onCerrar}
            disabled={guardando}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="cursos__boton"
            disabled={guardando || cargandoDocentes || errorDocentes !== ""}
          >
            {guardando
              ? "Guardando..."
              : curso
                ? "Guardar cambios"
                : "Registrar curso"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
