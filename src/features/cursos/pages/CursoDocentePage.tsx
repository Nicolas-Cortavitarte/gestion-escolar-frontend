import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Boton } from "../../../shared/components/Boton";
import { obtenerMisCursos } from "../cursos.service";
import type { Curso } from "../cursos.types";
import { CursoEstudiantesPage } from "./CursoEstudiantesPage";

interface CursoDocentePageProps {
  token: string;
}

export function CursoDocentePage({ token }: CursoDocentePageProps) {
  const { cursoId } = useParams<{ cursoId: string }>();

  return (
    <ContenidoCurso
      key={`${token}-${cursoId ?? ""}`}
      token={token}
      cursoId={cursoId}
    />
  );
}

interface ContenidoCursoProps {
  token: string;
  cursoId: string | undefined;
}

function ContenidoCurso({ token, cursoId }: ContenidoCursoProps) {
  const navegar = useNavigate();
  const [curso, setCurso] = useState<Curso | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let activo = true;

    obtenerMisCursos(token)
      .then((cursos) => {
        if (!activo) return;

        setCurso(cursos.find((item) => item.id === cursoId) ?? null);
      })
      .catch((fallo: unknown) => {
        if (!activo) return;

        setError(
          fallo instanceof Error
            ? fallo.message
            : "No se pudo cargar el curso.",
        );
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [token, cursoId, intento]);

  function reintentar() {
    setError("");
    setCargando(true);
    setIntento((actual) => actual + 1);
  }

  if (cargando) {
    return <p role="status">Cargando curso…</p>;
  }

  if (error) {
    return (
      <section aria-labelledby="curso-error-titulo">
        <h1 id="curso-error-titulo">No se pudo cargar el curso</h1>
        <p role="alert">{error}</p>
        <Boton onClick={reintentar}>Reintentar</Boton>
      </section>
    );
  }

  if (!curso) {
    return (
      <section aria-labelledby="curso-no-disponible-titulo">
        <h1 id="curso-no-disponible-titulo">Curso no disponible</h1>
        <p>El curso no existe o ya no está asignado a tu cuenta.</p>
        <Boton onClick={() => navegar("/docente/cursos")}>
          Volver a mis cursos
        </Boton>
      </section>
    );
  }

  return (
    <CursoEstudiantesPage
      token={token}
      curso={curso}
      onVolver={() => navegar("/docente/cursos")}
    />
  );
}
