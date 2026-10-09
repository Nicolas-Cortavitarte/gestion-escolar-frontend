import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  obtenerCompetenciasPorCurso,
  crearCompetencia,
  actualizarCompetencia,
} from "../competencias.service";
import type { Competencia } from "../competencias.types";
import type { Curso } from "../../cursos/cursos.types";
import { Boton } from "../../../shared/components/Boton";

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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const guardandoRef = useRef(false);
  const campoRevisadoRef = useRef(false);
  const id = useId();

  const [competencias, setCompetencias] = useState<Competencia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [intentoCarga, setIntentoCarga] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [errorCarga, setErrorCarga] = useState("");
  const [errorCampo, setErrorCampo] = useState("");
  const [errorFormulario, setErrorFormulario] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [nombre, setNombre] = useState("");
  const [editando, setEditando] = useState<Competencia | null>(null);

  const nombreId = `${id}-nombre`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const elementoAnterior =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    if (!dialog.open) dialog.showModal();

    return () => {
      dialog.close();

      if (elementoAnterior?.isConnected) {
        elementoAnterior.focus();
      }
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
  }, [token, curso.id, intentoCarga]);

  function cerrar() {
    if (!guardandoRef.current) onCerrar();
  }

  function reintentarCarga() {
    setCargando(true);
    setErrorCarga("");
    setIntentoCarga((actual) => actual + 1);
  }

  function validarNombre(valor: string) {
    const limpio = valor.trim();

    if (!limpio) {
      return "Escribe el nombre de la competencia.";
    }

    if (limpio.length > 500) {
      return "El nombre no puede superar los 500 caracteres.";
    }

    const existe = competencias.some(
      (competencia) =>
        competencia.id !== editando?.id &&
        competencia.nombreCompetencia.trim().toLocaleLowerCase("es") ===
          limpio.toLocaleLowerCase("es"),
    );

    return existe ? "Ya existe una competencia con ese nombre." : "";
  }

  function iniciarEdicion(competencia: Competencia) {
    if (guardandoRef.current) return;

    setEditando(competencia);
    setNombre(competencia.nombreCompetencia);
    setErrorCampo("");
    setErrorFormulario("");
    setMensaje("");
    campoRevisadoRef.current = false;
    inputRef.current?.focus();
  }

  function cancelarEdicion() {
    if (guardandoRef.current) return;

    setEditando(null);
    setNombre("");
    setErrorCampo("");
    setErrorFormulario("");
    setMensaje("");
    campoRevisadoRef.current = false;
    inputRef.current?.focus();
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (guardandoRef.current || cargando || errorCarga) return;

    setErrorFormulario("");
    setMensaje("");
    campoRevisadoRef.current = true;

    const errorValidacion = validarNombre(nombre);
    setErrorCampo(errorValidacion);

    if (errorValidacion) {
      inputRef.current?.focus();
      return;
    }

    const competenciaEditada = editando;

    guardandoRef.current = true;
    setGuardando(true);

    try {
      const datos = {
        cursoId: curso.id,
        nombreCompetencia: nombre.trim(),
      };

      const guardada = competenciaEditada
        ? await actualizarCompetencia(token, competenciaEditada.id, datos)
        : await crearCompetencia(token, datos);

      setCompetencias((actuales) =>
        competenciaEditada
          ? actuales.map((item) => (item.id === guardada.id ? guardada : item))
          : [...actuales, guardada],
      );

      setMensaje(
        competenciaEditada
          ? "Competencia actualizada correctamente."
          : "Competencia registrada correctamente.",
      );

      setEditando(null);
      setNombre("");
      setErrorCampo("");
      campoRevisadoRef.current = false;
    } catch (fallo: unknown) {
      setErrorFormulario(
        fallo instanceof Error
          ? fallo.message
          : "No se pudo guardar la competencia. Inténtalo nuevamente.",
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
      aria-labelledby={`${id}-titulo`}
      aria-describedby={`${id}-descripcion`}
      onCancel={(evento) => {
        evento.preventDefault();
        cerrar();
      }}
    >
      <header className="competencias-modal__encabezado">
        <h2 id={`${id}-titulo`}>Competencias de {curso.nombre}</h2>

        <p id={`${id}-descripcion`}>
          {curso.nivel === "INICIAL"
            ? "Inicial"
            : curso.nivel === "PRIMARIA"
              ? "Primaria"
              : curso.nivel}
          {" · "}
          {curso.grado}
          {" · "}
          {curso.anioLectivo}
        </p>
      </header>

      {cargando && <p role="status">Cargando competencias...</p>}

      {errorCarga && (
        <div className="estado-listado">
          <p role="alert">{errorCarga}</p>

          <Boton onClick={reintentarCarga} disabled={cargando}>
            Reintentar
          </Boton>
        </div>
      )}

      {!cargando && !errorCarga && (
        <>
          {competencias.length === 0 ? (
            <p>
              Este curso todavía no tiene competencias. Registra la primera en
              el formulario.
            </p>
          ) : (
            <ul className="competencias-modal__lista">
              {competencias.map((competencia) => (
                <li key={competencia.id}>
                  <span>{competencia.nombreCompetencia}</span>

                  <Boton
                    disabled={guardando}
                    onClick={() => iniciarEdicion(competencia)}
                    aria-label={`Editar competencia: ${competencia.nombreCompetencia}`}
                  >
                    Editar
                  </Boton>
                </li>
              ))}
            </ul>
          )}

          <form
            className="competencias-modal__formulario"
            onSubmit={guardar}
            aria-busy={guardando}
            noValidate
          >
            <h3>{editando ? "Editar competencia" : "Nueva competencia"}</h3>

            <div className="competencias-modal__campo">
              <label htmlFor={nombreId}>Nombre de la competencia</label>

              <textarea
                ref={inputRef}
                id={nombreId}
                value={nombre}
                onChange={(evento) => {
                  const valor = evento.target.value;

                  setNombre(valor);
                  setErrorFormulario("");
                  setMensaje("");

                  if (campoRevisadoRef.current) {
                    setErrorCampo(validarNombre(valor));
                  }
                }}
                onBlur={() => {
                  // Al guardar o cambiar de edición no validamos
                  // el valor anterior por la pérdida de foco.
                  if (guardandoRef.current) return;

                  campoRevisadoRef.current = true;
                  setErrorCampo(validarNombre(nombre));
                }}
                maxLength={500}
                rows={3}
                disabled={guardando}
                aria-invalid={errorCampo ? true : undefined}
                aria-describedby={[
                  `${nombreId}-ayuda`,
                  errorCampo ? `${nombreId}-error` : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                required
              />

              <p id={`${nombreId}-ayuda`} className="campo__ayuda">
                Máximo 500 caracteres.
              </p>

              {errorCampo && (
                <p id={`${nombreId}-error`} className="campo__error">
                  {errorCampo}
                </p>
              )}
            </div>

            {errorFormulario && <p role="alert">{errorFormulario}</p>}

            {mensaje && <p role="status">{mensaje}</p>}

            <div className="competencias-modal__acciones">
              {editando && (
                <Boton onClick={cancelarEdicion} disabled={guardando}>
                  Cancelar edición
                </Boton>
              )}

              <Boton
                type="submit"
                variante="principal"
                cargando={guardando}
                textoCargando="Guardando..."
              >
                {editando ? "Guardar cambios" : "Registrar competencia"}
              </Boton>
            </div>
          </form>
        </>
      )}

      <footer className="competencias-modal__acciones">
        <Boton disabled={guardando} onClick={cerrar}>
          Cerrar
        </Boton>
      </footer>
    </dialog>
  );
}
