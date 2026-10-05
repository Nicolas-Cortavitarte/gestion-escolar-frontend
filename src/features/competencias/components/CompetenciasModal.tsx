import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  obtenerCompetenciasPorCurso,
  crearCompetencia,
  actualizarCompetencia,
} from "../competencias.service";
import type { Competencia } from "../competencias.types";
import type { Curso } from "../../cursos/cursos.types";

interface CompetenciasModalProps {
  token: string;
  curso: Curso;
  onCerrar: () => void;
}

export function CompetenciasModal({
  token,
  curso,
  onCerrar,
}: CompetenciasModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const guardandoRef = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [competencias, setCompetencias] = useState<Competencia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorCarga, setErrorCarga] = useState("");
  const [errorFormulario, setErrorFormulario] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [nombre, setNombre] = useState("");
  const [editando, setEditando] = useState<Competencia | null>(null);

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

    obtenerCompetenciasPorCurso(token, curso.id)
      .then((datos) => {
        if (!activo) return;

        setCompetencias(datos);
        setErrorCarga("");
      })
      .catch((fallo: unknown) => {
        if (!activo) return;

        setErrorCarga(
          fallo instanceof Error
            ? fallo.message
            : "No se pudieron cargar las competencias.",
        );
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [token, curso.id]);

  function cancelarEdicion() {
    setEditando(null);
    setNombre("");
    setErrorFormulario("");
    setMensaje("");
    inputRef.current?.focus();
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (guardandoRef.current) return;

    setErrorFormulario("");
    setMensaje("");

    const nombreLimpio = nombre.trim();

    if (!nombreLimpio || nombreLimpio.length > 500) {
      setErrorFormulario("La competencia debe tener entre 1 y 500 caracteres.");
      return;
    }

    const existe = competencias.some(
      (competencia) =>
        competencia.id !== editando?.id &&
        competencia.nombreCompetencia.trim().toLocaleLowerCase("es") ===
          nombreLimpio.toLocaleLowerCase("es"),
    );

    if (existe) {
      setErrorFormulario("Ya existe una competencia con ese nombre.");
      return;
    }

    guardandoRef.current = true;
    setGuardando(true);

    try {
      const datos = {
        cursoId: curso.id,
        nombreCompetencia: nombreLimpio,
      };

      const guardada = editando
        ? await actualizarCompetencia(token, editando.id, datos)
        : await crearCompetencia(token, datos);

      setCompetencias((actuales) =>
        editando
          ? actuales.map((item) => (item.id === guardada.id ? guardada : item))
          : [...actuales, guardada],
      );

      setMensaje(
        editando
          ? "Competencia actualizada correctamente."
          : "Competencia registrada correctamente.",
      );
      setEditando(null);
      setNombre("");
    } catch (fallo: unknown) {
      setErrorFormulario(
        fallo instanceof Error
          ? fallo.message
          : "No se pudo guardar la competencia.",
      );
    } finally {
      guardandoRef.current = false;
      setGuardando(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="competencias-modal"
      aria-labelledby="competencias-titulo"
      onCancel={(evento) => {
        evento.preventDefault();
        if (!guardandoRef.current) onCerrar();
      }}
    >
      <header className="competencias-modal__encabezado">
        <h2 id="competencias-titulo">Competencias de {curso.nombre}</h2>
        <p>
          {curso.nivel} · {curso.grado} · {curso.anioLectivo}
        </p>
      </header>

      {cargando && <p role="status">Cargando competencias...</p>}
      {errorCarga && <p role="alert">{errorCarga}</p>}

      {!cargando && !errorCarga && (
        <>
          {competencias.length === 0 ? (
            <p>Este curso todavía no tiene competencias registradas.</p>
          ) : (
            <ul className="competencias-modal__lista">
              {competencias.map((competencia) => (
                <li key={competencia.id}>
                  <span>{competencia.nombreCompetencia}</span>
                  <button
                    type="button"
                    className="cursos__boton-secundario"
                    disabled={guardando}
                    onClick={() => {
                      setEditando(competencia);
                      setNombre(competencia.nombreCompetencia);
                      setErrorFormulario("");
                      setMensaje("");
                      inputRef.current?.focus();
                    }}
                    aria-label={`Editar competencia: ${competencia.nombreCompetencia}`}
                  >
                    Editar
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form
            className="competencias-modal__formulario"
            onSubmit={guardar}
            aria-busy={guardando}
          >
            <h3>{editando ? "Editar competencia" : "Nueva competencia"}</h3>

            <div className="competencias-modal__campo">
              <label htmlFor="competencia-nombre">
                Nombre de la competencia
              </label>
              <textarea
                ref={inputRef}
                id="competencia-nombre"
                value={nombre}
                onChange={(evento) => setNombre(evento.target.value)}
                maxLength={500}
                rows={3}
                disabled={guardando}
                required
              />
            </div>

            {errorFormulario && <p role="alert">{errorFormulario}</p>}
            {mensaje && <p role="status">{mensaje}</p>}

            <div className="competencias-modal__acciones">
              {editando && (
                <button
                  type="button"
                  className="cursos__boton-secundario"
                  onClick={cancelarEdicion}
                  disabled={guardando}
                >
                  Cancelar edición
                </button>
              )}

              <button
                type="submit"
                className="cursos__boton"
                disabled={guardando}
              >
                {guardando
                  ? "Guardando..."
                  : editando
                    ? "Guardar cambios"
                    : "Registrar competencia"}
              </button>
            </div>
          </form>
        </>
      )}

      <footer className="competencias-modal__acciones">
        <button
          type="button"
          className="cursos__boton-secundario"
          disabled={guardando}
          onClick={onCerrar}
        >
          Cerrar
        </button>
      </footer>
    </dialog>
  );
}
