import { useEffect, useRef, useState } from "react";
import { Boton } from "../../../shared/components/Boton";
import { obtenerEstudiantesPorCurso } from "../cursos.service";
import type { Curso, EstudianteCurso } from "../cursos.types";
import { RegistroNotasModal } from "../../calificaciones/components/RegistroNotasModal";
import { obtenerBoleta } from "../../boletas/boletas.service";
import type { Boleta } from "../../boletas/boletas.types";
import { BoletaVista } from "../../boletas/components/BoletaVista";
import "../../../styles/listados.css";
import "../../boletas/pages/BoletasPage.css";
import "./CursoEstudiantesPage.css";

interface CursoEstudiantesPageProps {
  token: string;
  curso: Curso;
  onVolver: () => void;
}

const TAMANO_PAGINA = 10;

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim();
}

export function CursoEstudiantesPage({
  token,
  curso,
  onVolver,
}: CursoEstudiantesPageProps) {
  const [estudiantes, setEstudiantes] = useState<EstudianteCurso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);

  const [seleccionada, setSeleccionada] = useState<EstudianteCurso | null>(
    null,
  );

  const [mensaje, setMensaje] = useState("");
  const [boleta, setBoleta] = useState<Boleta | null>(null);
  const [consultandoId, setConsultandoId] = useState<string | null>(null);
  const [errorBoleta, setErrorBoleta] = useState("");

  const consultaRef = useRef(0);
  const consultandoRef = useRef(false);

  useEffect(() => {
    let activo = true;

    obtenerEstudiantesPorCurso(token, curso.id)
      .then((datos) => {
        if (!activo) return;

        setEstudiantes(
          [...datos].sort((a, b) =>
            a.nombreEstudiante.localeCompare(b.nombreEstudiante, "es"),
          ),
        );

        setError("");
      })
      .catch((fallo: unknown) => {
        if (!activo) return;

        setError(
          fallo instanceof Error
            ? fallo.message
            : "No se pudieron cargar los estudiantes.",
        );
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [token, curso.id, intento]);

  useEffect(() => {
    return () => {
      consultaRef.current += 1;
    };
  }, []);

  function reintentar() {
    setError("");
    setCargando(true);
    setIntento((actual) => actual + 1);
  }

  async function consultarBoleta(estudiante: EstudianteCurso) {
    if (consultandoRef.current) return;

    consultandoRef.current = true;

    const consultaId = ++consultaRef.current;

    setConsultandoId(estudiante.estudianteId);
    setErrorBoleta("");
    setMensaje("");

    try {
      const datos = await obtenerBoleta(
        token,
        estudiante.estudianteId,
        estudiante.anioLectivo,
      );

      if (consultaId === consultaRef.current) {
        setBoleta(datos);
      }
    } catch (fallo: unknown) {
      if (consultaId === consultaRef.current) {
        setErrorBoleta(
          fallo instanceof Error
            ? fallo.message
            : "No se pudo consultar la boleta. Intenta nuevamente.",
        );
      }
    } finally {
      if (consultaId === consultaRef.current) {
        consultandoRef.current = false;
        setConsultandoId(null);
      }
    }
  }

  const termino = normalizar(busqueda);

  const filtrados = estudiantes.filter((estudiante) =>
    normalizar(estudiante.nombreEstudiante).includes(termino),
  );

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / TAMANO_PAGINA));

  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio = (paginaActual - 1) * TAMANO_PAGINA;
  const visibles = filtrados.slice(inicio, inicio + TAMANO_PAGINA);

  if (boleta) {
    return (
      <section className="boletas-page">
        <header className="boletas-page__encabezado">
          <h1>Boleta de notas</h1>
          <p>{boleta.nombreEstudiante}</p>
        </header>

        <div className="boletas-page__acciones">
          <Boton onClick={() => setBoleta(null)}>Volver a estudiantes</Boton>

          <Boton onClick={() => window.print()}>Imprimir boleta</Boton>
        </div>

        <BoletaVista boleta={boleta} />
      </section>
    );
  }

  return (
    <section
      className="curso-estudiantes"
      aria-labelledby="curso-estudiantes-titulo"
    >
      <div>
        <Boton onClick={onVolver}>Volver a mis cursos</Boton>
      </div>

      <header className="curso-estudiantes__encabezado">
        <h1 id="curso-estudiantes-titulo">{curso.nombre}</h1>

        <p>
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

      {mensaje && (
        <p className="curso-estudiantes__exito" role="status">
          {mensaje}
        </p>
      )}

      {errorBoleta && (
        <p className="curso-estudiantes__error" role="alert">
          {errorBoleta}
        </p>
      )}

      {consultandoId !== null && <p role="status">Consultando boleta…</p>}

      {cargando ? (
        <p className="estado-listado" role="status">
          Cargando estudiantes…
        </p>
      ) : error ? (
        <div className="estado-listado">
          <p className="estado-listado__error" role="alert">
            {error}
          </p>

          <Boton onClick={reintentar}>Reintentar</Boton>
        </div>
      ) : estudiantes.length === 0 ? (
        <div className="estado-listado">
          <h2>No hay estudiantes matriculados</h2>
          <p>
            Consulta con administración si faltan matrículas para este grado y
            año lectivo.
          </p>
        </div>
      ) : (
        <>
          <div className="curso-estudiantes__filtros">
            <label htmlFor="curso-estudiantes-busqueda">
              Buscar estudiante
            </label>

            <input
              id="curso-estudiantes-busqueda"
              type="search"
              value={busqueda}
              placeholder="Nombres o apellidos"
              onChange={(evento) => {
                setBusqueda(evento.target.value);
                setPagina(1);
              }}
            />

            <p role="status">
              {filtrados.length}{" "}
              {filtrados.length === 1
                ? "estudiante encontrado"
                : "estudiantes encontrados"}
            </p>
          </div>

          {filtrados.length === 0 ? (
            <div className="estado-listado">
              <p>No hay estudiantes que coincidan con tu búsqueda.</p>

              <Boton
                onClick={() => {
                  setBusqueda("");
                  setPagina(1);
                }}
              >
                Limpiar búsqueda
              </Boton>
            </div>
          ) : (
            <>
              <div className="tabla-listado">
                <table>
                  <caption className="solo-lectores">
                    Estudiantes de {curso.nombre}, {curso.grado}, año{" "}
                    {curso.anioLectivo}
                  </caption>

                  <thead>
                    <tr>
                      <th scope="col">Estudiante</th>
                      <th scope="col">Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibles.map((estudiante) => (
                      <tr key={estudiante.estudianteId}>
                        <td data-label="Estudiante">
                          {estudiante.nombreEstudiante}
                        </td>

                        <td data-label="Acciones">
                          <div className="curso-estudiantes__acciones">
                            <Boton
                              disabled={consultandoId !== null}
                              onClick={() => {
                                setMensaje("");
                                setErrorBoleta("");
                                setSeleccionada(estudiante);
                              }}
                              aria-label={`Registrar evaluaciones de ${estudiante.nombreEstudiante}`}
                            >
                              Registrar evaluaciones
                            </Boton>

                            <Boton
                              disabled={consultandoId !== null}
                              cargando={
                                consultandoId === estudiante.estudianteId
                              }
                              textoCargando="Consultando..."
                              onClick={() => {
                                void consultarBoleta(estudiante);
                              }}
                              aria-label={`Ver boleta de ${estudiante.nombreEstudiante}`}
                            >
                              Ver boleta
                            </Boton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPaginas > 1 && (
                <nav
                  className="paginacion"
                  aria-label="Paginación de estudiantes"
                >
                  <p>
                    Página {paginaActual} de {totalPaginas}
                  </p>

                  <div className="paginacion__controles">
                    <Boton
                      disabled={paginaActual === 1}
                      onClick={() => setPagina(paginaActual - 1)}
                    >
                      Anterior
                    </Boton>

                    <Boton
                      disabled={paginaActual === totalPaginas}
                      onClick={() => setPagina(paginaActual + 1)}
                    >
                      Siguiente
                    </Boton>
                  </div>
                </nav>
              )}
            </>
          )}
        </>
      )}

      {seleccionada && (
        <RegistroNotasModal
          key={`${seleccionada.estudianteId}-${curso.id}`}
          token={token}
          matricula={seleccionada}
          modo="docente"
          cursoInicialId={curso.id}
          onCerrar={(huboCambios) => {
            const nombre = seleccionada.nombreEstudiante;

            setSeleccionada(null);

            if (huboCambios) {
              setMensaje(
                `Se guardaron cambios en las evaluaciones de ${nombre}.`,
              );
            }
          }}
        />
      )}
    </section>
  );
}
