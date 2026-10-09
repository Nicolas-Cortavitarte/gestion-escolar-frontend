import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  obtenerMovimientos,
  eliminarMovimiento,
} from "../movimientos-financieros.service";
import type {
  MovimientoFinanciero,
  CategoriaMovimiento,
} from "../movimientos-financieros.types";
import { MovimientoModal } from "../components/MovimientoModal";
import { Boton } from "../../../shared/components/Boton";
import { CampoEntrada } from "../../../shared/components/CampoEntrada";
import { BadgeEstado } from "../../../shared/components/BadgeEstado";
import { Paginacion } from "../../../shared/components/Paginacion";
import "../../../styles/listados.css";
import "./MovimientosFinancierosPage.css";

interface MovimientosFinancierosPageProps {
  token: string;
}

const POR_PAGINA = 10;

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

function normalizar(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");
}

function mostrarFecha(fecha: string) {
  return fecha.split("-").reverse().join("/");
}

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
  const [intentoCarga, setIntentoCarga] = useState(0);
  const [error, setError] = useState("");
  const [errorFechas, setErrorFechas] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [tipo, setTipo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [pagina, setPagina] = useState(1);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [movimientoEliminar, setMovimientoEliminar] =
    useState<MovimientoFinanciero | null>(null);

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
  }, [token, rango, intentoCarga]);

  function consultar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (cargando) return;

    if (!desde || !hasta || desde > hasta) {
      setErrorFechas(
        "Selecciona ambas fechas. Desde debe ser anterior o igual a Hasta.",
      );
      return;
    }

    if (!evento.currentTarget.reportValidity()) return;

    setErrorFechas("");
    setError("");
    setMensaje("");
    setCargando(true);
    setPagina(1);
    setRango({ desde, hasta });
  }

  function reintentar() {
    setError("");
    setCargando(true);
    setIntentoCarga((actual) => actual + 1);
  }

  function limpiarFiltros() {
    setBusqueda("");
    setTipo("");
    setCategoria("");
    setPagina(1);
  }

  const termino = normalizar(busqueda.trim());

  const filtrados = movimientos
    .filter(
      (movimiento) =>
        (tipo === "" || movimiento.tipo === tipo) &&
        (categoria === "" || movimiento.categoria === categoria) &&
        normalizar(movimiento.concepto).includes(termino),
    )
    .sort(
      (a, b) =>
        b.fecha.localeCompare(a.fecha) ||
        b.creadoEn.localeCompare(a.creadoEn) ||
        a.id.localeCompare(b.id),
    );

  const paginaActual = Math.min(
    pagina,
    Math.max(1, Math.ceil(filtrados.length / POR_PAGINA)),
  );

  const visibles = filtrados.slice(
    (paginaActual - 1) * POR_PAGINA,
    paginaActual * POR_PAGINA,
  );

  return (
    <section className="movimientos">
      <header className="movimientos__encabezado">
        <div>
          <h1>Movimientos financieros</h1>
          <p>
            Registra otros ingresos y egresos del colegio. Las pensiones,
            matrículas y pagos a docentes se consultan en sus apartados.
          </p>
        </div>

        <Boton
          variante="principal"
          disabled={cargando || Boolean(error)}
          onClick={() => {
            setMensaje("");
            setMostrarModal(true);
          }}
        >
          Nuevo movimiento
        </Boton>
      </header>

      {mensaje && (
        <p role="status" className="movimientos__exito">
          {mensaje}
        </p>
      )}

      <form className="movimientos__fechas" onSubmit={consultar} noValidate>
        <CampoEntrada
          id="movimientos-desde"
          etiqueta="Desde"
          type="date"
          value={desde}
          onChange={(evento) => {
            setDesde(evento.target.value);
            setErrorFechas("");
          }}
          disabled={cargando}
          required
        />

        <CampoEntrada
          id="movimientos-hasta"
          etiqueta="Hasta"
          type="date"
          value={hasta}
          onChange={(evento) => {
            setHasta(evento.target.value);
            setErrorFechas("");
          }}
          min={desde || undefined}
          error={errorFechas}
          disabled={cargando}
          required
        />

        <Boton type="submit" disabled={cargando}>
          {cargando ? "Consultando..." : "Consultar"}
        </Boton>
      </form>

      {cargando && <p role="status">Cargando movimientos...</p>}

      {!cargando && error && (
        <div className="estado-listado">
          <p role="alert">{error}</p>
          <Boton onClick={reintentar}>Reintentar</Boton>
        </div>
      )}

      {!cargando && !error && (
        <>
          <p className="movimientos__periodo">
            Movimientos del {mostrarFecha(rango.desde)} al{" "}
            {mostrarFecha(rango.hasta)}.
          </p>

          <div className="movimientos__filtros">
            <CampoEntrada
              id="movimientos-busqueda"
              etiqueta="Buscar concepto"
              type="search"
              value={busqueda}
              onChange={(evento) => {
                setBusqueda(evento.target.value);
                setPagina(1);
              }}
              placeholder="Concepto del movimiento"
            />

            <div className="campo">
              <label htmlFor="movimientos-tipo">Tipo</label>
              <select
                id="movimientos-tipo"
                className="campo__entrada"
                value={tipo}
                onChange={(evento) => {
                  setTipo(evento.target.value);
                  setPagina(1);
                }}
              >
                <option value="">Todos</option>
                <option value="INGRESO">Ingreso</option>
                <option value="EGRESO">Egreso</option>
              </select>
            </div>

            <div className="campo">
              <label htmlFor="movimientos-categoria">Categoría</label>
              <select
                id="movimientos-categoria"
                className="campo__entrada"
                value={categoria}
                onChange={(evento) => {
                  setCategoria(evento.target.value);
                  setPagina(1);
                }}
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

          {movimientos.length === 0 ? (
            <div className="estado-listado">
              <h2>No hay movimientos en este periodo</h2>
              <p>
                Consulta otro rango de fechas o registra un nuevo movimiento.
              </p>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="estado-listado">
              <h2>No encontramos coincidencias</h2>
              <p>Prueba con otro concepto o limpia los filtros.</p>
              <Boton onClick={limpiarFiltros}>Limpiar filtros</Boton>
            </div>
          ) : (
            <>
              <div
                className="tabla-listado"
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
                    {visibles.map((movimiento) => (
                      <tr key={movimiento.id}>
                        <td data-label="Fecha">
                          {mostrarFecha(movimiento.fecha)}
                        </td>
                        <td data-label="Concepto">{movimiento.concepto}</td>
                        <td data-label="Tipo">
                          <span>
                            <BadgeEstado
                              variante={
                                movimiento.tipo === "INGRESO"
                                  ? "pendiente"
                                  : "neutro"
                              }
                            >
                              {movimiento.tipo === "INGRESO"
                                ? "Ingreso"
                                : "Egreso"}
                            </BadgeEstado>
                          </span>
                        </td>
                        <td data-label="Categoría">
                          {categorias[movimiento.categoria]}
                        </td>
                        <td data-label="Monto">
                          {moneda.format(movimiento.monto)}
                        </td>
                        <td data-label="Registrado por">
                          {movimiento.registradoPorEmail ?? "No disponible"}
                        </td>
                        <td data-label="Acciones">
                          <Boton
                            onClick={() => {
                              setMensaje("");
                              setMovimientoEliminar(movimiento);
                            }}
                            aria-label={`Eliminar movimiento: ${movimiento.concepto}`}
                          >
                            Eliminar
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
              limpiarFiltros();
            }

            setMostrarModal(false);
            setMensaje(
              dentroDelRango
                ? "Movimiento registrado correctamente."
                : "Movimiento registrado correctamente. Su fecha está fuera del periodo consultado; cambia las fechas para verlo.",
            );
          }}
        />
      )}

      {movimientoEliminar && (
        <EliminarMovimientoModal
          token={token}
          movimiento={movimientoEliminar}
          onCancelar={() => setMovimientoEliminar(null)}
          onEliminado={() => {
            setMovimientos((actuales) =>
              actuales.filter((item) => item.id !== movimientoEliminar.id),
            );
            setMovimientoEliminar(null);
            setMensaje("Movimiento eliminado correctamente.");
          }}
        />
      )}
    </section>
  );
}

interface EliminarMovimientoModalProps {
  token: string;
  movimiento: MovimientoFinanciero;
  onCancelar: () => void;
  onEliminado: () => void;
}

function EliminarMovimientoModal({
  token,
  movimiento,
  onCancelar,
  onEliminado,
}: EliminarMovimientoModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const eliminandoRef = useRef(false);
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState("");
  const id = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const elementoAnterior =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    if (!dialog.open) dialog.showModal();

    return () => {
      dialog.close();

      if (elementoAnterior?.isConnected) {
        elementoAnterior.focus();
      } else {
        document.getElementById("movimientos-busqueda")?.focus();
      }
    };
  }, []);

  function cancelar() {
    if (!eliminandoRef.current) onCancelar();
  }

  async function confirmar() {
    if (eliminandoRef.current) return;

    eliminandoRef.current = true;
    setEliminando(true);
    setError("");

    try {
      await eliminarMovimiento(token, movimiento.id);
      onEliminado();
    } catch (fallo: unknown) {
      setError(
        fallo instanceof Error
          ? fallo.message
          : "No se pudo eliminar el movimiento. Inténtalo nuevamente.",
      );
    } finally {
      eliminandoRef.current = false;
      setEliminando(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="movimientos__modal movimientos__modal--confirmacion"
      aria-labelledby={`${id}-titulo`}
      aria-describedby={`${id}-descripcion`}
      aria-busy={eliminando}
      onCancel={(evento) => {
        evento.preventDefault();
        cancelar();
      }}
    >
      <h2 id={`${id}-titulo`}>Eliminar movimiento</h2>

      <dl className="movimientos__detalle">
        <div>
          <dt>Concepto</dt>
          <dd>{movimiento.concepto}</dd>
        </div>
        <div>
          <dt>Fecha</dt>
          <dd>{mostrarFecha(movimiento.fecha)}</dd>
        </div>
        <div>
          <dt>Tipo</dt>
          <dd>{movimiento.tipo === "INGRESO" ? "Ingreso" : "Egreso"}</dd>
        </div>
        <div>
          <dt>Monto</dt>
          <dd>{moneda.format(movimiento.monto)}</dd>
        </div>
      </dl>

      <p id={`${id}-descripcion`}>
        Se eliminará permanentemente este registro y su importe dejará de
        contabilizarse en el reporte financiero.
      </p>

      {error && (
        <p role="alert" className="movimientos__error">
          {error}
        </p>
      )}

      <div className="movimientos__acciones">
        <Boton onClick={cancelar} disabled={eliminando} autoFocus>
          Cancelar
        </Boton>

        <Boton
          className="movimientos__boton-eliminar"
          cargando={eliminando}
          textoCargando="Eliminando..."
          onClick={() => void confirmar()}
        >
          Eliminar movimiento
        </Boton>
      </div>
    </dialog>
  );
}
