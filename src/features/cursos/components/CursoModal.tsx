import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { actualizarCurso, crearCurso } from "../cursos.service";
import { obtenerDocentes } from "../../docentes/docentes.service";
import type { Curso } from "../cursos.types";
import type { Docente } from "../../docentes/docentes.types";
import { Boton } from "../../../shared/components/Boton";
import { CampoEntrada } from "../../../shared/components/CampoEntrada";
import { useValidacion } from "../../../shared/hooks/useValidacion";
import { GRADOS_POR_NIVEL } from "../../../shared/constants/academico";

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
  const guardandoRef = useRef(false);
  const id = useId();

  const [nombre, setNombre] = useState(curso?.nombre ?? "");
  const [nivel, setNivel] = useState(curso?.nivel ?? "");
  const [grado, setGrado] = useState(curso?.grado ?? "");
  const [anio, setAnio] = useState(String(curso?.anioLectivo ?? anioInicial));
  const [docenteId, setDocenteId] = useState(curso?.docenteId ?? "");

  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [cargandoDocentes, setCargandoDocentes] = useState(true);
  const [errorDocentes, setErrorDocentes] = useState("");
  const [intentoDocentes, setIntentoDocentes] = useState(0);

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [errorNivel, setErrorNivel] = useState("");
  const [errorGrado, setErrorGrado] = useState("");

  const { errores, eventos, validar } = useValidacion();

  const nombreId = `${id}-nombre`;
  const anioId = `${id}-anio`;
  const nivelId = `${id}-nivel`;
  const gradoId = `${id}-grado`;
  const docenteIdCampo = `${id}-docente`;

  const gradosDisponibles = GRADOS_POR_NIVEL[nivel] ?? [];
  const nivelAnteriorNoValido =
    nivel !== "" && !Object.hasOwn(GRADOS_POR_NIVEL, nivel);
  const gradoAnteriorNoValido =
    grado !== "" && !gradosDisponibles.includes(grado);

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
  }, [token, intentoDocentes]);

  const docentesActivos = docentes
    .filter((docente) => docente.activo)
    .sort((a, b) =>
      `${a.apellidos} ${a.nombres}`.localeCompare(
        `${b.apellidos} ${b.nombres}`,
        "es",
      ),
    );

  const docenteActual = curso?.docenteId;

  const asignadoFueraDeLista =
    Boolean(docenteActual) &&
    !docentesActivos.some((docente) => docente.id === docenteActual);

  function cerrar() {
    if (!guardandoRef.current) onCerrar();
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (guardandoRef.current || cargandoDocentes || errorDocentes !== "") {
      return;
    }

    const formulario = evento.currentTarget;

    setError("");
    setErrorNivel("");
    setErrorGrado("");

    const entradasValidas = validar(formulario);
    const nivelValido = Object.hasOwn(GRADOS_POR_NIVEL, nivel);
    const gradoValido = nivelValido && gradosDisponibles.includes(grado);

    if (!nivelValido) {
      setErrorNivel("Selecciona Inicial o Primaria.");
    }

    if (!gradoValido) {
      setErrorGrado("Selecciona un grado del nivel elegido.");
    }

    if (!entradasValidas) return;

    if (!nivelValido || !gradoValido) {
      formulario
        .querySelector<HTMLSelectElement>(
          nivelValido ? `#${CSS.escape(gradoId)}` : `#${CSS.escape(nivelId)}`,
        )
        ?.focus();

      return;
    }

    if (nombre.trim().length < 3) {
      setError("El nombre del curso debe tener al menos 3 caracteres.");
      formulario
        .querySelector<HTMLInputElement>(`#${CSS.escape(nombreId)}`)
        ?.focus();
      return;
    }

    const anioNumero = Number(anio);

    if (!Number.isInteger(anioNumero) || anioNumero < 1 || anioNumero > 9999) {
      setError("Ingresa un año lectivo válido.");
      return;
    }

    if (!formulario.reportValidity()) return;

    guardandoRef.current = true;
    setGuardando(true);

    try {
      const datos = {
        nombre: nombre.trim(),
        nivel,
        grado,
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
      guardandoRef.current = false;
      setGuardando(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="cursos__modal"
      aria-labelledby={`${id}-titulo`}
      aria-describedby={`${id}-descripcion`}
      onCancel={(evento) => {
        evento.preventDefault();
        cerrar();
      }}
    >
      <form
        className="cursos__formulario"
        onSubmit={guardar}
        onChange={() => setError("")}
        aria-busy={guardando}
        noValidate
        {...eventos}
      >
        <h2 id={`${id}-titulo`}>
          {curso ? "Editar curso" : "Registrar curso"}
        </h2>

        <p id={`${id}-descripcion`}>
          Selecciona el nivel y grado correspondientes a las matrículas. La
          asignación de docente es opcional.
        </p>

        <fieldset disabled={guardando}>
          <legend>Datos del curso</legend>

          <div className="cursos__form-grid">
            <CampoEntrada
              id={nombreId}
              etiqueta="Nombre del curso"
              value={nombre}
              onChange={(evento) => setNombre(evento.target.value)}
              minLength={3}
              maxLength={100}
              error={errores[nombreId]}
              autoFocus
              required
            />

            <CampoEntrada
              id={anioId}
              etiqueta="Año lectivo"
              type="number"
              value={anio}
              onChange={(evento) => setAnio(evento.target.value)}
              min={1}
              max={9999}
              step={1}
              error={errores[anioId]}
              required
            />

            <div className="campo">
              <label htmlFor={nivelId}>Nivel</label>

              <select
                id={nivelId}
                className="campo__entrada"
                value={nivel}
                onChange={(evento) => {
                  setNivel(evento.target.value);
                  setGrado("");
                  setErrorNivel("");
                  setErrorGrado("");
                }}
                aria-invalid={errorNivel ? true : undefined}
                aria-describedby={errorNivel ? `${nivelId}-error` : undefined}
                required
              >
                <option value="">Selecciona un nivel</option>

                {nivelAnteriorNoValido && (
                  <option value={nivel} disabled>
                    {nivel} — valor anterior
                  </option>
                )}

                <option value="INICIAL">Inicial</option>
                <option value="PRIMARIA">Primaria</option>
              </select>

              {errorNivel && (
                <p id={`${nivelId}-error`} className="campo__error">
                  {errorNivel}
                </p>
              )}
            </div>

            <div className="campo">
              <label htmlFor={gradoId}>Grado</label>

              <select
                id={gradoId}
                className="campo__entrada"
                value={grado}
                onChange={(evento) => {
                  setGrado(evento.target.value);
                  setErrorGrado("");
                }}
                disabled={gradosDisponibles.length === 0}
                aria-invalid={errorGrado ? true : undefined}
                aria-describedby={[
                  `${gradoId}-ayuda`,
                  errorGrado ? `${gradoId}-error` : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                required
              >
                <option value="">
                  {gradosDisponibles.length > 0
                    ? "Selecciona un grado"
                    : "Selecciona primero el nivel"}
                </option>

                {gradoAnteriorNoValido && (
                  <option value={grado} disabled>
                    {grado} — valor anterior
                  </option>
                )}

                {gradosDisponibles.map((valor) => (
                  <option key={valor} value={valor}>
                    {valor}
                  </option>
                ))}
              </select>

              <p id={`${gradoId}-ayuda`} className="campo__ayuda">
                Usa el mismo grado que figura en la matrícula.
              </p>

              {errorGrado && (
                <p id={`${gradoId}-error`} className="campo__error">
                  {errorGrado}
                </p>
              )}
            </div>

            <div className="campo">
              <label htmlFor={docenteIdCampo}>
                Docente asignado (opcional)
              </label>

              <select
                id={docenteIdCampo}
                className="campo__entrada"
                value={docenteId}
                onChange={(evento) => setDocenteId(evento.target.value)}
                disabled={cargandoDocentes || errorDocentes !== ""}
                aria-describedby={`${docenteIdCampo}-ayuda`}
              >
                <option value="">Sin asignar</option>

                {asignadoFueraDeLista && docenteActual && (
                  <option value={docenteActual} disabled>
                    {curso?.nombresDocente ?? "Docente actual"} (asignado)
                  </option>
                )}

                {docentesActivos.map((docente) => (
                  <option key={docente.id} value={docente.id}>
                    {docente.apellidos}, {docente.nombres}
                  </option>
                ))}
              </select>

              <p id={`${docenteIdCampo}-ayuda`} className="campo__ayuda">
                Puedes asignarlo posteriormente.
              </p>
            </div>
          </div>
        </fieldset>

        {cargandoDocentes && (
          <p role="status">Cargando docentes disponibles...</p>
        )}

        {errorDocentes && (
          <div className="estado-listado">
            <p role="alert">{errorDocentes}</p>

            <Boton
              onClick={() => setIntentoDocentes((actual) => actual + 1)}
              disabled={guardando}
            >
              Reintentar carga de docentes
            </Boton>
          </div>
        )}

        {error && <p role="alert">{error}</p>}

        <div className="cursos__acciones">
          <Boton onClick={cerrar} disabled={guardando}>
            Cancelar
          </Boton>

          <Boton
            type="submit"
            variante="principal"
            cargando={guardando}
            textoCargando="Guardando..."
            disabled={cargandoDocentes || errorDocentes !== ""}
          >
            {curso ? "Guardar cambios" : "Registrar curso"}
          </Boton>
        </div>
      </form>
    </dialog>
  );
}
