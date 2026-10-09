import { useEffect, useState } from "react";
import { Boton } from "../../../shared/components/Boton";
import { obtenerMisCursos } from "../../cursos/cursos.service";
import type { Curso } from "../../cursos/cursos.types";
import { CursoEstudiantesPage } from "../../cursos/pages/CursoEstudiantesPage";
import "./DocenteDashboardPage.css";

interface DocenteDashboardPageProps {
  token: string;
}

export function DocenteDashboardPage({ token }: DocenteDashboardPageProps) {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0);
  const [anio, setAnio] = useState(String(new Date().getFullYear()));
  const [cursoSeleccionado, setCursoSeleccionado] = useState<Curso | null>(
    null,
  );

  useEffect(() => {
    let activo = true;

    obtenerMisCursos(token)
      .then((datos) => {
        if (!activo) return;

        setCursos(datos);
        setError("");
      })
      .catch((fallo: unknown) => {
        if (!activo) return;

        setError(
          fallo instanceof Error
            ? fallo.message
            : "No se pudieron cargar tus cursos.",
        );
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [token, intento]);

  function reintentar() {
    setError("");
    setCargando(true);
    setIntento((actual) => actual + 1);
  }

  const anios = Array.from(
    new Set([
      new Date().getFullYear(),
      ...cursos.map((curso) => curso.anioLectivo),
    ]),
  ).sort((a, b) => b - a);

  const cursosDelAnio = cursos
    .filter((curso) => curso.anioLectivo === Number(anio))
    .sort(
      (a, b) =>
        a.nivel.localeCompare(b.nivel, "es") ||
        a.grado.localeCompare(b.grado, "es", { numeric: true }) ||
        a.nombre.localeCompare(b.nombre, "es"),
    );

  const cantidadGrados = new Set(
    cursosDelAnio.map((curso) => `${curso.nivel}:${curso.grado}`),
  ).size;

  if (cursoSeleccionado) {
    return (
      <CursoEstudiantesPage
        key={`${token}-${cursoSeleccionado.id}`}
        token={token}
        curso={cursoSeleccionado}
        onVolver={() => setCursoSeleccionado(null)}
      />
    );
  }

  return (
    <section
      className="docente-dashboard"
      aria-labelledby="docente-dashboard-titulo"
    >
      <header className="docente-dashboard__encabezado">
        <h1 id="docente-dashboard-titulo">Inicio</h1>
        <p>Consulta los cursos que tienes asignados para el año lectivo.</p>
      </header>

      {cargando ? (
        <p className="docente-dashboard__estado" role="status">
          Cargando tus cursos…
        </p>
      ) : error ? (
        <div className="docente-dashboard__error">
          <p role="alert">{error}</p>
          <Boton onClick={reintentar}>Reintentar</Boton>
        </div>
      ) : (
        <>
          <div className="docente-dashboard__filtros">
            <div className="docente-dashboard__campo">
              <label htmlFor="docente-dashboard-anio">Año lectivo</label>

              <select
                id="docente-dashboard-anio"
                value={anio}
                onChange={(evento) => setAnio(evento.target.value)}
              >
                {anios.map((valor) => (
                  <option key={valor} value={valor}>
                    {valor}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <dl
            className="docente-dashboard__resumen"
            aria-label={`Resumen del año ${anio}`}
          >
            <div>
              <dt>Cursos asignados</dt>
              <dd>{cursosDelAnio.length}</dd>
            </div>

            <div>
              <dt>Grados a tu cargo</dt>
              <dd>{cantidadGrados}</dd>
            </div>
          </dl>

          <section
            className="docente-dashboard__cursos"
            aria-labelledby="docente-cursos-titulo"
          >
            <h2 id="docente-cursos-titulo">Mis cursos</h2>

            <ul className="docente-dashboard__lista">
              {cursosDelAnio.map((curso) => (
                <li key={curso.id}>
                  <article className="docente-dashboard__curso">
                    <div className="docente-dashboard__curso-cabecera">
                      <span
                        className="docente-dashboard__curso-icono"
                        aria-hidden="true"
                      >
                        <svg
                          width="26"
                          height="26"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 5v15" />
                          <path d="M12 5C9 3 5 3 2 4v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Z" />
                        </svg>
                      </span>

                      <span className="docente-dashboard__curso-nivel">
                        {curso.nivel === "INICIAL"
                          ? "Inicial"
                          : curso.nivel === "PRIMARIA"
                            ? "Primaria"
                            : curso.nivel}
                      </span>
                    </div>

                    <h3>{curso.nombre}</h3>

                    <dl className="docente-dashboard__curso-datos">
                      <div>
                        <dt>Grado</dt>
                        <dd>{curso.grado}</dd>
                      </div>

                      <div>
                        <dt>Año lectivo</dt>
                        <dd>{curso.anioLectivo}</dd>
                      </div>
                    </dl>

                    <Boton
                      onClick={() => setCursoSeleccionado(curso)}
                      aria-label={`Ver estudiantes de ${curso.nombre}, ${curso.grado}`}
                    >
                      Ver estudiantes
                    </Boton>
                  </article>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </section>
  );
}
