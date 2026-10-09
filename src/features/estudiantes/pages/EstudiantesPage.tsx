import { useEffect, useState } from "react";
import { Link } from "react-router";
import { obtenerEstudiantes } from "../estudiantes.service";
import type { Estudiante } from "../estudiantes.types";
import { EditarEstudianteModal } from "../components/EditarEstudianteModal";
import { CampoEntrada } from "../../../shared/components/CampoEntrada";
import { Boton } from "../../../shared/components/Boton";
import { Paginacion } from "../../../shared/components/Paginacion";
import "./EstudiantesPage.css";
import "../../../styles/listados.css";

interface EstudiantesPageProps {
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

function mostrarFecha(fecha: string) {
  const partes = fecha.split("-");

  return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : fecha;
}

export function EstudiantesPage({ token }: EstudiantesPageProps) {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [intento, setIntento] = useState(0);
  const [mensaje, setMensaje] = useState("");
  const [estudianteEnEdicion, setEstudianteEnEdicion] =
    useState<Estudiante | null>(null);

  useEffect(() => {
    let activo = true;

    obtenerEstudiantes(token)
      .then((datos) => {
        if (activo) {
          setEstudiantes(datos);
          setError("");
        }
      })
      .catch((fallo: unknown) => {
        if (activo) {
          setError(
            fallo instanceof Error
              ? fallo.message
              : "No se pudieron cargar los estudiantes.",
          );
        }
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [token, intento]);

  const termino = normalizar(busqueda);

  const filtrados = estudiantes
    .filter((estudiante) => {
      const nombre = normalizar(
        `${estudiante.nombres} ${estudiante.apellidos}`,
      );

      return nombre.includes(termino) || estudiante.dni.startsWith(termino);
    })
    .sort(
      (a, b) =>
        a.apellidos.localeCompare(b.apellidos, "es") ||
        a.nombres.localeCompare(b.nombres, "es") ||
        a.id.localeCompare(b.id),
    );

  const paginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, paginas);
  const visibles = filtrados.slice(
    (paginaActual - 1) * POR_PAGINA,
    paginaActual * POR_PAGINA,
  );

  function editar(estudiante: Estudiante) {
    setMensaje("");
    setEstudianteEnEdicion(estudiante);
  }

  function reintentar() {
    setError("");
    setCargando(true);
    setIntento((actual) => actual + 1);
  }

  return (
    <section className="estudiantes-page">
      <header className="estudiantes-page__encabezado">
        <h1>Estudiantes</h1>
        <p>Busca estudiantes y actualiza sus datos personales.</p>
      </header>

      <div className="estudiantes-page__busqueda">
        <CampoEntrada
          id="buscar-estudiante"
          etiqueta="Buscar estudiante"
          type="search"
          value={busqueda}
          onChange={(evento) => {
            setBusqueda(evento.target.value);
            setPagina(1);
          }}
          placeholder="Nombre, apellido o DNI"
          ayuda="Puedes buscar nombres con o sin tildes."
          disabled={cargando}
        />
      </div>

      {mensaje && (
        <p className="estudiantes-page__exito" role="status">
          {mensaje}
        </p>
      )}

      {cargando && (
        <p className="estado-listado" role="status">
          Cargando estudiantes...
        </p>
      )}

      {!cargando && error && (
        <div className="estado-listado">
          <p className="estado-listado__error" role="alert">
            {error}
          </p>
          <Boton onClick={reintentar}>Reintentar</Boton>
        </div>
      )}

      {!cargando && !error && estudiantes.length === 0 && (
        <div className="estado-listado">
          <h2>Todavía no hay estudiantes registrados</h2>
          <p>Registra al estudiante desde el proceso de nueva matrícula.</p>
          <Link to="/admin/matriculas/nueva" className="boton boton--principal">
            Nueva matrícula
          </Link>
        </div>
      )}

      {!cargando &&
        !error &&
        estudiantes.length > 0 &&
        filtrados.length === 0 && (
          <div className="estado-listado">
            <h2>No encontramos estudiantes</h2>
            <p>Revisa el nombre o DNI, o limpia la búsqueda.</p>
            <Boton
              onClick={() => {
                setBusqueda("");
                setPagina(1);
              }}
            >
              Limpiar búsqueda
            </Boton>
          </div>
        )}

      {!cargando && !error && filtrados.length > 0 && (
        <>
          <div className="tabla-listado">
            <table>
              <caption className="solo-lectores">
                Estudiantes registrados, ordenados por apellido
              </caption>

              <thead>
                <tr>
                  <th scope="col">DNI</th>
                  <th scope="col">Estudiante</th>
                  <th scope="col">Fecha de nacimiento</th>
                  <th scope="col">Apoderado</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {visibles.map((estudiante) => (
                  <tr key={estudiante.id}>
                    <td data-label="DNI">{estudiante.dni}</td>
                    <td data-label="Estudiante">
                      {estudiante.nombres} {estudiante.apellidos}
                    </td>
                    <td data-label="Fecha de nacimiento">
                      {mostrarFecha(estudiante.fechaNacimiento)}
                    </td>
                    <td data-label="Apoderado">
                      {estudiante.nombreApoderado ?? "Sin apoderado"}
                    </td>
                    <td data-label="Acciones">
                      <Boton
                        onClick={() => editar(estudiante)}
                        aria-label={`Editar datos de ${estudiante.nombres} ${estudiante.apellidos}`}
                      >
                        Editar
                      </Boton>
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

      {estudianteEnEdicion && (
        <EditarEstudianteModal
          key={estudianteEnEdicion.id}
          token={token}
          estudiante={estudianteEnEdicion}
          onCerrar={() => setEstudianteEnEdicion(null)}
          onActualizado={(actualizado) => {
            setEstudiantes((anteriores) =>
              anteriores.map((estudiante) =>
                estudiante.id === actualizado.id ? actualizado : estudiante,
              ),
            );
            setEstudianteEnEdicion(null);
            setMensaje(
              "Los datos del estudiante se actualizaron correctamente.",
            );
          }}
        />
      )}
    </section>
  );
}
