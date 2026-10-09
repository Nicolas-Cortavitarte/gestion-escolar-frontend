import { useEffect, useId, useRef, useState } from "react";
import { obtenerDocentes, cambiarEstadoDocente } from "../docentes.service";
import type { Docente } from "../docentes.types";
import { DocenteModal } from "../components/DocenteModal";
import { Boton } from "../../../shared/components/Boton";
import { CampoEntrada } from "../../../shared/components/CampoEntrada";
import { BadgeEstado } from "../../../shared/components/BadgeEstado";
import { Paginacion } from "../../../shared/components/Paginacion";
import "../../../styles/listados.css";
import "./DocentesPage.css";

interface DocentesPageProps {
  token: string;
}

const POR_PAGINA = 10;

const moneda = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim();
}

export function DocentesPage({ token }: DocentesPageProps) {
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const [pagina, setPagina] = useState(1);
  const [mensaje, setMensaje] = useState("");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [docenteEditando, setDocenteEditando] = useState<Docente | null>(null);
  const [docenteEstado, setDocenteEstado] = useState<Docente | null>(null);
  const [cambiando, setCambiando] = useState(false);
  const [errorEstado, setErrorEstado] = useState("");

  const cambiandoRef = useRef(false);

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
  }, [token, intento]);

  const termino = normalizar(busqueda);

  const filtrados = docentes
    .filter(
      (docente) =>
        normalizar(
          `${docente.dni} ${docente.nombres} ${docente.apellidos}`,
        ).includes(termino) &&
        (estado === "" ||
          (estado === "activo" && docente.activo) ||
          (estado === "inactivo" && !docente.activo)),
    )
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

  function abrirFormulario(docente: Docente | null) {
    setMensaje("");
    setDocenteEditando(docente);
    setMostrarFormulario(true);
  }

  function cerrarEstado() {
    if (cambiandoRef.current) return;
    setDocenteEstado(null);
    setErrorEstado("");
  }

  async function confirmarCambioEstado() {
    const seleccionado = docenteEstado;

    if (!seleccionado || cambiandoRef.current) return;

    const nuevoEstado = !seleccionado.activo;
    cambiandoRef.current = true;
    setCambiando(true);
    setErrorEstado("");

    try {
      await cambiarEstadoDocente(token, seleccionado.id, nuevoEstado);

      setDocentes((actuales) =>
        actuales.map((item) =>
          item.id === seleccionado.id ? { ...item, activo: nuevoEstado } : item,
        ),
      );

      setDocenteEstado(null);
      setMensaje(
        `Docente ${seleccionado.nombres} ${seleccionado.apellidos} ${
          nuevoEstado ? "reactivado" : "desactivado"
        } correctamente.`,
      );
    } catch (fallo: unknown) {
      setErrorEstado(
        fallo instanceof Error
          ? fallo.message
          : "No se pudo cambiar el estado. Inténtalo nuevamente.",
      );
    } finally {
      cambiandoRef.current = false;
      setCambiando(false);
    }
  }

  return (
    <section className="docentes">
      <header className="docentes__encabezado">
        <div>
          <h1>Docentes</h1>
          <p>Consulta sus datos y administra el estado de sus cuentas.</p>
        </div>

        <Boton
          variante="principal"
          onClick={() => abrirFormulario(null)}
          disabled={cargando || Boolean(error) || cambiando}
        >
          Nuevo docente
        </Boton>
      </header>

      <div className="docentes__filtros">
        <CampoEntrada
          id="docentes-busqueda"
          etiqueta="Buscar docente"
          type="search"
          value={busqueda}
          onChange={(evento) => {
            setBusqueda(evento.target.value);
            setPagina(1);
          }}
          placeholder="DNI, nombres o apellidos"
          disabled={cargando}
        />

        <div className="campo">
          <label className="campo__etiqueta" htmlFor="docentes-estado">
            Estado de la cuenta
          </label>
          <select
            id="docentes-estado"
            className="campo__entrada"
            value={estado}
            onChange={(evento) => {
              setEstado(evento.target.value);
              setPagina(1);
            }}
            disabled={cargando}
          >
            <option value="">Todos</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
        </div>
      </div>

      {mensaje && (
        <p className="docentes__exito" role="status">
          {mensaje}
        </p>
      )}

      {cargando && (
        <p className="estado-listado" role="status">
          Cargando docentes...
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

      {!cargando && !error && docentes.length === 0 && (
        <div className="estado-listado">
          <h2>Todavía no hay docentes registrados</h2>
          <p>Utiliza «Nuevo docente» para registrar su información y cuenta.</p>
        </div>
      )}

      {!cargando && !error && docentes.length > 0 && filtrados.length === 0 && (
        <div className="estado-listado">
          <h2>No encontramos docentes</h2>
          <p>Revisa la búsqueda o cambia el estado seleccionado.</p>
          <Boton
            onClick={() => {
              setBusqueda("");
              setEstado("");
              setPagina(1);
            }}
          >
            Limpiar filtros
          </Boton>
        </div>
      )}

      {!cargando && !error && filtrados.length > 0 && (
        <>
          <div
            className="tabla-listado"
            role="region"
            aria-label="Listado de docentes"
            tabIndex={0}
          >
            <table>
              <caption className="solo-lectores">
                Docentes registrados, ordenados por apellido
              </caption>
              <thead>
                <tr>
                  <th scope="col">DNI</th>
                  <th scope="col">Docente</th>
                  <th scope="col">Sueldo mensual</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((docente) => (
                  <tr key={docente.id}>
                    <td data-label="DNI">{docente.dni}</td>
                    <td data-label="Docente">
                      {docente.nombres} {docente.apellidos}
                    </td>
                    <td data-label="Sueldo mensual">
                      {moneda.format(docente.sueldoMensual)}
                    </td>
                    <td data-label="Estado">
                      <BadgeEstado
                        variante={docente.activo ? "exito" : "neutro"}
                      >
                        {docente.activo ? "Activo" : "Inactivo"}
                      </BadgeEstado>
                    </td>
                    <td data-label="Acciones">
                      <div className="docentes__acciones-fila">
                        <Boton
                          onClick={() => abrirFormulario(docente)}
                          aria-label={`Editar a ${docente.nombres} ${docente.apellidos}`}
                        >
                          Editar
                        </Boton>

                        <Boton
                          onClick={() => {
                            setMensaje("");
                            setErrorEstado("");
                            setDocenteEstado(docente);
                          }}
                          aria-label={`${
                            docente.activo ? "Desactivar" : "Reactivar"
                          } a ${docente.nombres} ${docente.apellidos}`}
                        >
                          {docente.activo ? "Desactivar" : "Reactivar"}
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
            setPagina(1);
            setMensaje(
              `Docente ${guardado.nombres} ${guardado.apellidos} ${
                esEdicion ? "actualizado" : "registrado"
              } correctamente.`,
            );
          }}
        />
      )}

      {docenteEstado && (
        <ConfirmarEstadoDocenteModal
          docente={docenteEstado}
          cambiando={cambiando}
          error={errorEstado}
          onCancelar={cerrarEstado}
          onConfirmar={() => void confirmarCambioEstado()}
        />
      )}
    </section>
  );
}

interface ConfirmarEstadoDocenteModalProps {
  docente: Docente;
  cambiando: boolean;
  error: string;
  onCancelar: () => void;
  onConfirmar: () => void;
}

function ConfirmarEstadoDocenteModal({
  docente,
  cambiando,
  error,
  onCancelar,
  onConfirmar,
}: ConfirmarEstadoDocenteModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const tituloId = useId();
  const descripcionId = useId();
  const accion = docente.activo ? "Desactivar" : "Reactivar";

  useEffect(() => {
    const dialog = dialogRef.current;
    const elementoAnterior = document.activeElement;

    if (dialog && !dialog.open) dialog.showModal();

    return () => {
      dialog?.close();

      if (
        elementoAnterior instanceof HTMLElement &&
        elementoAnterior.isConnected
      ) {
        elementoAnterior.focus();
      } else {
        document.getElementById("docentes-busqueda")?.focus();
      }
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="docentes__modal docentes__modal--confirmacion"
      aria-labelledby={tituloId}
      aria-describedby={descripcionId}
      aria-busy={cambiando}
      onCancel={(evento) => {
        evento.preventDefault();
        onCancelar();
      }}
    >
      <h2 id={tituloId}>{accion} docente</h2>

      <p>
        <strong>
          {docente.nombres} {docente.apellidos}
        </strong>
      </p>

      <p id={descripcionId}>
        {docente.activo
          ? "Su cuenta quedará inactiva. Si tiene cursos asignados, no se podrá desactivar."
          : "Su cuenta volverá a estar activa."}
      </p>

      {error && (
        <p className="docentes__error" role="alert">
          {error}
        </p>
      )}

      <div className="docentes__acciones">
        <Boton onClick={onCancelar} disabled={cambiando} autoFocus>
          Cancelar
        </Boton>
        <Boton
          variante="principal"
          onClick={onConfirmar}
          cargando={cambiando}
          textoCargando="Actualizando..."
        >
          {accion}
        </Boton>
      </div>
    </dialog>
  );
}
