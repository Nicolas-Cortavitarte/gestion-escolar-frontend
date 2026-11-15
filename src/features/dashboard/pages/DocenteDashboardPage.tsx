import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { obtenerMisCursos } from "../../cursos/cursos.service";
import type { Curso } from "../../cursos/cursos.types";
import { obtenerMiPerfilDocente } from "../../docentes/docentes.service";
import type { Docente } from "../../docentes/docentes.types";
import { Boton } from "../../../shared/components/Boton";
import { BadgeEstado } from "../../../shared/components/BadgeEstado";
import { Skeleton } from "../../../shared/components/Skeleton";
import "./DocenteDashboardPage.css";

interface DocenteDashboardPageProps {
  token: string;
}

export function DocenteDashboardPage({ token }: DocenteDashboardPageProps) {
  const navegar = useNavigate();
  const [perfil, setPerfil] = useState<Docente | null>(null);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    Promise.all([obtenerMiPerfilDocente(token), obtenerMisCursos(token)])
      .then(([datosPerfil, datosCursos]) => {
        if (!activo) return;
        setPerfil(datosPerfil);
        setCursos(datosCursos);
        setError("");
      })
      .catch((fallo: unknown) => {
        if (!activo) return;
        setError(
          fallo instanceof Error
            ? fallo.message
            : "No se pudo cargar tu resumen docente.",
        );
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [token]);

  const nombreMostrar = perfil
    ? `${perfil.nombres} ${perfil.apellidos}`.trim()
    : "Docente";

  const anioActual = new Date().getFullYear();
  const cursosActivos = cursos.filter(
    (curso) => curso.anioLectivo === anioActual,
  );
  const cursosMostrar = cursosActivos.length > 0 ? cursosActivos : cursos;
  const gradosUnicos = new Set(
    cursosMostrar.map((curso) => `${curso.nivel}-${curso.grado}`),
  ).size;

  const textoTutoria =
    perfil?.esTutor && perfil.gradoTutor
      ? `${perfil.gradoTutor} (${
          perfil.nivelTutor === "INICIAL" ? "Inicial" : "Primaria"
        })`
      : "Sin tutoría asignada";

  return (
    <section
      className="docente-dashboard"
      aria-labelledby="docente-inicio-titulo"
    >
      <header className="docente-dashboard__encabezado">
        <div className="docente-dashboard__saludo">
          <div>
            <h1 id="docente-inicio-titulo">Bienvenido(a), {nombreMostrar}</h1>
            <p>
              Resumen de tus cursos asignados, tutoría y acceso rápido al
              registro de evaluaciones.
            </p>
          </div>

          {perfil?.esTutor && perfil.gradoTutor && (
            <BadgeEstado variante="exito">
              Tutor: {textoTutoria}
            </BadgeEstado>
          )}
        </div>
      </header>

      {cargando ? (
        <div className="docente-dashboard__resumen" aria-busy="true">
          <div>
            <Skeleton alto="1rem" ancho="60%" />
            <Skeleton alto="2rem" ancho="40%" />
          </div>
          <div>
            <Skeleton alto="1rem" ancho="60%" />
            <Skeleton alto="2rem" ancho="40%" />
          </div>
          <div>
            <Skeleton alto="1rem" ancho="60%" />
            <Skeleton alto="2rem" ancho="70%" />
          </div>
        </div>
      ) : (
        <dl className="docente-dashboard__resumen">
          <div>
            <dt>Cursos asignados</dt>
            <dd>{cursosMostrar.length}</dd>
          </div>
          <div>
            <dt>Grados a cargo</dt>
            <dd>{gradosUnicos}</dd>
          </div>
          <div>
            <dt>Tutoría de aula</dt>
            <dd className="docente-dashboard__valor-texto">{textoTutoria}</dd>
          </div>
        </dl>
      )}

      {error && (
        <p className="docente-dashboard__error" role="alert">
          {error}
        </p>
      )}

      <section
        className="docente-dashboard__cursos"
        aria-labelledby="docente-cursos-rapidos-titulo"
      >
        <div className="docente-dashboard__cursos-cabecera">
          <h2 id="docente-cursos-rapidos-titulo">Acceso rápido a tus cursos</h2>
          <Boton variante="principal" onClick={() => navegar("/docente/cursos")}>
            Ver todos mis cursos
          </Boton>
        </div>

        {!cargando && cursosMostrar.length === 0 ? (
          <article className="docente-dashboard__bienvenida">
            <p>Todavía no tienes cursos asignados para este año lectivo.</p>
          </article>
        ) : (
          <div className="docente-dashboard__cursos-grid">
            {cursosMostrar.slice(0, 6).map((curso) => (
              <article key={curso.id} className="docente-dashboard__curso-card">
                <div>
                  <h3>{curso.nombre}</h3>
                  <p>
                    {curso.nivel === "INICIAL" ? "Inicial" : "Primaria"} ·{" "}
                    {curso.grado} · {curso.anioLectivo}
                  </p>
                </div>
                <Link
                  to={`/docente/cursos/${curso.id}`}
                  className="boton boton--secundario"
                >
                  Calificar alumnos
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <section
        className="docente-dashboard__guia"
        aria-labelledby="docente-guia-titulo"
      >
        <h2 id="docente-guia-titulo">Permisos de evaluación</h2>
        <ol>
          <li>
            En todos tus cursos asignados puedes registrar las{" "}
            <strong>notas por competencia</strong> en cada bimestre.
          </li>
          <li>
            Si eres <strong>tutor de aula</strong>, también podrás evaluar la{" "}
            <strong>conducta</strong> y apreciación de los alumnos de tu grado.
          </li>
          <li>
            Las asistencias, tardanzas y evaluación del padre corresponden a la
            administración.
          </li>
        </ol>
      </section>
    </section>
  );
}
