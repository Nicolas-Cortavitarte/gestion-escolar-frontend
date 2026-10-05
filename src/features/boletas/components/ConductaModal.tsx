import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Matricula } from "../../matriculas/matriculas.types";
import type { NotaCualitativa } from "../boletas.types";
import type {
  Bimestre,
  ReporteConductaRequest,
} from "../registro-boleta.types";
import {
  obtenerReportesConducta,
  guardarReporteConducta,
} from "../registro-boleta.service";

interface ConductaModalProps {
  token: string;
  matricula: Matricula;
  onCerrar: (huboCambios: boolean) => void;
}

const criterios = [
  {
    campo: "conductaPuntualidadRespeto",
    etiqueta: "Puntualidad y respeto",
  },
  {
    campo: "conductaActitudAula",
    etiqueta: "Actitud en el aula",
  },
  {
    campo: "conductaPresentacionAseo",
    etiqueta: "Presentación y aseo",
  },
] as const;

const asistencias = [
  {
    campo: "inasistenciasJustificadas",
    etiqueta: "Inasistencias justificadas",
  },
  {
    campo: "inasistenciasInjustificadas",
    etiqueta: "Inasistencias injustificadas",
  },
  {
    campo: "tardanzasJustificadas",
    etiqueta: "Tardanzas justificadas",
  },
  {
    campo: "tardanzasInjustificadas",
    etiqueta: "Tardanzas injustificadas",
  },
] as const;

function crearFormulario(
  anioLectivo: number,
  bimestre: Bimestre,
): ReporteConductaRequest {
  return {
    anioLectivo,
    bimestre,
    conductaPuntualidadRespeto: null,
    conductaActitudAula: null,
    conductaPresentacionAseo: null,
    inasistenciasJustificadas: 0,
    inasistenciasInjustificadas: 0,
    tardanzasJustificadas: 0,
    tardanzasInjustificadas: 0,
    apreciacionTutor: "",
  };
}

