import { useEffect, useState } from "react";
import { obtenerEstudiantes } from "../estudiantes.service";
import type { Estudiante } from "../estudiantes.types";
import { EditarEstudianteModal } from "../components/EditarEstudianteModal";
import "./EstudiantesPage.css";

interface EstudiantesPageProps {
  token: string;
}

export function EstudiantesPage({ token }: EstudiantesPageProps) {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [estudianteEnEdicion, setEstudianteEnEdicion] =
    useState<Estudiante | null>(null);

  useEffect(() => {
    let activo = true;

    obtenerEstudiantes(token)
      .then((datos) => {
        if (activo) setEstudiantes(datos);
      })
      .catch((fallo: unknown) => {
        if (activo) {
          setError(
            fallo instanceof Error
              ? fallo.message
              : "Ocurrió un error inesperado",
          );
        }
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [token]);

  const termino = busqueda.trim().toLowerCase();

  const estudiantesFiltrados = estudiantes.filter((estudiante) => {
    const nombreCompleto =
      `${estudiante.nombres} ${estudiante.apellidos}`.toLowerCase();

    return (
      nombreCompleto.includes(termino) || estudiante.dni.startsWith(termino)
    );
  });

  return (
    <section className="estudiantes-page">
      <h1>Estudiantes</h1>

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
          }}
        />
      )}

      <label htmlFor="buscar-estudiante">Buscar estudiante</label>
      <input
        className="estudiantes-page__busqueda"
        id="buscar-estudiante"
        type="search"
        value={busqueda}
        onChange={(evento) => setBusqueda(evento.target.value)}
        placeholder="Nombre, apellido o DNI"
      />

      {cargando && <p>Cargando estudiantes...</p>}
      {error && <p role="alert">{error}</p>}

      {!cargando && !error && estudiantes.length === 0 && (
        <p>Todavía no hay estudiantes registrados.</p>
      )}

      {!cargando &&
        !error &&
        estudiantes.length > 0 &&
        estudiantesFiltrados.length === 0 && (
          <p>No se encontraron estudiantes con esa búsqueda.</p>
        )}

      {!cargando && !error && estudiantes.length > 0 && (
        <div className="estudiantes-page__tabla">
          <table>
            <thead>
              <tr>
                <th>DNI</th>
                <th>Estudiante</th>
                <th>Fecha de nacimiento</th>
                <th>Apoderado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {estudiantesFiltrados.map((estudiante) => (
                <tr key={estudiante.id}>
                  <td>{estudiante.dni}</td>
                  <td>
                    {estudiante.nombres} {estudiante.apellidos}
                  </td>
                  <td>{estudiante.fechaNacimiento}</td>
                  <td>{estudiante.nombreApoderado ?? "Sin apoderado"}</td>
                  <td>
                    <button
                      type="button"
                      className="estudiantes-page__editar"
                      onClick={() => setEstudianteEnEdicion(estudiante)}
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
    </section>
  );
}
