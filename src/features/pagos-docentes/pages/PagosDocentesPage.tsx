import { useEffect, useState, useRef } from "react";
import { obtenerPagosDocentes, pagarDocente } from "../pagos-docentes.service";
import type { PagoDocente } from "../pagos-docentes.types";
import "./PagosDocentesPage.css";

interface PagosDocentesPageProps {
  token: string;
}

const meses = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const estados = {
  PROGRAMADO: "Programado",
  PAGADO: "Pagado",
  RETRASO: "En retraso",
};

const moneda = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

export function PagosDocentesPage({ token }: PagosDocentesPageProps) {
  const [pagos, setPagos] = useState<PagoDocente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [anio, setAnio] = useState(String(new Date().getFullYear()));
  const [mes, setMes] = useState(String(new Date().getMonth() + 1));
  const [estado, setEstado] = useState("");
  const [pagoSeleccionado, setPagoSeleccionado] = useState<PagoDocente | null>(
    null,
  );
  const [pagandoId, setPagandoId] = useState<string | null>(null);
  const [mensajePago, setMensajePago] = useState("");
  const [errorPago, setErrorPago] = useState("");

  useEffect(() => {
    let activo = true;

    obtenerPagosDocentes(token)
      .then((datos) => {
        if (!activo) return;

        setPagos(datos);
        setError("");
      })
      .catch((fallo: unknown) => {
        if (!activo) return;

        setError(
          fallo instanceof Error
            ? fallo.message
            : "No se pudieron cargar los pagos a docentes.",
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
    new Set([new Date().getFullYear(), ...pagos.map((pago) => pago.anio)]),
  ).sort((a, b) => b - a);

  const termino = busqueda.trim().toLocaleLowerCase("es");

  const filtrados = pagos
    .filter(
      (pago) =>
        pago.anio === Number(anio) &&
        (mes === "" || pago.mes === Number(mes)) &&
        (estado === "" || pago.estado === estado) &&
        pago.nombresDocente.toLocaleLowerCase("es").includes(termino),
    )
    .sort(
      (a, b) =>
        a.nombresDocente.localeCompare(b.nombresDocente, "es") || a.mes - b.mes,
    );

  async function registrarPago(pago: PagoDocente) {
    if (pagandoId !== null || pago.estado === "PAGADO") return;

    setPagandoId(pago.id);
    setMensajePago("");
    setErrorPago("");

    try {
      const actualizado = await pagarDocente(token, pago.id);

      setPagos((actuales) =>
        actuales.map((item) =>
          item.id === actualizado.id ? actualizado : item,
        ),
      );

      setMensajePago(
        `Pago de ${meses[pago.mes - 1]} registrado para ${pago.nombresDocente}.`,
      );
    } catch (fallo: unknown) {
      setErrorPago(
        fallo instanceof Error
          ? fallo.message
          : "No se pudo registrar el pago.",
      );
    } finally {
      setPagandoId(null);
    }
  }

  return (
    <section className="pagos-docentes">
      <header className="pagos-docentes__encabezado">
        <h1>Pagos a docentes</h1>
        <p>Consulta los pagos programados y su estado.</p>
      </header>

      <div className="pagos-docentes__filtros">
        <div className="pagos-docentes__campo">
          <label htmlFor="pagos-docentes-anio">Año</label>
          <select
            id="pagos-docentes-anio"
            value={anio}
            onChange={(evento) => setAnio(evento.target.value)}
          >
            {anios.map((valor) => (
              <option key={valor} value={valor}>
                {valor}
              </option>
            ))}
          </select>
        </div>

        <div className="pagos-docentes__campo">
          <label htmlFor="pagos-docentes-mes">Mes</label>
          <select
            id="pagos-docentes-mes"
            value={mes}
            onChange={(evento) => setMes(evento.target.value)}
          >
            <option value="">Todos los meses</option>
            {meses.map((nombre, indice) => (
              <option key={nombre} value={indice + 1}>
                {nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="pagos-docentes__campo">
          <label htmlFor="pagos-docentes-busqueda">Buscar docente</label>
          <input
            id="pagos-docentes-busqueda"
            type="search"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Nombres o apellidos"
          />
        </div>

        <div className="pagos-docentes__campo">
          <label htmlFor="pagos-docentes-estado">Estado</label>
          <select
            id="pagos-docentes-estado"
            value={estado}
            onChange={(evento) => setEstado(evento.target.value)}
          >
            <option value="">Todos</option>
            <option value="PROGRAMADO">Programado</option>
            <option value="PAGADO">Pagado</option>
            <option value="RETRASO">En retraso</option>
          </select>
        </div>
      </div>

      {cargando && <p role="status">Cargando pagos...</p>}
      {error && <p role="alert">{error}</p>}

      {mensajePago && <p role="status">{mensajePago}</p>}
      {errorPago && <p role="alert">{errorPago}</p>}

      {!cargando && !error && filtrados.length === 0 && (
        <p>No hay pagos que coincidan con los filtros.</p>
      )}

      {!cargando && !error && filtrados.length > 0 && (
        <div
          className="pagos-docentes__tabla-contenedor"
          role="region"
          aria-label="Listado de pagos a docentes"
          tabIndex={0}
        >
          <table>
            <thead>
              <tr>
                <th scope="col">Docente</th>
                <th scope="col">Mes</th>
                <th scope="col">Monto</th>
                <th scope="col">Fecha programada</th>
                <th scope="col">Fecha de pago</th>
                <th scope="col">Estado</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filtrados.map((pago) => (
                <tr key={pago.id}>
                  <td>{pago.nombresDocente}</td>
                  <td>{meses[pago.mes - 1]}</td>
                  <td>{moneda.format(pago.monto)}</td>
                  <td>{pago.fechaProgramada.split("-").reverse().join("/")}</td>
                  <td>
                    {pago.fechaPago
                      ? new Date(pago.fechaPago).toLocaleDateString("es-PE", {
                          timeZone: "America/Lima",
                        })
                      : "Sin pago"}
                  </td>
                  <td>
                    <span
                      className={`pagos-docentes__estado pagos-docentes__estado--${pago.estado.toLowerCase()}`}
                    >
                      {estados[pago.estado]}
                    </span>
                  </td>
                  <td>
                    {pago.estado === "PAGADO" ? (
                      <span className="pagos-docentes__pago-registrado">
                        Pago registrado
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="pagos-docentes__boton"
                        disabled={pagandoId !== null}
                        onClick={() => setPagoSeleccionado(pago)}
                        aria-label={`Registrar pago de ${meses[pago.mes - 1]} de ${pago.nombresDocente}`}
                      >
                        {pagandoId === pago.id
                          ? "Registrando..."
                          : "Registrar pago"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pagoSeleccionado && (
        <ConfirmarPagoDocenteModal
          pago={pagoSeleccionado}
          onCancelar={() => setPagoSeleccionado(null)}
          onConfirmar={() => {
            const seleccionado = pagoSeleccionado;
            setPagoSeleccionado(null);
            void registrarPago(seleccionado);
          }}
        />
      )}
    </section>
  );
}

interface ConfirmarPagoDocenteModalProps {
  pago: PagoDocente;
  onCancelar: () => void;
  onConfirmar: () => void;
}

function ConfirmarPagoDocenteModal({
  pago,
  onCancelar,
  onConfirmar,
}: ConfirmarPagoDocenteModalProps) {
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
      className="pagos-docentes__modal"
      aria-labelledby="pago-docente-titulo"
      aria-describedby="pago-docente-descripcion"
      onCancel={(evento) => {
        evento.preventDefault();
        onCancelar();
      }}
    >
      <h2 id="pago-docente-titulo">Confirmar pago a docente</h2>

      <p id="pago-docente-descripcion">
        Confirma cuando el colegio haya entregado el importe al docente.
      </p>

      <dl className="pagos-docentes__modal-detalle">
        <div>
          <dt>Docente</dt>
          <dd>{pago.nombresDocente}</dd>
        </div>

        <div>
          <dt>Periodo</dt>
          <dd>
            {meses[pago.mes - 1]} de {pago.anio}
          </dd>
        </div>

        <div>
          <dt>Monto pagado</dt>
          <dd>{moneda.format(pago.monto)}</dd>
        </div>
      </dl>

      <div className="pagos-docentes__acciones">
        <button
          type="button"
          className="pagos-docentes__boton-secundario"
          onClick={onCancelar}
          autoFocus
        >
          Cancelar
        </button>

        <button
          type="button"
          className="pagos-docentes__boton"
          onClick={onConfirmar}
        >
          Confirmar pago
        </button>
      </div>
    </dialog>
  );
}
