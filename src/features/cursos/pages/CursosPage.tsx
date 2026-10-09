import { useEffect, useState } from "react";
import { obtenerCursos } from "../cursos.service";
import type { Curso } from "../cursos.types";
import { CursoModal } from "../components/CursoModal";
import { CompetenciasModal } from "../../competencias/components/CompetenciasModal";
import { Boton } from "../../../shared/components/Boton";
import { CampoEntrada } from "../../../shared/components/CampoEntrada";
import { BadgeEstado } from "../../../shared/components/BadgeEstado";
import { Paginacion } from "../../../shared/components/Paginacion";
import "../../../styles/listados.css";
import "./CursosPage.css";

interface CursosPageProps {
  token: string;
}

const POR_PAGINA = 10;

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim();
}

function mostrarNivel(nivel: string) {
  if (nivel === "INICIAL") return "Inicial";
  if (nivel === "PRIMARIA") return "Primaria";
  return nivel;
}

export function CursosPage({ token }: CursosPageProps) {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0);

  const [busqueda, setBusqueda] = useState("");
  const [anio, setAnio] = useState(String(new Date().getFullYear()));
  const [nivel, setNivel] = useState("");
  const [grado, setGrado] = useState("");
  const [pagina, setPagina] = useState(1);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [cursoEditando, setCursoEditando] = useState<Curso | null>(null);
  const [cursoCompetencias, setCursoCompetencias] = useState<Curso | null>(
    null,
  );
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
  }, [token, intento]);

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

  const termino = normalizar(busqueda);

  const filtrados = cursosDelAnio
    .filter(
      (curso) =>
        normalizar(curso.nombre).includes(termino) &&
        (nivel === "" || curso.nivel === nivel) &&
        (grado === "" || curso.grado === grado),
    )
    .sort(
      (a, b) =>
        a.nivel.localeCompare(b.nivel, "es") ||
        a.grado.localeCompare(b.grado, "es", { numeric: true }) ||
        a.nombre.localeCompare(b.nombre, "es") ||
        a.id.localeCompare(b.id),
    );

  const paginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, paginas);
  const visibles = filtrados.slice(
    (paginaActual - 1) * POR_PAGINA,
    paginaActual * POR_PAGINA,
  );

  function abrirCurso(curso: Curso | null) {
    setMensaje("");
    setCursoEditando(curso);
    setMostrarModal(true);
  }

  return (
    <section className="cursos">
      <header className="cursos__encabezado">
        <div>
          <h1>Cursos y competencias</h1>
          <p>Consulta los cursos del año y sus docentes asignados.</p>
        </div>

        <Boton
          variante="principal"
          onClick={() => abrirCurso(null)}
          disabled={cargando || Boolean(error)}
        >
          Nuevo curso
        </Boton>
      </header>

      {mensaje && (
        <p className="cursos__exito" role="status">
          {mensaje}
        </p>
      )}

      <div className="cursos__filtros">
        <div className="campo">
          <label className="campo__etiqueta" htmlFor="cursos-anio">
            Año lectivo
          </label>
          <select
            id="cursos-anio"
            className="campo__entrada"
            value={anio}
            onChange={(evento) => {
              setAnio(evento.target.value);
              setNivel("");
              setGrado("");
              setPagina(1);
            }}
            disabled={cargando}
          >
            {anios.map((valor) => (
              <option key={valor} value={valor}>
                {valor}
              </option>
            ))}
          </select>
        </div>

        <CampoEntrada
          id="cursos-busqueda"
          etiqueta="Buscar curso"
          type="search"
          value={busqueda}
          onChange={(evento) => {
            setBusqueda(evento.target.value);
            setPagina(1);
          }}
          placeholder="Nombre del curso"
          disabled={cargando}
        />

        <div className="campo">
          <label className="campo__etiqueta" htmlFor="cursos-nivel">
            Nivel
          </label>
          <select
            id="cursos-nivel"
            className="campo__entrada"
            value={nivel}
            onChange={(evento) => {
              setNivel(evento.target.value);
              setGrado("");
              setPagina(1);
            }}
            disabled={cargando}
          >
            <option value="">Todos</option>
            {niveles.map((valor) => (
              <option key={valor} value={valor}>
                {mostrarNivel(valor)}
              </option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label className="campo__etiqueta" htmlFor="cursos-grado">
            Grado
          </label>
          <select
            id="cursos-grado"
            className="campo__entrada"
            value={grado}
            onChange={(evento) => {
              setGrado(evento.target.value);
              setPagina(1);
            }}
            disabled={cargando}
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

      {cargando && (
        <p className="estado-listado" role="status">
          Cargando cursos...
        </p>
      )}

      {!cargando && error && (
        <div className="estado-listado">
          <p className="estado-listado__error" role="alert">
            {error}
          </p>
          <Boton
            onClick={() => {
              setError("");
              setCargando(true);
              setIntento((actual) => actual + 1);
            }}
          >
            Reintentar
          </Boton>
        </div>
      )}

      {!cargando && !error && cursos.length === 0 && (
        <div className="estado-listado">
          <h2>Todavía no hay cursos registrados</h2>
          <p>Utiliza «Nuevo curso» para configurar el año, nivel y grado.</p>
        </div>
      )}

      {!cargando && !error && cursos.length > 0 && filtrados.length === 0 && (
        <div className="estado-listado">
          <h2>No hay cursos para estos filtros</h2>
          <p>Prueba otro año o limpia la búsqueda, el nivel y el grado.</p>
          <Boton
            onClick={() => {
              setBusqueda("");
              setNivel("");
              setGrado("");
              setPagina(1);
            }}
          >
            Limpiar búsqueda, nivel y grado
          </Boton>
        </div>
      )}

      {!cargando && !error && filtrados.length > 0 && (
        <>
          <div
            className="tabla-listado"
            role="region"
            aria-label="Listado de cursos"
            tabIndex={0}
          >
            <table>
              <caption className="solo-lectores">Cursos del año {anio}</caption>
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
                {visibles.map((curso) => (
                  <tr key={curso.id}>
                    <td data-label="Curso">{curso.nombre}</td>
                    <td data-label="Nivel">{mostrarNivel(curso.nivel)}</td>
                    <td data-label="Grado">{curso.grado}</td>
                    <td data-label="Año lectivo">{curso.anioLectivo}</td>
                    <td data-label="Docente">
                      {curso.docenteId ? (
                        (curso.nombresDocente ?? "Docente asignado")
                      ) : (
                        <BadgeEstado variante="pendiente">
                          Sin asignar
                        </BadgeEstado>
                      )}
                    </td>
                    <td data-label="Acciones">
                      <div className="cursos__acciones-fila">
                        <Boton
                          onClick={() => abrirCurso(curso)}
                          aria-label={`Editar ${curso.nombre}, ${curso.nivel}, ${curso.grado}`}
                        >
                          Editar
                        </Boton>

                        <Boton
                          onClick={() => setCursoCompetencias(curso)}
                          aria-label={`Ver competencias de ${curso.nombre}, ${curso.nivel}, ${curso.grado}`}
                        >
                          Competencias
                        </Boton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Paginacion
            pagina={paginaActual}
            total={filtrados.length}
            porPagina={POR_PAGINA}
            onCambiar={setPagina}
          />
        </>
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
            setPagina(1);
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

      {cursoCompetencias && (
        <CompetenciasModal
          key={cursoCompetencias.id}
          token={token}
          curso={cursoCompetencias}
          onCerrar={() => setCursoCompetencias(null)}
        />
      )}
    </section>
  );
}
