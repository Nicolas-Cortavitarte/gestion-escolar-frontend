import { Fragment, useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { obtenerCursos, obtenerMisCursos } from "../../cursos/cursos.service";
import { obtenerCompetenciasPorCurso } from "../../competencias/competencias.service";
import type { Curso } from "../../cursos/cursos.types";
import type { EstudianteCurso } from "../../cursos/cursos.types";
import type { NotaCualitativa } from "../../boletas/boletas.types";
import {
  obtenerReportesConducta,
  guardarReporteConducta,
  obtenerEvaluacionesPadre,
  guardarEvaluacionPadre,
} from "../../boletas/registro-boleta.service";
import {
  obtenerNotasPorBimestre,
  guardarNotaCompetencia,
} from "../notas.service";
import type { Bimestre } from "../notas.types";
import { Boton } from "../../../shared/components/Boton";
import { CampoEntrada } from "../../../shared/components/CampoEntrada";
import "../../../styles/listados.css";
import "../components/RegistroNotasModal.css";

interface RegistroNotasModalProps {
  token: string;
  matricula: EstudianteCurso;
  onCerrar: (huboCambios: boolean) => void;
  modo?: "admin" | "docente";
  cursoInicialId?: string;
}

type Pestaña = "notas" | "conducta" | "padre";
type Valores = Record<string, string>;

interface Campo {
  clave: string;
  etiqueta: string;
  tipo: "nota" | "numero" | "texto";
}

const criteriosConducta: Campo[] = [
  {
    clave: "conductaPuntualidadRespeto",
    etiqueta: "Puntualidad y respeto",
    tipo: "nota",
  },
  {
    clave: "conductaActitudAula",
    etiqueta: "Actitud en el aula",
    tipo: "nota",
  },
  {
    clave: "conductaPresentacionAseo",
    etiqueta: "Presentación y aseo",
    tipo: "nota",
  },
];

const camposAsistencia: Campo[] = [
  {
    clave: "inasistenciasJustificadas",
    etiqueta: "Inasistencias justificadas",
    tipo: "numero",
  },
  {
    clave: "inasistenciasInjustificadas",
    etiqueta: "Inasistencias injustificadas",
    tipo: "numero",
  },
  {
    clave: "tardanzasJustificadas",
    etiqueta: "Tardanzas justificadas",
    tipo: "numero",
  },
  {
    clave: "tardanzasInjustificadas",
    etiqueta: "Tardanzas injustificadas",
    tipo: "numero",
  },
];

const camposConducta: Campo[] = [
  ...criteriosConducta,
  ...camposAsistencia,
  {
    clave: "apreciacionTutor",
    etiqueta: "Apreciación del tutor",
    tipo: "texto",
  },
];

const camposPadre: Campo[] = [
  {
    clave: "enviaPuntualmenteHijo",
    etiqueta: "Envía puntualmente a su hijo",
    tipo: "nota",
  },
  {
    clave: "apoyaTareasCasa",
    etiqueta: "Apoya las tareas en casa",
    tipo: "nota",
  },
  {
    clave: "enviaHijoUniformado",
    etiqueta: "Envía a su hijo uniformado",
    tipo: "nota",
  },
  {
    clave: "asisteReunionesColegio",
    etiqueta: "Asiste a las reuniones del colegio",
    tipo: "nota",
  },
  {
    clave: "cumplePagosInstitucion",
    etiqueta: "Cumple los pagos de la institución",
    tipo: "nota",
  },
];

const pestañas: { id: Pestaña; etiqueta: string }[] = [
  { id: "notas", etiqueta: "Notas" },
  { id: "conducta", etiqueta: "Conducta y asistencia" },
  { id: "padre", etiqueta: "Evaluación del padre" },
];

const notasDisponibles = ["AD", "A", "B", "C"] as const;

function mensajeError(fallo: unknown) {
  return fallo instanceof Error
    ? fallo.message
    : "No se pudo completar la operación.";
}

function convertirNota(valor: string | undefined): NotaCualitativa | null {
  if (!valor) return null;

  if (valor === "AD" || valor === "A" || valor === "B" || valor === "C") {
    return valor;
  }

  throw new Error("La calificación seleccionada no es válida.");
}

function validarCampo(campo: Campo, valor: string) {
  if (campo.tipo === "numero") {
    const numero = Number(valor);

    if (
      valor.trim() === "" ||
      !Number.isSafeInteger(numero) ||
      numero < 0 ||
      numero > 2147483647
    ) {
      return "Ingresa un número entero desde 0 hasta 2147483647.";
    }
  }

  if (campo.tipo === "texto" && valor.length > 1000) {
    return "El comentario no puede superar los 1000 caracteres.";
  }

  return "";
}

export function RegistroNotasModal({
  token,
  matricula,
  onCerrar,
  modo = "admin",
  cursoInicialId = "",
}: RegistroNotasModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const guardandoRef = useRef(false);
  const huboCambiosRef = useRef(false);
  const revisadosRef = useRef(new Set<string>());
  const id = useId();

  const [pestaña, setPestaña] = useState<Pestaña>("notas");
  const [bimestre, setBimestre] = useState<Bimestre>(1);
  const [cursoId, setCursoId] = useState(cursoInicialId);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cargandoCursos, setCargandoCursos] = useState(true);
  const [errorCursos, setErrorCursos] = useState("");
  const [intentoCursos, setIntentoCursos] = useState(0);

  const [campos, setCampos] = useState<Campo[]>([]);
  const [valores, setValores] = useState<Valores>({});
  const [originales, setOriginales] = useState<Valores>({});
  const [erroresCampos, setErroresCampos] = useState<Valores>({});
  const [cargando, setCargando] = useState(cursoInicialId !== "");
  const [errorCarga, setErrorCarga] = useState("");
  const [intentoRegistros, setIntentoRegistros] = useState(0);

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const cantidadPendientes = campos.filter(
    ({ clave }) => valores[clave] !== originales[clave],
  ).length;

  const hayPendientes = cantidadPendientes > 0;

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

    const solicitud =
      modo === "docente" ? obtenerMisCursos(token) : obtenerCursos(token);

    solicitud
      .then((datos) => {
        if (!activo) return;

        setCursos(
          datos
            .filter(
              (curso) =>
                curso.anioLectivo === matricula.anioLectivo &&
                curso.nivel === matricula.nivel &&
                curso.grado === matricula.grado,
            )
            .sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
        );
        setErrorCursos("");
      })
      .catch((fallo: unknown) => {
        if (activo) setErrorCursos(mensajeError(fallo));
      })
      .finally(() => {
        if (activo) setCargandoCursos(false);
      });

    return () => {
      activo = false;
    };
  }, [
    token,
    modo,
    matricula.anioLectivo,
    matricula.nivel,
    matricula.grado,
    intentoCursos,
  ]);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        let lista: Campo[];
        const datos: Valores = {};

        if (pestaña === "notas") {
          if (!cursoId) return;

          const [competencias, notas] = await Promise.all([
            obtenerCompetenciasPorCurso(token, cursoId),
            obtenerNotasPorBimestre(token, matricula.estudianteId, bimestre),
          ]);

          lista = competencias.map((competencia) => ({
            clave: competencia.id,
            etiqueta: competencia.nombreCompetencia,
            tipo: "nota",
          }));

          for (const campo of lista) {
            datos[campo.clave] =
              notas.find((nota) => nota.competenciaId === campo.clave)
                ?.calificativo ?? "";
          }
        } else if (pestaña === "conducta") {
          const registros = await obtenerReportesConducta(
            token,
            matricula.estudianteId,
            matricula.anioLectivo,
          );

          const registro = registros.find((item) => item.bimestre === bimestre);

          lista = camposConducta;

          datos.conductaPuntualidadRespeto =
            registro?.conductaPuntualidadRespeto ?? "";
          datos.conductaActitudAula = registro?.conductaActitudAula ?? "";
          datos.conductaPresentacionAseo =
            registro?.conductaPresentacionAseo ?? "";
          datos.inasistenciasJustificadas = String(
            registro?.inasistenciasJustificadas ?? 0,
          );
          datos.inasistenciasInjustificadas = String(
            registro?.inasistenciasInjustificadas ?? 0,
          );
          datos.tardanzasJustificadas = String(
            registro?.tardanzasJustificadas ?? 0,
          );
          datos.tardanzasInjustificadas = String(
            registro?.tardanzasInjustificadas ?? 0,
          );
          datos.apreciacionTutor = registro?.apreciacionTutor ?? "";
        } else {
          const registros = await obtenerEvaluacionesPadre(
            token,
            matricula.estudianteId,
            matricula.anioLectivo,
          );

          const registro = registros.find((item) => item.bimestre === bimestre);

          lista = camposPadre;

          datos.enviaPuntualmenteHijo = registro?.enviaPuntualmenteHijo ?? "";
          datos.apoyaTareasCasa = registro?.apoyaTareasCasa ?? "";
          datos.enviaHijoUniformado = registro?.enviaHijoUniformado ?? "";
          datos.asisteReunionesColegio = registro?.asisteReunionesColegio ?? "";
          datos.cumplePagosInstitucion = registro?.cumplePagosInstitucion ?? "";
        }

        if (!activo) return;

        setCampos(lista);
        setValores(datos);
        setOriginales({ ...datos });
      } catch (fallo: unknown) {
        if (activo) setErrorCarga(mensajeError(fallo));
      } finally {
        if (activo) setCargando(false);
      }
    }

    void cargar();

    return () => {
      activo = false;
    };
  }, [
    token,
    matricula.estudianteId,
    matricula.anioLectivo,
    pestaña,
    bimestre,
    cursoId,
    intentoRegistros,
  ]);

  function permitirCambio() {
    if (guardandoRef.current) return false;

    if (hayPendientes) {
      setError("Guarda o descarta los cambios pendientes antes de continuar.");
      return false;
    }

    return true;
  }

  function prepararCarga(activa: boolean) {
    setCampos([]);
    setValores({});
    setOriginales({});
    setErroresCampos({});
    revisadosRef.current.clear();
    setErrorCarga("");
    setError("");
    setMensaje("");
    setCargando(activa);
  }

  function cambiarPestaña(nueva: Pestaña) {
    if (nueva === pestaña || !permitirCambio()) return;

    prepararCarga(nueva !== "notas" || cursoId !== "");
    setPestaña(nueva);
  }

  function cambiarBimestre(nuevo: Bimestre) {
    if (nuevo === bimestre || !permitirCambio()) return;

    prepararCarga(pestaña !== "notas" || cursoId !== "");
    setBimestre(nuevo);
  }

  function cambiarCurso(nuevo: string) {
    if (nuevo === cursoId || !permitirCambio()) return;

    prepararCarga(nuevo !== "");
    setCursoId(nuevo);
  }

  function cerrar() {
    if (permitirCambio()) onCerrar(huboCambiosRef.current);
  }

  function descartar() {
    if (guardandoRef.current) return;

    setValores({ ...originales });
    setErroresCampos({});
    revisadosRef.current.clear();
    setError("");
    setMensaje("");
  }

  function actualizarValor(campo: Campo, valor: string) {
    setValores((actuales) => ({
      ...actuales,
      [campo.clave]: valor,
    }));
    setError("");
    setMensaje("");

    if (revisadosRef.current.has(campo.clave)) {
      setErroresCampos((actuales) => ({
        ...actuales,
        [campo.clave]: validarCampo(campo, valor),
      }));
    }
  }

  function revisarCampo(campo: Campo) {
    revisadosRef.current.add(campo.clave);

    setErroresCampos((actuales) => ({
      ...actuales,
      [campo.clave]: validarCampo(campo, valores[campo.clave] ?? ""),
    }));
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (guardandoRef.current || cargando || !hayPendientes) return;

    const formulario = evento.currentTarget;
    const errores: Valores = {};

    for (const campo of campos) {
      const detalle = validarCampo(campo, valores[campo.clave] ?? "");

      revisadosRef.current.add(campo.clave);
      if (detalle) errores[campo.clave] = detalle;
    }

    setErroresCampos(errores);
    setError("");
    setMensaje("");

    const primeraClave = Object.keys(errores)[0];

    if (primeraClave) {
      const control = formulario.elements.namedItem(primeraClave);

      if (control instanceof HTMLElement) control.focus();
      return;
    }

    guardandoRef.current = true;
    setGuardando(true);

    let notasGuardadas = 0;

    try {
      if (pestaña === "notas") {
        const cambios = campos.filter(
          ({ clave }) => valores[clave] !== originales[clave],
        );

        if (cambios.some(({ clave }) => !valores[clave])) {
          throw new Error(
            "No se puede eliminar una nota desde este formulario.",
          );
        }

        for (const campo of cambios) {
          const calificativo = convertirNota(valores[campo.clave]);

          if (!calificativo) {
            throw new Error("Selecciona una calificación.");
          }

          const guardada = await guardarNotaCompetencia(
            token,
            matricula.estudianteId,
            {
              competenciaId: campo.clave,
              bimestre,
              calificativo,
            },
          );

          huboCambiosRef.current = true;
          notasGuardadas += 1;

          setOriginales((actuales) => ({
            ...actuales,
            [campo.clave]: guardada.calificativo,
          }));

          setValores((actuales) => ({
            ...actuales,
            [campo.clave]: guardada.calificativo,
          }));
        }

        setMensaje(
          `${notasGuardadas} ${
            notasGuardadas === 1 ? "nota guardada" : "notas guardadas"
          } correctamente.`,
        );
      } else if (pestaña === "conducta") {
        await guardarReporteConducta(token, matricula.estudianteId, {
          anioLectivo: matricula.anioLectivo,
          bimestre,
          conductaPuntualidadRespeto: convertirNota(
            valores.conductaPuntualidadRespeto,
          ),
          conductaActitudAula: convertirNota(valores.conductaActitudAula),
          conductaPresentacionAseo: convertirNota(
            valores.conductaPresentacionAseo,
          ),
          inasistenciasJustificadas: Number(valores.inasistenciasJustificadas),
          inasistenciasInjustificadas: Number(
            valores.inasistenciasInjustificadas,
          ),
          tardanzasJustificadas: Number(valores.tardanzasJustificadas),
          tardanzasInjustificadas: Number(valores.tardanzasInjustificadas),
          apreciacionTutor: valores.apreciacionTutor?.trim() || null,
        });

        huboCambiosRef.current = true;
        setOriginales({ ...valores });
        setMensaje("Conducta y asistencia guardadas correctamente.");
      } else {
        await guardarEvaluacionPadre(token, matricula.estudianteId, {
          anioLectivo: matricula.anioLectivo,
          bimestre,
          enviaPuntualmenteHijo: convertirNota(valores.enviaPuntualmenteHijo),
          apoyaTareasCasa: convertirNota(valores.apoyaTareasCasa),
          enviaHijoUniformado: convertirNota(valores.enviaHijoUniformado),
          asisteReunionesColegio: convertirNota(valores.asisteReunionesColegio),
          cumplePagosInstitucion: convertirNota(valores.cumplePagosInstitucion),
        });

        huboCambiosRef.current = true;
        setOriginales({ ...valores });
        setMensaje("Evaluación del padre guardada correctamente.");
      }
    } catch (fallo: unknown) {
      const detalle = mensajeError(fallo);

      setError(
        notasGuardadas > 0
          ? `Se guardaron ${notasGuardadas} notas. ${detalle} Las restantes siguen pendientes.`
          : detalle,
      );
    } finally {
      guardandoRef.current = false;
      setGuardando(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="registro-evaluaciones"
      aria-labelledby={`${id}-titulo`}
      aria-describedby={`${id}-estudiante`}
      onCancel={(evento) => {
        evento.preventDefault();
        cerrar();
      }}
    >
      <h2 id={`${id}-titulo`}>Registrar evaluaciones</h2>

      <p id={`${id}-estudiante`}>
        {matricula.nombreEstudiante} —{" "}
        {matricula.nivel === "INICIAL" ? "Inicial" : "Primaria"}{" "}
        {matricula.grado} · {matricula.anioLectivo}
      </p>

      <div className="registro-evaluaciones__campo">
        <label htmlFor={`${id}-bimestre`}>Bimestre</label>
        <select
          id={`${id}-bimestre`}
          value={bimestre}
          disabled={guardando}
          onChange={(evento) =>
            cambiarBimestre(Number(evento.target.value) as Bimestre)
          }
        >
          {[1, 2, 3, 4].map((valor) => (
            <option key={valor} value={valor}>
              Bimestre {valor}
            </option>
          ))}
        </select>
      </div>

      <div
        className="registro-evaluaciones__pestanas"
        role="group"
        aria-label="Apartados de evaluación"
      >
        {pestañas.map(({ id: clave, etiqueta }) => (
          <button
            key={clave}
            type="button"
            aria-pressed={pestaña === clave}
            aria-controls={`${id}-contenido`}
            disabled={guardando}
            onClick={() => cambiarPestaña(clave)}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      <section
        id={`${id}-contenido`}
        aria-label={pestañas.find((item) => item.id === pestaña)?.etiqueta}
        aria-busy={cargando || guardando}
      >
        {pestaña === "notas" && (
          <>
            {cargandoCursos && <p role="status">Cargando cursos...</p>}

            {errorCursos && (
              <div className="estado-listado">
                <p role="alert">{errorCursos}</p>
                <Boton
                  onClick={() => {
                    setErrorCursos("");
                    setCargandoCursos(true);
                    setIntentoCursos((actual) => actual + 1);
                  }}
                  disabled={guardando || cargandoCursos}
                >
                  Reintentar carga de cursos
                </Boton>
              </div>
            )}

            {!cargandoCursos && !errorCursos && (
              <div className="registro-evaluaciones__campo">
                <label htmlFor={`${id}-curso`}>Curso</label>

                <select
                  id={`${id}-curso`}
                  value={cursoId}
                  disabled={guardando || cursos.length === 0}
                  onChange={(evento) => cambiarCurso(evento.target.value)}
                >
                  <option value="">Selecciona un curso</option>
                  {cursos.map((curso) => (
                    <option key={curso.id} value={curso.id}>
                      {curso.nombre}
                    </option>
                  ))}
                </select>

                {cursos.length === 0 && (
                  <p>No hay cursos configurados para esta matrícula.</p>
                )}
              </div>
            )}
          </>
        )}

        {cargando && <p role="status">Cargando registros...</p>}

        {errorCarga && (
          <div className="estado-listado">
            <p role="alert">{errorCarga}</p>
            <Boton
              onClick={() => {
                prepararCarga(true);
                setIntentoRegistros((actual) => actual + 1);
              }}
              disabled={guardando || cargando}
            >
              Reintentar carga
            </Boton>
          </div>
        )}

        {!cargando && !errorCarga && (
          <>
            {pestaña === "notas" && !cursoId && cursos.length > 0 && (
              <p className="registro-evaluaciones__ayuda">
                Selecciona un curso para consultar sus competencias.
              </p>
            )}

            {pestaña === "notas" && cursoId && campos.length === 0 && (
              <p>Este curso no tiene competencias registradas.</p>
            )}

            {campos.length > 0 && (
              <form onSubmit={guardar} noValidate aria-busy={guardando}>
                <fieldset disabled={guardando}>
                  <div
                    className={`registro-evaluaciones__campos ${pestaña === "notas" ? "registro-evaluaciones__campos--notas" : ""}`}
                  >
                    {campos.map((campo) => {
                      const campoId = `${id}-${campo.clave}`;
                      const errorCampo = erroresCampos[campo.clave];

                      return (
                        <Fragment key={campo.clave}>
                          {pestaña === "conducta" &&
                            campo.clave === "conductaPuntualidadRespeto" && (
                              <h3 className="registro-evaluaciones__subtitulo">
                                Conducta del alumno
                              </h3>
                            )}

                          {pestaña === "conducta" &&
                            campo.clave === "inasistenciasJustificadas" && (
                              <h3 className="registro-evaluaciones__subtitulo">
                                Asistencia y tardanzas
                              </h3>
                            )}

                          {pestaña === "conducta" &&
                            campo.clave === "apreciacionTutor" && (
                              <h3 className="registro-evaluaciones__subtitulo">
                                Comentarios del tutor
                              </h3>
                            )}

                          {campo.tipo === "numero" ? (
                            <CampoEntrada
                              id={campoId}
                              name={campo.clave}
                              etiqueta={campo.etiqueta}
                              type="number"
                              inputMode="numeric"
                              min={0}
                              max={2147483647}
                              step={1}
                              required
                              value={valores[campo.clave] ?? "0"}
                              error={errorCampo}
                              onBlur={() => revisarCampo(campo)}
                              onChange={(evento) =>
                                actualizarValor(campo, evento.target.value)
                              }
                            />
                          ) : (
                            <div
                              className={`registro-evaluaciones__campo ${
                                campo.tipo === "texto"
                                  ? "registro-evaluaciones__campo--completo"
                                  : ""
                              }`}
                            >
                              <label htmlFor={campoId}>{campo.etiqueta}</label>

                              {campo.tipo === "nota" ? (
                                <select
                                  id={campoId}
                                  name={campo.clave}
                                  value={valores[campo.clave] ?? ""}
                                  onChange={(evento) =>
                                    actualizarValor(campo, evento.target.value)
                                  }
                                >
                                  <option
                                    value=""
                                    disabled={
                                      pestaña === "notas" &&
                                      Boolean(originales[campo.clave])
                                    }
                                  >
                                    Sin evaluar
                                  </option>

                                  {notasDisponibles.map((nota) => (
                                    <option key={nota} value={nota}>
                                      {nota}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <>
                                  <textarea
                                    id={campoId}
                                    name={campo.clave}
                                    rows={4}
                                    maxLength={1000}
                                    value={valores[campo.clave] ?? ""}
                                    onBlur={() => revisarCampo(campo)}
                                    onChange={(evento) =>
                                      actualizarValor(
                                        campo,
                                        evento.target.value,
                                      )
                                    }
                                    aria-invalid={errorCampo ? true : undefined}
                                    aria-describedby={[
                                      `${campoId}-ayuda`,
                                      errorCampo ? `${campoId}-error` : "",
                                    ]
                                      .filter(Boolean)
                                      .join(" ")}
                                  />

                                  <p
                                    id={`${campoId}-ayuda`}
                                    className="campo__ayuda"
                                  >
                                    Opcional. Máximo 1000 caracteres.
                                  </p>

                                  {errorCampo && (
                                    <p
                                      id={`${campoId}-error`}
                                      className="campo__error"
                                    >
                                      {errorCampo}
                                    </p>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </Fragment>
                      );
                    })}
                  </div>
                </fieldset>

                {pestaña === "conducta" && (
                  <p className="registro-evaluaciones__ayuda">
                    La calificación del bimestre se calcula automáticamente
                    cuando los tres criterios de conducta están evaluados.
                  </p>
                )}

                <div className="registro-evaluaciones__acciones">
                  <Boton
                    type="submit"
                    variante="principal"
                    cargando={guardando}
                    textoCargando="Guardando..."
                    disabled={!hayPendientes}
                  >
                    {pestaña === "notas"
                      ? "Guardar notas"
                      : pestaña === "conducta"
                        ? "Guardar conducta y asistencia"
                        : "Guardar evaluación del padre"}
                  </Boton>
                </div>
              </form>
            )}
          </>
        )}
      </section>

      {hayPendientes && (
        <p className="registro-evaluaciones__pendientes">
          {cantidadPendientes}{" "}
          {cantidadPendientes === 1
            ? "campo con cambios pendientes."
            : "campos con cambios pendientes."}
        </p>
      )}

      {error && <p role="alert">{error}</p>}
      {mensaje && <p role="status">{mensaje}</p>}

      <footer className="registro-evaluaciones__acciones">
        {hayPendientes && (
          <Boton disabled={guardando} onClick={descartar}>
            Descartar cambios pendientes
          </Boton>
        )}

        <Boton disabled={guardando} onClick={cerrar}>
          Cerrar
        </Boton>
      </footer>
    </dialog>
  );
}
