import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { obtenerCursos } from "../../cursos/cursos.service";
import { obtenerCompetenciasPorCurso } from "../../competencias/competencias.service";
import type { Curso } from "../../cursos/cursos.types";
import type { Competencia } from "../../competencias/competencias.types";
import type { Matricula } from "../../matriculas/matriculas.types";
import type { NotaCualitativa } from "../../boletas/boletas.types";
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

type SeleccionNota = NotaCualitativa | "";

export function RegistroNotasModal({
  token,
  matricula,
  onCerrar,
}: RegistroNotasModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const guardandoRef = useRef(false);
  const huboCambiosRef = useRef(false);
  const cargaRef = useRef(0);

  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cargandoCursos, setCargandoCursos] = useState(true);
  const [errorCursos, setErrorCursos] = useState("");
  const [cursoId, setCursoId] = useState("");
  const [bimestre, setBimestre] = useState<Bimestre>(1);
  const [competencias, setCompetencias] = useState<Competencia[]>([]);
  const [notas, setNotas] = useState<Record<string, SeleccionNota>>({});
  const [originales, setOriginales] = useState<Record<string, SeleccionNota>>(
    {},
  );
  const [cargandoNotas, setCargandoNotas] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorCarga, setErrorCarga] = useState("");
  const [errorGuardar, setErrorGuardar] = useState("");
  const [mensaje, setMensaje] = useState("");

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
        if (activo) {
          setErrorCursos(
            fallo instanceof Error
              ? fallo.message
              : "No se pudieron cargar los cursos.",
          );
        }
      })
      .finally(() => {
        if (activo) setCargandoCursos(false);
      });

    return () => {
      activo = false;
      cargaRef.current += 1;
    };
  }, [token, matricula.anioLectivo, matricula.nivel, matricula.grado]);

  const hayPendientes = competencias.some(
    (competencia) => notas[competencia.id] !== originales[competencia.id],
  );

  async function cargarSeleccion(
    nuevoCursoId: string,
    nuevoBimestre: Bimestre,
  ) {
    if (guardandoRef.current) return;

    if (hayPendientes) {
      setErrorGuardar(
        "Guarda o descarta los cambios antes de cambiar el curso o bimestre.",
      );
      return;
    }

    const cargaId = ++cargaRef.current;

    setCursoId(nuevoCursoId);
    setBimestre(nuevoBimestre);
    setCompetencias([]);
    setNotas({});
    setOriginales({});
    setErrorCarga("");
    setErrorGuardar("");
    setMensaje("");

    if (!nuevoCursoId) {
      setCargandoNotas(false);
      return;
    }

    setCargandoNotas(true);

    try {
      const [lista, registradas] = await Promise.all([
        obtenerCompetenciasPorCurso(token, nuevoCursoId),
        obtenerNotasPorBimestre(token, matricula.estudianteId, nuevoBimestre),
      ]);

      if (cargaId !== cargaRef.current) return;

      const valores: Record<string, SeleccionNota> = {};

      for (const competencia of lista) {
        valores[competencia.id] =
          registradas.find((nota) => nota.competenciaId === competencia.id)
            ?.calificativo ?? "";
      }

      setCompetencias(lista);
      setNotas(valores);
      setOriginales({ ...valores });
    } catch (fallo: unknown) {
      if (cargaId === cargaRef.current) {
        setErrorCarga(
          fallo instanceof Error
            ? fallo.message
            : "No se pudieron cargar las notas.",
        );
      }
    } finally {
      if (cargaId === cargaRef.current) {
        setCargandoNotas(false);
      }
    }
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (guardandoRef.current) return;

    const cambios = competencias.filter(
      (competencia) => notas[competencia.id] !== originales[competencia.id],
    );

    if (cambios.length === 0) return;

    guardandoRef.current = true;
    setGuardando(true);
    setErrorGuardar("");
    setMensaje("");

    let guardadas = 0;

    try {
      for (const competencia of cambios) {
        const calificativo = notas[competencia.id];

        if (!calificativo) {
          throw new Error(
            "No se puede eliminar una nota desde este formulario.",
          );
        }

        const guardada = await guardarNotaCompetencia(
          token,
          matricula.estudianteId,
          {
            competenciaId: competencia.id,
            bimestre,
            calificativo,
          },
        );

        huboCambiosRef.current = true;
        guardadas += 1;

        setOriginales((actuales) => ({
          ...actuales,
          [competencia.id]: guardada.calificativo,
        }));
      }

      setMensaje(
        `${guardadas} ${
          guardadas === 1 ? "nota guardada" : "notas guardadas"
        } correctamente.`,
      );
    } catch (fallo: unknown) {
      const detalle =
        fallo instanceof Error
          ? fallo.message
          : "No se pudo completar el registro.";

      setErrorGuardar(
        guardadas > 0
          ? `Se guardaron ${guardadas} notas. ${detalle} Las restantes siguen pendientes.`
          : detalle,
      );
    } finally {
      guardandoRef.current = false;
      setGuardando(false);
    }
  }

  function cerrar() {
    if (guardandoRef.current) return;

    if (hayPendientes) {
      setErrorGuardar(
        "Guarda o descarta los cambios pendientes antes de cerrar.",
      );
      return;
    }

    onCerrar(huboCambiosRef.current);
  }

  return (
    <dialog
      ref={dialogRef}
      className="registro-notas"
      aria-labelledby="registro-notas-titulo"
      onCancel={(evento) => {
        evento.preventDefault();
        cerrar();
      }}
    >
      <h2 id="registro-notas-titulo">Registrar notas</h2>
      <p>
        {matricula.nombreEstudiante} — {matricula.nivel} {matricula.grado} ·{" "}
        {matricula.anioLectivo}
      </p>

      {cargandoCursos && <p role="status">Cargando cursos...</p>}
      {errorCursos && <p role="alert">{errorCursos}</p>}

      {!cargandoCursos && !errorCursos && (
        <>
          <div className="registro-notas__seleccion">
            <div className="registro-notas__campo">
              <label htmlFor="registro-notas-curso">Curso</label>
              <select
                id="registro-notas-curso"
                value={cursoId}
                disabled={guardando}
                onChange={(evento) =>
                  void cargarSeleccion(evento.target.value, bimestre)
                }
              >
                <option value="">Selecciona un curso</option>
                {cursos.map((curso) => (
                  <option key={curso.id} value={curso.id}>
                    {curso.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="registro-notas__campo">
              <label htmlFor="registro-notas-bimestre">Bimestre</label>
              <select
                id="registro-notas-bimestre"
                value={bimestre}
                disabled={guardando}
                onChange={(evento) =>
                  void cargarSeleccion(
                    cursoId,
                    Number(evento.target.value) as Bimestre,
                  )
                }
              >
                {[1, 2, 3, 4].map((valor) => (
                  <option key={valor} value={valor}>
                    {valor}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {cursos.length === 0 && (
            <p>No hay cursos configurados para esta matrícula.</p>
          )}

          {cargandoNotas && <p role="status">Cargando notas...</p>}
          {errorCarga && <p role="alert">{errorCarga}</p>}

          {cursoId &&
            !cargandoNotas &&
            !errorCarga &&
            (competencias.length === 0 ? (
              <p>Este curso no tiene competencias registradas.</p>
            ) : (
              <form onSubmit={guardar} aria-busy={guardando}>
                <div className="registro-notas__lista">
                  {competencias.map((competencia) => (
                    <div
                      className="registro-notas__competencia"
                      key={competencia.id}
                    >
                      <label htmlFor={`nota-${competencia.id}`}>
                        {competencia.nombreCompetencia}
                      </label>

                      <select
                        id={`nota-${competencia.id}`}
                        value={notas[competencia.id] ?? ""}
                        disabled={guardando}
                        onChange={(evento) => {
                          const valor = evento.target.value as SeleccionNota;

                          setNotas((actuales) => ({
                            ...actuales,
                            [competencia.id]: valor,
                          }));
                          setMensaje("");
                        }}
                      >
                        <option
                          value=""
                          disabled={originales[competencia.id] !== ""}
                        >
                          Sin evaluar
                        </option>
                        <option value="AD">AD</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                      </select>
                    </div>
                  ))}
                </div>

                <div className="registro-notas__acciones">
                  <button
                    type="submit"
                    className="boletas-page__boton"
                    disabled={guardando || !hayPendientes}
                  >
                    {guardando ? "Guardando..." : "Guardar notas"}
                  </button>
                </div>
              </form>
            ))}
        </>
      )}

      {errorGuardar && <p role="alert">{errorGuardar}</p>}
      {mensaje && <p role="status">{mensaje}</p>}

      <footer className="registro-notas__acciones">
        {hayPendientes && (
          <button
            type="button"
            className="registro-notas__boton-secundario"
            disabled={guardando}
            onClick={() => {
              setNotas({ ...originales });
              setErrorGuardar("");
              setMensaje("");
            }}
          >
            Descartar cambios pendientes
          </button>
        )}

        <button
          type="button"
          className="registro-notas__boton-secundario"
          disabled={guardando}
          onClick={cerrar}
        >
          Cerrar
        </button>
      </footer>
    </dialog>
  );
}
