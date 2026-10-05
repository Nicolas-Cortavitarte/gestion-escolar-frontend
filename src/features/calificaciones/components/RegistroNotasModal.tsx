import { Fragment, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { obtenerCursos } from "../../cursos/cursos.service";
import { obtenerCompetenciasPorCurso } from "../../competencias/competencias.service";
import type { Curso } from "../../cursos/cursos.types";
import type { Matricula } from "../../matriculas/matriculas.types";
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

interface RegistroNotasModalProps {
  token: string;
  matricula: Matricula;
  onCerrar: (huboCambios: boolean) => void;
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

function mensajeError(fallo: unknown): string {
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

export function RegistroNotasModal({
  token,
  matricula,
  onCerrar,
}: RegistroNotasModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const guardandoRef = useRef(false);
  const huboCambiosRef = useRef(false);

  const [pestaña, setPestaña] = useState<Pestaña>("notas");
  const [bimestre, setBimestre] = useState<Bimestre>(1);
  const [cursoId, setCursoId] = useState("");
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cargandoCursos, setCargandoCursos] = useState(true);
  const [errorCursos, setErrorCursos] = useState("");

  const [campos, setCampos] = useState<Campo[]>([]);
  const [valores, setValores] = useState<Valores>({});
  const [originales, setOriginales] = useState<Valores>({});
  const [cargando, setCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const hayPendientes = campos.some(
    ({ clave }) => valores[clave] !== originales[clave],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();

    return () => {
      dialog?.close();
    };
  }, []);

  useEffect(() => {
    let activo = true;

    obtenerCursos(token)
      .then((datos) => {
        if (!activo) return;

        setCursos(
          datos.filter(
            (curso) =>
              curso.anioLectivo === matricula.anioLectivo &&
              curso.nivel === matricula.nivel &&
              curso.grado === matricula.grado,
          ),
        );
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
  }, [token, matricula.anioLectivo, matricula.nivel, matricula.grado]);

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
  ]);

  function permitirCambio(): boolean {
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

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (guardandoRef.current || cargando || !hayPendientes) return;

    guardandoRef.current = true;
    setGuardando(true);
    setError("");
    setMensaje("");

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
        const cantidadesValidas = camposAsistencia.every(({ clave }) => {
          const texto = valores[clave] ?? "";
          const numero = Number(texto);

          return (
            texto.trim() !== "" &&
            Number.isSafeInteger(numero) &&
            numero >= 0 &&
            numero <= 2147483647
          );
        });

        if (!cantidadesValidas) {
          throw new Error(
            "Las asistencias y tardanzas deben ser números enteros desde 0.",
          );
        }

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
      aria-labelledby="registro-evaluaciones-titulo"
      onCancel={(evento) => {
        evento.preventDefault();
        cerrar();
      }}
    >
      <h2 id="registro-evaluaciones-titulo">Registrar evaluaciones</h2>

      <p>
        {matricula.nombreEstudiante} — {matricula.nivel} {matricula.grado}
        {" · "}
        {matricula.anioLectivo}
      </p>

      <div className="registro-evaluaciones__campo">
        <label htmlFor="evaluaciones-bimestre">Bimestre</label>
        <select
          id="evaluaciones-bimestre"
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
        {pestañas.map(({ id, etiqueta }) => (
          <button
            key={id}
            type="button"
            aria-pressed={pestaña === id}
            aria-controls="evaluaciones-contenido"
            disabled={guardando}
            onClick={() => cambiarPestaña(id)}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      <section
        id="evaluaciones-contenido"
        aria-label={pestañas.find((item) => item.id === pestaña)?.etiqueta}
        aria-busy={cargando || guardando}
      >
        {pestaña === "notas" && (
          <>
            {cargandoCursos && <p role="status">Cargando cursos...</p>}
            {errorCursos && <p role="alert">{errorCursos}</p>}

            {!cargandoCursos && !errorCursos && (
              <div className="registro-evaluaciones__campo">
                <label htmlFor="evaluaciones-curso">Curso</label>
                <select
                  id="evaluaciones-curso"
                  value={cursoId}
                  disabled={guardando}
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
        {errorCarga && <p role="alert">{errorCarga}</p>}

        {!cargando && !errorCarga && (
          <>
            {pestaña === "notas" && cursoId && campos.length === 0 && (
              <p>Este curso no tiene competencias registradas.</p>
            )}

            {campos.length > 0 && (
              <form onSubmit={guardar}>
                <fieldset disabled={guardando}>
                  <div className="registro-evaluaciones__campos">
                    {campos.map((campo) => (
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

                        <div
                          className={`registro-evaluaciones__campo ${
                            campo.tipo === "texto"
                              ? "registro-evaluaciones__campo--completo"
                              : ""
                          }`}
                        >
                          <label htmlFor={`evaluacion-${campo.clave}`}>
                            {campo.etiqueta}
                          </label>

                          {campo.tipo === "nota" ? (
                            <select
                              id={`evaluacion-${campo.clave}`}
                              value={valores[campo.clave] ?? ""}
                              onChange={(evento) => {
                                const valor = evento.target.value;

                                setValores((actuales) => ({
                                  ...actuales,
                                  [campo.clave]: valor,
                                }));
                                setError("");
                                setMensaje("");
                              }}
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
                              {["AD", "A", "B", "C"].map((nota) => (
                                <option key={nota} value={nota}>
                                  {nota}
                                </option>
                              ))}
                            </select>
                          ) : campo.tipo === "numero" ? (
                            <input
                              id={`evaluacion-${campo.clave}`}
                              type="number"
                              min={0}
                              max={2147483647}
                              step={1}
                              required
                              value={valores[campo.clave] ?? "0"}
                              onChange={(evento) => {
                                const valor = evento.target.value;

                                setValores((actuales) => ({
                                  ...actuales,
                                  [campo.clave]: valor,
                                }));
                                setError("");
                                setMensaje("");
                              }}
                            />
                          ) : (
                            <textarea
                              id={`evaluacion-${campo.clave}`}
                              rows={4}
                              maxLength={1000}
                              value={valores[campo.clave] ?? ""}
                              onChange={(evento) => {
                                const valor = evento.target.value;

                                setValores((actuales) => ({
                                  ...actuales,
                                  [campo.clave]: valor,
                                }));
                                setError("");
                                setMensaje("");
                              }}
                            />
                          )}
                        </div>
                      </Fragment>
                    ))}
                  </div>
                </fieldset>

                {pestaña === "conducta" && (
                  <p>
                    La calificación del bimestre se calcula automáticamente
                    cuando los tres criterios de conducta están evaluados.
                  </p>
                )}

                <div className="registro-evaluaciones__acciones">
                  <button
                    type="submit"
                    className="boletas-page__boton"
                    disabled={guardando || !hayPendientes}
                  >
                    {guardando
                      ? "Guardando..."
                      : pestaña === "notas"
                        ? "Guardar notas"
                        : pestaña === "conducta"
                          ? "Guardar conducta y asistencia"
                          : "Guardar evaluación del padre"}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </section>

      {error && <p role="alert">{error}</p>}
      {mensaje && <p role="status">{mensaje}</p>}

      <footer className="registro-evaluaciones__acciones">
        {hayPendientes && (
          <button
            className="registro-evaluaciones__boton-secundario"
            type="button"
            disabled={guardando}
            onClick={() => {
              setValores({ ...originales });
              setError("");
              setMensaje("");
            }}
          >
            Descartar cambios pendientes
          </button>
        )}

        <button
          className="registro-evaluaciones__boton-secundario"
          type="button"
          disabled={guardando}
          onClick={cerrar}
        >
          Cerrar
        </button>
      </footer>
    </dialog>
  );
}
