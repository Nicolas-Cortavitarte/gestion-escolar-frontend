import { useEffect, useState, useRef } from "react";
import {
  obtenerMovimientos,
  eliminarMovimiento,
} from "../movimientos-financieros.service";
import type {
  MovimientoFinanciero,
  CategoriaMovimiento,
} from "../movimientos-financieros.types";
import { MovimientoModal } from "../components/MovimientoModal";
import "./MovimientosFinancierosPage.css";

interface MovimientosFinancierosPageProps {
  token: string;
}

const categorias: Record<CategoriaMovimiento, string> = {
  MATERIALES: "Materiales",
  SERVICIOS: "Servicios",
  ACTIVIDADES: "Actividades",
  MANTENIMIENTO: "Mantenimiento",
  DONACION: "Donación",
  OTRO: "Otro",
};

const moneda = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

function rangoMesActual() {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const anio = partes.find((parte) => parte.type === "year")!.value;
  const mes = partes.find((parte) => parte.type === "month")!.value;
  const ultimoDia = new Date(Number(anio), Number(mes), 0).getDate();

  return {
    desde: `${anio}-${mes}-01`,
    hasta: `${anio}-${mes}-${String(ultimoDia).padStart(2, "0")}`,
  };
}

export function MovimientosFinancierosPage({
  token,
}: MovimientosFinancierosPageProps) {
  const [rango, setRango] = useState(rangoMesActual);
  const [desde, setDesde] = useState(rango.desde);
  const [hasta, setHasta] = useState(rango.hasta);
  const [movimientos, setMovimientos] = useState<MovimientoFinanciero[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [errorFechas, setErrorFechas] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [tipo, setTipo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [movimientoEliminar, setMovimientoEliminar] =
    useState<MovimientoFinanciero | null>(null);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  const [errorEliminar, setErrorEliminar] = useState("");

  useEffect(() => {
    let activo = true;

    obtenerMovimientos(token, rango.desde, rango.hasta)
      .then((datos) => {
        if (!activo) return;

        setMovimientos(datos);
        setError("");
      })
      .catch((fallo: unknown) => {
        if (!activo) return;

        setError(
          fallo instanceof Error
            ? fallo.message
            : "No se pudieron cargar los movimientos.",
        );
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [token, rango]);

  function consultar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (!desde || !hasta || desde > hasta) {
      setErrorFechas("La fecha inicial debe ser anterior o igual a la final.");
      return;
    }

    setErrorFechas("");
    setError("");
    setCargando(true);
    setMovimientos([]);
    setRango({ desde, hasta });
  }

  const termino = busqueda.trim().toLocaleLowerCase("es");

  const filtrados = movimientos
    .filter(
      (movimiento) =>
        (tipo === "" || movimiento.tipo === tipo) &&
        (categoria === "" || movimiento.categoria === categoria) &&
        movimiento.concepto.toLocaleLowerCase("es").includes(termino),
    )
    .sort(
      (a, b) =>
        b.fecha.localeCompare(a.fecha) || b.creadoEn.localeCompare(a.creadoEn),
    );

  async function confirmarEliminacion(movimiento: MovimientoFinanciero) {
    if (eliminandoId !== null) return;

    setEliminandoId(movimiento.id);
    setMensaje("");
    setErrorEliminar("");

    try {
      await eliminarMovimiento(token, movimiento.id);

      setMovimientos((actuales) =>
        actuales.filter((item) => item.id !== movimiento.id),
      );

      setMensaje("Movimiento eliminado correctamente.");
    } catch (fallo: unknown) {
      setErrorEliminar(
        fallo instanceof Error
          ? fallo.message
          : "No se pudo eliminar el movimiento.",
      );
    } finally {
      setEliminandoId(null);
    }
  }

  return (
    <section className="movimientos">
      <header className="movimientos__encabezado">
        <h1>Movimientos financieros</h1>
        <p>Registra y consulta otros ingresos y egresos del colegio.</p>
      </header>

      <button
        type="button"
        className="movimientos__boton movimientos__nuevo"
        disabled={cargando || eliminandoId !== null}
        onClick={() => {
          setMensaje("");
          setMostrarModal(true);
        }}
      >
        Nuevo movimiento
      </button>

      {mensaje && <p role="status">{mensaje}</p>}

      {errorEliminar && <p role="alert">{errorEliminar}</p>}

      <form className="movimientos__fechas" onSubmit={consultar}>
        <div className="movimientos__campo">
          <label htmlFor="movimientos-desde">Desde</label>
          <input
            id="movimientos-desde"
            type="date"
            value={desde}
            onChange={(evento) => setDesde(evento.target.value)}
            required
          />
        </div>

        <div className="movimientos__campo">
          <label htmlFor="movimientos-hasta">Hasta</label>
          <input
            id="movimientos-hasta"
            type="date"
            value={hasta}
            onChange={(evento) => setHasta(evento.target.value)}
            min={desde || undefined}
            required
          />
        </div>

        <button
          type="submit"
          className="movimientos__boton"
          disabled={cargando || eliminandoId !== null}
        >
          {cargando ? "Consultando..." : "Consultar"}
        </button>
      </form>

      {errorFechas && <p role="alert">{errorFechas}</p>}
      {cargando && <p role="status">Cargando movimientos...</p>}
      {error && <p role="alert">{error}</p>}

      {!cargando && !error && (
        <>
          <div className="movimientos__filtros">
            <div className="movimientos__campo">
              <label htmlFor="movimientos-busqueda">Buscar concepto</label>
              <input
                id="movimientos-busqueda"
                type="search"
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
                placeholder="Concepto del movimiento"
              />
            </div>

            <div className="movimientos__campo">
              <label htmlFor="movimientos-tipo">Tipo</label>
              <select
                id="movimientos-tipo"
                value={tipo}
                onChange={(evento) => setTipo(evento.target.value)}
              >
                <option value="">Todos</option>
                <option value="INGRESO">Ingreso</option>
                <option value="EGRESO">Egreso</option>
              </select>
            </div>

            <div className="movimientos__campo">
              <label htmlFor="movimientos-categoria">Categoría</label>
              <select
                id="movimientos-categoria"
                value={categoria}
                onChange={(evento) => setCategoria(evento.target.value)}
              >
                <option value="">Todas</option>
                {Object.entries(categorias).map(([valor, nombre]) => (
                  <option key={valor} value={valor}>
                    {nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filtrados.length === 0 ? (
            <p>No hay movimientos que coincidan con los filtros.</p>
          ) : (
            <div
              className="movimientos__tabla-contenedor"
              role="region"
              aria-label="Listado de movimientos financieros"
              tabIndex={0}
            >
              <table>
                <thead>
                  <tr>
                    <th scope="col">Fecha</th>
                    <th scope="col">Concepto</th>
                    <th scope="col">Tipo</th>
                    <th scope="col">Categoría</th>
                    <th scope="col">Monto</th>
                    <th scope="col">Registrado por</th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {filtrados.map((movimiento) => (
                    <tr key={movimiento.id}>
                      <td>{movimiento.fecha.split("-").reverse().join("/")}</td>
                      <td>{movimiento.concepto}</td>
                      <td>
                        <span
                          className={`movimientos__tipo movimientos__tipo--${movimiento.tipo.toLowerCase()}`}
                        >
                          {movimiento.tipo === "INGRESO" ? "Ingreso" : "Egreso"}
                        </span>
                      </td>
                      <td>{categorias[movimiento.categoria]}</td>
                      <td>{moneda.format(movimiento.monto)}</td>
                      <td>{movimiento.registradoPorEmail}</td>
                      <td>
                        <button
                          type="button"
                          className="movimientos__boton-eliminar"
                          disabled={eliminandoId !== null}
                          onClick={() => {
                            setMensaje("");
                            setErrorEliminar("");
                            setMovimientoEliminar(movimiento);
                          }}
                          aria-label={`Eliminar movimiento: ${movimiento.concepto}`}
                        >
                          {eliminandoId === movimiento.id
                            ? "Eliminando..."
                            : "Eliminar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      {mostrarModal && (
        <MovimientoModal
          token={token}
          onCerrar={() => setMostrarModal(false)}
          onCreado={(creado) => {
            const dentroDelRango =
              creado.fecha >= rango.desde && creado.fecha <= rango.hasta;

            if (dentroDelRango) {
              setMovimientos((actuales) => [...actuales, creado]);
              setBusqueda("");
              setTipo("");
              setCategoria("");
            }

            setMostrarModal(false);
            setMensaje(
              dentroDelRango
                ? "Movimiento registrado correctamente."
                : "Movimiento registrado correctamente. Su fecha está fuera del rango consultado; cambia las fechas para verlo.",
            );
          }}
        />
      )}
      {movimientoEliminar && (
        <EliminarMovimientoModal
          movimiento={movimientoEliminar}
          onCancelar={() => setMovimientoEliminar(null)}
          onConfirmar={() => {
            const seleccionado = movimientoEliminar;
            setMovimientoEliminar(null);
            void confirmarEliminacion(seleccionado);
          }}
        />
      )}
    </section>
  );
}

interface EliminarMovimientoModalProps {
  movimiento: MovimientoFinanciero;
  onCancelar: () => void;
  onConfirmar: () => void;
}

function EliminarMovimientoModal({
  movimiento,
  onCancelar,
  onConfirmar,
}: EliminarMovimientoModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

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
      className="movimientos__modal movimientos__modal--confirmacion"
      aria-labelledby="eliminar-movimiento-titulo"
      aria-describedby="eliminar-movimiento-descripcion"
      onCancel={(evento) => {
        evento.preventDefault();
        onCancelar();
      }}
    >
      <h2 id="eliminar-movimiento-titulo">Eliminar movimiento</h2>

      <p>
        <strong>{movimiento.concepto}</strong>
      </p>

      <p>
        {movimiento.tipo === "INGRESO" ? "Ingreso" : "Egreso"} de{" "}
        <strong>{moneda.format(movimiento.monto)}</strong>
      </p>

      <p id="eliminar-movimiento-descripcion">
        Se eliminará permanentemente este registro y su importe dejará de
        contabilizarse en el reporte financiero.
      </p>

      <div className="movimientos__acciones">
        <button
          type="button"
          className="movimientos__boton-secundario"
          onClick={onCancelar}
          autoFocus
        >
          Cancelar
        </button>

        <button
          type="button"
          className="movimientos__boton-eliminar"
          onClick={onConfirmar}
        >
          Eliminar movimiento
        </button>
      </div>
    </dialog>
  );
}
