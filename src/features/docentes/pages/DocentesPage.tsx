import { useEffect, useState, useRef } from "react";
import { obtenerDocentes, cambiarEstadoDocente } from "../docentes.service";
import type { Docente } from "../docentes.types";
import { DocenteModal } from "../components/DocenteModal";
import "./DocentesPage.css";

interface DocentesPageProps {
  token: string;
}

const moneda = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

export function DocentesPage({ token }: DocentesPageProps) {
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [docenteEditando, setDocenteEditando] = useState<Docente | null>(null);
  const [docenteEstado, setDocenteEstado] = useState<Docente | null>(null);
  const [cambiandoId, setCambiandoId] = useState<string | null>(null);
  const [errorEstado, setErrorEstado] = useState("");

  useEffect(() => {
    let activo = true;

    obtenerDocentes(token)
      .then((datos) => {
        if (!activo) return;

        setDocentes(datos);
        setError("");
      })
      .catch((fallo: unknown) => {
        if (!activo) return;

        setError(
          fallo instanceof Error
            ? fallo.message
            : "No se pudieron cargar los docentes.",
        );
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [token]);

  const termino = busqueda.trim().toLocaleLowerCase("es");

  const filtrados = docentes
    .filter((docente) => {
      const coincideBusqueda =
        `${docente.dni} ${docente.nombres} ${docente.apellidos}`
          .toLocaleLowerCase("es")
          .includes(termino);

      const coincideEstado =
        estado === "" ||
        (estado === "activo" && docente.activo) ||
        (estado === "inactivo" && !docente.activo);

      return coincideBusqueda && coincideEstado;
    })
    .sort((a, b) =>
      `${a.apellidos} ${a.nombres}`.localeCompare(
        `${b.apellidos} ${b.nombres}`,
        "es",
      ),
    );

  async function confirmarCambioEstado(docente: Docente) {
    if (cambiandoId !== null) return;

    const nuevoEstado = !docente.activo;

    setCambiandoId(docente.id);
    setMensaje("");
    setErrorEstado("");

    try {
      await cambiarEstadoDocente(token, docente.id, nuevoEstado);

      setDocentes((actuales) =>
        actuales.map((item) =>
          item.id === docente.id ? { ...item, activo: nuevoEstado } : item,
        ),
      );

      setMensaje(
        `Docente ${docente.nombres} ${docente.apellidos} ${
          nuevoEstado ? "reactivado" : "desactivado"
        } correctamente.`,
      );
    } catch (fallo: unknown) {
      setErrorEstado(
        fallo instanceof Error
          ? fallo.message
          : "No se pudo cambiar el estado del docente.",
      );
    } finally {
      setCambiandoId(null);
    }
  }

  return (
    <section className="docentes">
      <header className="docentes__encabezado">
        <h1>Docentes</h1>
        <p>Consulta los docentes registrados y el estado de sus cuentas.</p>
      </header>

      {!mostrarFormulario && (
        <button
          type="button"
          className="docentes__boton"
          onClick={() => {
            setMensaje("");
            setDocenteEditando(null);
            setMostrarFormulario(true);
          }}
          disabled={cambiandoId !== null}
        >
          Nuevo docente
        </button>
      )}

      {mostrarFormulario && (
        <DocenteModal
          key={docenteEditando?.id ?? "nuevo"}
          token={token}
          docente={docenteEditando ?? undefined}
          onCerrar={() => {
            setMostrarFormulario(false);
            setDocenteEditando(null);
          }}
          onGuardado={(guardado) => {
            const esEdicion = docenteEditando !== null;

            setDocentes((actuales) =>
              esEdicion
                ? actuales.map((item) =>
                    item.id === guardado.id ? guardado : item,
                  )
                : [...actuales, guardado],
            );

            setMostrarFormulario(false);
            setDocenteEditando(null);
            setBusqueda("");
            setEstado("");
            setMensaje(
              `Docente ${guardado.nombres} ${guardado.apellidos} ${
                esEdicion ? "actualizado" : "registrado"
              } correctamente.`,
            );
          }}
        />
      )}

      {mensaje && <p role="status">{mensaje}</p>}

      {errorEstado && <p role="alert">{errorEstado}</p>}

      <div className="docentes__filtros">
        <div className="docentes__campo">
          <label htmlFor="docentes-busqueda">Buscar docente</label>
          <input
            id="docentes-busqueda"
            type="search"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="DNI, nombres o apellidos"
          />
        </div>

        <div className="docentes__campo">
          <label htmlFor="docentes-estado">Estado</label>
          <select
            id="docentes-estado"
            value={estado}
            onChange={(evento) => setEstado(evento.target.value)}
          >
            <option value="">Todos</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
        </div>
      </div>

      {cargando && <p role="status">Cargando docentes...</p>}
      {error && <p role="alert">{error}</p>}

      {!cargando && !error && filtrados.length === 0 && (
        <p>No hay docentes que coincidan con los filtros.</p>
      )}

      {!cargando && !error && filtrados.length > 0 && (
        <div
          className="docentes__tabla-contenedor"
          role="region"
          aria-label="Listado de docentes"
          tabIndex={0}
        >
          <table>
            <thead>
              <tr>
                <th scope="col">DNI</th>
                <th scope="col">Nombres</th>
                <th scope="col">Apellidos</th>
                <th scope="col">Sueldo mensual</th>
                <th scope="col">Estado</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filtrados.map((docente) => (
                <tr key={docente.id}>
                  <td>{docente.dni}</td>
                  <td>{docente.nombres}</td>
                  <td>{docente.apellidos}</td>
                  <td>{moneda.format(docente.sueldoMensual)}</td>
                  <td>
                    <span
                      className={`docentes__estado ${
                        docente.activo
                          ? "docentes__estado--activo"
                          : "docentes__estado--inactivo"
                      }`}
                    >
                      {docente.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div className="docentes__acciones-fila">
                      <button
                        type="button"
                        className="docentes__boton-secundario"
                        disabled={mostrarFormulario || cambiandoId !== null}
                        onClick={() => {
                          setMensaje("");
                          setErrorEstado("");
                          setDocenteEditando(docente);
                          setMostrarFormulario(true);
                        }}
                        aria-label={`Editar a ${docente.nombres} ${docente.apellidos}`}
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        className={
                          docente.activo
                            ? "docentes__boton-desactivar"
                            : "docentes__boton-secundario"
                        }
                        disabled={mostrarFormulario || cambiandoId !== null}
                        onClick={() => {
                          setMensaje("");
                          setErrorEstado("");
                          setDocenteEstado(docente);
                        }}
                        aria-label={`${
                          docente.activo ? "Desactivar" : "Reactivar"
                        } a ${docente.nombres} ${docente.apellidos}`}
                      >
                        {cambiandoId === docente.id
                          ? "Actualizando..."
                          : docente.activo
                            ? "Desactivar"
                            : "Reactivar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {docenteEstado && (
        <ConfirmarEstadoDocenteModal
          docente={docenteEstado}
          onCancelar={() => setDocenteEstado(null)}
          onConfirmar={() => {
            const seleccionado = docenteEstado;
            setDocenteEstado(null);
            void confirmarCambioEstado(seleccionado);
          }}
        />
      )}
    </section>
  );
}

interface ConfirmarEstadoDocenteModalProps {
  docente: Docente;
  onCancelar: () => void;
  onConfirmar: () => void;
}

function ConfirmarEstadoDocenteModal({
  docente,
  onCancelar,
  onConfirmar,
}: ConfirmarEstadoDocenteModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const accion = docente.activo ? "Desactivar" : "Reactivar";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    dialog.showModal();

    return () => {
      dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="docentes__modal docentes__modal--confirmacion"
      aria-labelledby="docente-estado-titulo"
      aria-describedby="docente-estado-descripcion"
      onCancel={(evento) => {
        evento.preventDefault();
        onCancelar();
      }}
    >
      <h2 id="docente-estado-titulo">{accion} docente</h2>

      <p>
        <strong>
          {docente.nombres} {docente.apellidos}
        </strong>
      </p>

      <p id="docente-estado-descripcion">
        {docente.activo
          ? "Su cuenta quedará inactiva. Si tiene cursos asignados, el sistema rechazará la desactivación."
          : "Su cuenta volverá a estar activa."}
      </p>

      <div className="docentes__acciones">
        <button
          type="button"
          className="docentes__boton-secundario"
          onClick={onCancelar}
          autoFocus
        >
          Cancelar
        </button>

        <button
          type="button"
          className={
            docente.activo ? "docentes__boton-desactivar" : "docentes__boton"
          }
          onClick={onConfirmar}
        >
          {accion}
        </button>
      </div>
    </dialog>
  );
}