export function ConductaModal({
  token,
  matricula,
  onCerrar,
}: ConductaModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const guardandoRef = useRef(false);
  const huboCambiosRef = useRef(false);

  const [registros, setRegistros] = useState<ReporteConductaRequest[]>([]);
  const [formulario, setFormulario] = useState(() =>
    crearFormulario(matricula.anioLectivo, 1),
  );
  const [original, setOriginal] = useState(() =>
    crearFormulario(matricula.anioLectivo, 1),
  );
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorCarga, setErrorCarga] = useState("");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const hayPendientes = JSON.stringify(formulario) !== JSON.stringify(original);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();

    return () => {
      dialog?.close();
    };
  }, []);

  useEffect(() => {
    let activo = true;

    obtenerReportesConducta(
      token,
      matricula.estudianteId,
      matricula.anioLectivo,
    )
      .then((datos) => {
        if (!activo) return;

        const normalizados: ReporteConductaRequest[] = datos.map(
          (registro) => ({
            anioLectivo: matricula.anioLectivo,
            bimestre: registro.bimestre,
            conductaPuntualidadRespeto:
              registro.conductaPuntualidadRespeto ?? null,
            conductaActitudAula: registro.conductaActitudAula ?? null,
            conductaPresentacionAseo: registro.conductaPresentacionAseo ?? null,
            inasistenciasJustificadas: registro.inasistenciasJustificadas ?? 0,
            inasistenciasInjustificadas:
              registro.inasistenciasInjustificadas ?? 0,
            tardanzasJustificadas: registro.tardanzasJustificadas ?? 0,
            tardanzasInjustificadas: registro.tardanzasInjustificadas ?? 0,
            apreciacionTutor: registro.apreciacionTutor ?? "",
          }),
        );

        setRegistros(normalizados);

        const inicial =
          normalizados.find((registro) => registro.bimestre === 1) ??
          crearFormulario(matricula.anioLectivo, 1);

        setFormulario({ ...inicial });
        setOriginal({ ...inicial });
      })
      .catch((fallo: unknown) => {
        if (!activo) return;

        setErrorCarga(
          fallo instanceof Error
            ? fallo.message
            : "No se pudo cargar la conducta y asistencia.",
        );
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [token, matricula.estudianteId, matricula.anioLectivo]);

  function cambiarBimestre(bimestre: Bimestre) {
    if (guardandoRef.current) return;

    if (hayPendientes) {
      setError("Guarda o descarta los cambios antes de cambiar de bimestre.");
      return;
    }

    const registro =
      registros.find((item) => item.bimestre === bimestre) ??
      crearFormulario(matricula.anioLectivo, bimestre);

    setFormulario({ ...registro });
    setOriginal({ ...registro });
    setError("");
    setMensaje("");
  }

  function cerrar() {
    if (guardandoRef.current) return;

    if (hayPendientes) {
      setError("Guarda o descarta los cambios antes de cerrar.");
      return;
    }

    onCerrar(huboCambiosRef.current);
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (guardandoRef.current || !hayPendientes) return;

    const cantidadesValidas = asistencias.every(
      ({ campo }) =>
        Number.isInteger(formulario[campo]) && formulario[campo] >= 0,
    );

    if (!cantidadesValidas) {
      setError(
        "Las asistencias y tardanzas deben ser números enteros desde 0.",
      );
      return;
    }

    guardandoRef.current = true;
    setGuardando(true);
    setError("");
    setMensaje("");

    const datos = { ...formulario };

    try {
      await guardarReporteConducta(token, matricula.estudianteId, {
        ...datos,
        apreciacionTutor: datos.apreciacionTutor?.trim() || null,
      });

      huboCambiosRef.current = true;
      setOriginal({ ...datos });
      setRegistros((actuales) => [
        ...actuales.filter((item) => item.bimestre !== datos.bimestre),
        datos,
      ]);
      setMensaje("Conducta y asistencia guardadas correctamente.");
    } catch (fallo: unknown) {
      setError(
        fallo instanceof Error
          ? fallo.message
          : "No se pudo guardar la conducta y asistencia.",
      );
    } finally {
      guardandoRef.current = false;
      setGuardando(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="registro-conducta"
      aria-labelledby="conducta-titulo"
      onCancel={(evento) => {
        evento.preventDefault();
        cerrar();
      }}
    >
      <h2 id="conducta-titulo">Conducta y asistencia</h2>
      <p>
        {matricula.nombreEstudiante} — {matricula.anioLectivo}
      </p>

      {cargando && <p role="status">Cargando registros...</p>}
      {errorCarga && <p role="alert">{errorCarga}</p>}

      {!cargando && !errorCarga && (
        <form onSubmit={guardar}>
          <fieldset disabled={guardando}>
            <div className="registro-conducta__campo">
              <label htmlFor="conducta-bimestre">Bimestre</label>
              <select
                id="conducta-bimestre"
                value={formulario.bimestre}
                onChange={(evento) =>
                  cambiarBimestre(Number(evento.target.value) as Bimestre)
                }
              >
                {[1, 2, 3, 4].map((bimestre) => (
                  <option key={bimestre} value={bimestre}>
                    Bimestre {bimestre}
                  </option>
                ))}
              </select>
            </div>

            <h3>Conducta del alumno</h3>

            <div className="registro-conducta__campos">
              {criterios.map(({ campo, etiqueta }) => (
                <div className="registro-conducta__campo" key={campo}>
                  <label htmlFor={campo}>{etiqueta}</label>
                  <select
                    id={campo}
                    value={formulario[campo] ?? ""}
                    onChange={(evento) => {
                      const valor = evento.target.value;
                      setFormulario((actual) => ({
                        ...actual,
                        [campo]:
                          valor === "" ? null : (valor as NotaCualitativa),
                      }));
                      setMensaje("");
                      setError("");
                    }}
                  >
                    <option value="">Sin evaluar</option>
                    {["AD", "A", "B", "C"].map((nota) => (
                      <option key={nota} value={nota}>
                        {nota}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <p>
              La calificación del bimestre se calcula automáticamente cuando los
              tres criterios están evaluados.
            </p>

            <h3>Asistencia y tardanzas</h3>

            <div className="registro-conducta__campos">
              {asistencias.map(({ campo, etiqueta }) => (
                <div className="registro-conducta__campo" key={campo}>
                  <label htmlFor={campo}>{etiqueta}</label>
                  <input
                    id={campo}
                    type="number"
                    min={0}
                    step={1}
                    required
                    value={
                      Number.isNaN(formulario[campo]) ? "" : formulario[campo]
                    }
                    onChange={(evento) => {
                      const valor = evento.target.valueAsNumber;
                      setFormulario((actual) => ({
                        ...actual,
                        [campo]: valor,
                      }));
                      setMensaje("");
                      setError("");
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="registro-conducta__campo">
              <label htmlFor="conducta-apreciacion">
                Apreciación del tutor
              </label>
              <textarea
                id="conducta-apreciacion"
                rows={4}
                maxLength={1000}
                value={formulario.apreciacionTutor ?? ""}
                onChange={(evento) => {
                  const valor = evento.target.value;
                  setFormulario((actual) => ({
                    ...actual,
                    apreciacionTutor: valor,
                  }));
                  setMensaje("");
                  setError("");
                }}
              />
            </div>
          </fieldset>

          <div className="registro-conducta__acciones">
            <button
              type="submit"
              className="boletas-page__boton"
              disabled={guardando || !hayPendientes}
            >
              {guardando ? "Guardando..." : "Guardar"}
            </button>

            {hayPendientes && (
              <button
                type="button"
                disabled={guardando}
                onClick={() => {
                  setFormulario({ ...original });
                  setError("");
                  setMensaje("");
                }}
              >
                Descartar cambios
              </button>
            )}
          </div>
        </form>
      )}

      {error && <p role="alert">{error}</p>}
      {mensaje && <p role="status">{mensaje}</p>}

      <div className="registro-conducta__acciones">
        <button type="button" disabled={guardando} onClick={cerrar}>
          Cerrar
        </button>
      </div>
    </dialog>
  );
}
