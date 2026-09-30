import { useEffect, useState } from "react";
import { obtenerCursos } from "../cursos.service";
import type { Curso } from "../cursos.types";
import { CursoModal } from "../components/CursoModal";
import "./CursosPage.css";

interface CursosPageProps {
  token: string;
}

export function CursosPage({ token }: CursosPageProps) {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [anio, setAnio] = useState(String(new Date().getFullYear()));
  const [nivel, setNivel] = useState("");
  const [grado, setGrado] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [cursoEditando, setCursoEditando] = useState<Curso | null>(null);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    let activo = true;

    obtenerCursos(token)
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
            : "No se pudieron cargar los cursos.",
        );
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [token]);

  const anios = Array.from(
    new Set([
      new Date().getFullYear(),
      ...cursos.map((curso) => curso.anioLectivo),
    ]),
  ).sort((a, b) => b - a);

  const cursosDelAnio = cursos.filter(
    (curso) => curso.anioLectivo === Number(anio),
  );

  const niveles = Array.from(
    new Set(cursosDelAnio.map((curso) => curso.nivel)),
  ).sort((a, b) => a.localeCompare(b, "es"));

  const grados = Array.from(
    new Set(
      cursosDelAnio
        .filter((curso) => nivel === "" || curso.nivel === nivel)
        .map((curso) => curso.grado),
    ),
  ).sort((a, b) => a.localeCompare(b, "es", { numeric: true }));

  const termino = busqueda.trim().toLocaleLowerCase("es");

  const filtrados = cursosDelAnio
    .filter(
      (curso) =>
        curso.nombre.toLocaleLowerCase("es").includes(termino) &&
        (nivel === "" || curso.nivel === nivel) &&
        (grado === "" || curso.grado === grado),
    )
    .sort(
      (a, b) =>
        a.nivel.localeCompare(b.nivel, "es") ||
        a.grado.localeCompare(b.grado, "es", { numeric: true }) ||
        a.nombre.localeCompare(b.nombre, "es"),
    );

  return (
    <section className="cursos">
      <header className="cursos__encabezado">
        <h1>Cursos</h1>
        <p>Consulta los cursos del año lectivo y sus docentes asignados.</p>
      </header>

      <button
        type="button"
        className="cursos__boton"
        onClick={() => {
          setMensaje("");
          setCursoEditando(null);
          setMostrarModal(true);
        }}
      >
        Nuevo curso
      </button>

      {mensaje && <p role="status">{mensaje}</p>}

      <div className="cursos__filtros">
        <div className="cursos__campo">
          <label htmlFor="cursos-anio">Año lectivo</label>
          <select
            id="cursos-anio"
            value={anio}
            onChange={(evento) => {
              setAnio(evento.target.value);
              setNivel("");
              setGrado("");
            }}
          >
            {anios.map((valor) => (
              <option key={valor} value={valor}>
                {valor}
              </option>
            ))}
          </select>
        </div>

        <div className="cursos__campo">
          <label htmlFor="cursos-busqueda">Buscar curso</label>
          <input
            id="cursos-busqueda"
            type="search"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Nombre del curso"
          />
        </div>

        <div className="cursos__campo">
          <label htmlFor="cursos-nivel">Nivel</label>
          <select
            id="cursos-nivel"
            value={nivel}
            onChange={(evento) => {
              setNivel(evento.target.value);
              setGrado("");
            }}
          >
            <option value="">Todos</option>
            {niveles.map((valor) => (
              <option key={valor} value={valor}>
                {valor}
              </option>
            ))}
          </select>
        </div>

        <div className="cursos__campo">
          <label htmlFor="cursos-grado">Grado</label>
          <select
            id="cursos-grado"
            value={grado}
            onChange={(evento) => setGrado(evento.target.value)}
          >
            <option value="">Todos</option>
            {grados.map((valor) => (
              <option key={valor} value={valor}>
                {valor}
              </option>
            ))}
          </select>
        </div>
      </div>

      {cargando && <p role="status">Cargando cursos...</p>}
      {error && <p role="alert">{error}</p>}

      {!cargando && !error && filtrados.length === 0 && (
        <p>No hay cursos que coincidan con los filtros.</p>
      )}

      {!cargando && !error && filtrados.length > 0 && (
        <div
          className="cursos__tabla-contenedor"
          role="region"
          aria-label="Listado de cursos"
          tabIndex={0}
        >
          <table>
            <thead>
              <tr>
                <th scope="col">Curso</th>
                <th scope="col">Nivel</th>
                <th scope="col">Grado</th>
                <th scope="col">Año lectivo</th>
                <th scope="col">Docente</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filtrados.map((curso) => (
                <tr key={curso.id}>
                  <td>{curso.nombre}</td>
                  <td>{curso.nivel}</td>
                  <td>{curso.grado}</td>
                  <td>{curso.anioLectivo}</td>
                  <td>
                    {curso.docenteId ? (
                      (curso.nombresDocente ?? "Docente asignado")
                    ) : (
                      <span className="cursos__sin-docente">Sin asignar</span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="cursos__boton-secundario"
                      onClick={() => {
                        setMensaje("");
                        setCursoEditando(curso);
                        setMostrarModal(true);
                      }}
                      aria-label={`Editar ${curso.nombre}, ${curso.nivel}, ${curso.grado}`}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {mostrarModal && (
        <CursoModal
          key={cursoEditando?.id ?? "nuevo"}
          token={token}
          curso={cursoEditando ?? undefined}
          anioInicial={Number(anio)}
          onCerrar={() => {
            setMostrarModal(false);
            setCursoEditando(null);
          }}
          onGuardado={(guardado) => {
            const esEdicion = cursoEditando !== null;

            setCursos((actuales) =>
              esEdicion
                ? actuales.map((item) =>
                    item.id === guardado.id ? guardado : item,
                  )
                : [...actuales, guardado],
            );

            setAnio(String(guardado.anioLectivo));
            setBusqueda("");
            setNivel("");
            setGrado("");
            setMostrarModal(false);
            setCursoEditando(null);
            setMensaje(
              `Curso ${guardado.nombre} ${
                esEdicion ? "actualizado" : "registrado"
              } correctamente.`,
            );
          }}
        />
      )}
    </section>
  );
}
