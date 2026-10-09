import { useEffect, useId, useRef, useState } from "react";
import { obtenerPagosDocentes, pagarDocente } from "../pagos-docentes.service";
import type { PagoDocente } from "../pagos-docentes.types";
import { Boton } from "../../../shared/components/Boton";
import { CampoEntrada } from "../../../shared/components/CampoEntrada";
import { BadgeEstado } from "../../../shared/components/BadgeEstado";
import { Paginacion } from "../../../shared/components/Paginacion";
import "../../../styles/listados.css";
import "./PagosDocentesPage.css";

interface PagosDocentesPageProps {
  token: string;
}

const POR_PAGINA = 10;

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

const fechaPago = new Intl.DateTimeFormat("es-PE", {
  timeZone: "America/Lima",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim();
}

export function PagosDocentesPage({ token }: PagosDocentesPageProps) {
  const [pagos, setPagos] = useState<PagoDocente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0);

  const [busqueda, setBusqueda] = useState("");
  const [anio, setAnio] = useState(String(new Date().getFullYear()));
  const [mes, setMes] = useState(String(new Date().getMonth() + 1));
  const [estado, setEstado] = useState("");
  const [pagina, setPagina] = useState(1);

  const [pagoSeleccionado, setPagoSeleccionado] = useState<PagoDocente | null>(
    null,
  );
  const [pagando, setPagando] = useState(false);
  const [mensajePago, setMensajePago] = useState("");
  const [errorPago, setErrorPago] = useState("");

  const pagandoRef = useRef(false);

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
  }, [token, intento]);

  const anios = Array.from(
    new Set([new Date().getFullYear(), ...pagos.map((pago) => pago.anio)]),
  ).sort((a, b) => b - a);

  const termino = normalizar(busqueda);

  const filtrados = pagos
    .filter(
      (pago) =>
        pago.anio === Number(anio) &&
        (mes === "" || pago.mes === Number(mes)) &&
        (estado === "" || pago.estado === estado) &&
        normalizar(pago.nombresDocente).includes(termino),
    )
    .sort(
      (a, b) =>
        a.nombresDocente.localeCompare(b.nombresDocente, "es") ||
        a.mes - b.mes ||
        a.id.localeCompare(b.id),
    );

  const paginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, paginas);
  const visibles = filtrados.slice(
    (paginaActual - 1) * POR_PAGINA,
    paginaActual * POR_PAGINA,
  );

  function cerrarPago() {
    if (pagandoRef.current) return;

    setPagoSeleccionado(null);
    setErrorPago("");
  }

  async function registrarPago() {
    const seleccionado = pagoSeleccionado;

    if (
      !seleccionado ||
      seleccionado.estado === "PAGADO" ||
      pagandoRef.current
    ) {
      return;
    }

    pagandoRef.current = true;
    setPagando(true);
    setErrorPago("");

    try {
      const actualizado = await pagarDocente(token, seleccionado.id);

      setPagos((actuales) =>
        actuales.map((item) =>
          item.id === actualizado.id ? actualizado : item,
        ),
      );

      setPagoSeleccionado(null);
      setMensajePago(
        `Pago de ${meses[seleccionado.mes - 1]} registrado para ${
          seleccionado.nombresDocente
        }.`,
      );
    } catch (fallo: unknown) {
      setErrorPago(
        fallo instanceof Error
          ? fallo.message
          : "No se pudo registrar el pago. Inténtalo nuevamente.",
      );
    } finally {
      pagandoRef.current = false;
      setPagando(false);
    }
  }

  return (
    <section className="pagos-docentes">
      <header className="pagos-docentes__encabezado">
        <h1>Pagos a docentes</h1>
        <p>
          Consulta los pagos programados y registra los importes entregados.
        </p>
      </header>

      <div className="pagos-docentes__filtros">
        <div className="campo">
          <label className="campo__etiqueta" htmlFor="pagos-docentes-anio">
            Año
          </label>
          <select
            id="pagos-docentes-anio"
            className="campo__entrada"
            value={anio}
            onChange={(evento) => {
              setAnio(evento.target.value);
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

        <div className="campo">
          <label className="campo__etiqueta" htmlFor="pagos-docentes-mes">
            Mes
          </label>
          <select
            id="pagos-docentes-mes"
            className="campo__entrada"
            value={mes}
            onChange={(evento) => {
              setMes(evento.target.value);
              setPagina(1);
            }}
            disabled={cargando}
          >
            <option value="">Todos los meses</option>
            {meses.map((nombre, indice) => (
              <option key={nombre} value={indice + 1}>
                {nombre}
              </option>
            ))}
          </select>
        </div>

        <CampoEntrada
          id="pagos-docentes-busqueda"
          etiqueta="Buscar docente"
          type="search"
          value={busqueda}
          onChange={(evento) => {
            setBusqueda(evento.target.value);
            setPagina(1);
          }}
          placeholder="Nombres o apellidos"
          disabled={cargando}
        />

        <div className="campo">
          <label className="campo__etiqueta" htmlFor="pagos-docentes-estado">
            Estado
          </label>
          <select
            id="pagos-docentes-estado"
            className="campo__entrada"
            value={estado}
            onChange={(evento) => {
              setEstado(evento.target.value);
              setPagina(1);
            }}
            disabled={cargando}
          >
            <option value="">Todos</option>
            {Object.entries(estados).map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </select>
        </div>
      </div>

      {mensajePago && (
        <p className="pagos-docentes__exito" role="status">
          {mensajePago}
        </p>
      )}

      {cargando && (
        <p className="estado-listado" role="status">
          Cargando pagos...
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

      {!cargando && !error && filtrados.length === 0 && (
        <div className="estado-listado">
          <h2>No hay pagos para estos filtros</h2>
          <p>Prueba otro año o consulta todos los meses y estados.</p>
          <Boton
            onClick={() => {
              setBusqueda("");
              setMes("");
              setEstado("");
              setPagina(1);
            }}
          >
            Ver todos los meses y estados
          </Boton>
        </div>
      )}

      {!cargando && !error && filtrados.length > 0 && (
        <>
          <div
            className="tabla-listado"
            role="region"
            aria-label="Listado de pagos a docentes"
            tabIndex={0}
          >
            <table>
              <caption className="solo-lectores">
                Pagos a docentes del año {anio}
              </caption>
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
                {visibles.map((pago) => (
                  <tr key={pago.id}>
                    <td data-label="Docente">{pago.nombresDocente}</td>
                    <td data-label="Mes">{meses[pago.mes - 1]}</td>
                    <td data-label="Monto">{moneda.format(pago.monto)}</td>
                    <td data-label="Fecha programada">
                      {pago.fechaProgramada.split("-").reverse().join("/")}
                    </td>
                    <td data-label="Fecha de pago">
                      {pago.fechaPago
                        ? fechaPago.format(new Date(pago.fechaPago))
                        : "Sin pago"}
                    </td>
                    <td data-label="Estado">
                      <BadgeEstado
                        variante={
                          pago.estado === "PAGADO"
                            ? "exito"
                            : pago.estado === "RETRASO"
                              ? "error"
                              : "pendiente"
                        }
                      >
                        {estados[pago.estado]}
                      </BadgeEstado>
                    </td>
                    <td data-label="Acciones">
                      {pago.estado === "PAGADO" ? (
                        <span>Pago registrado</span>
                      ) : (
                        <Boton
                          onClick={() => {
                            setMensajePago("");
                            setErrorPago("");
                            setPagoSeleccionado(pago);
                          }}
                          aria-label={`Registrar pago de ${
                            meses[pago.mes - 1]
                          } de ${pago.nombresDocente}`}
                        >
                          Registrar pago
                        </Boton>
                      )}
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

      {pagoSeleccionado && (
        <ConfirmarPagoDocenteModal
          pago={pagoSeleccionado}
          pagando={pagando}
          error={errorPago}
          onCancelar={cerrarPago}
          onConfirmar={() => void registrarPago()}
        />
      )}
    </section>
  );
}

interface ConfirmarPagoDocenteModalProps {
  pago: PagoDocente;
  pagando: boolean;
  error: string;
  onCancelar: () => void;
  onConfirmar: () => void;
}

function ConfirmarPagoDocenteModal({
  pago,
  pagando,
  error,
  onCancelar,
  onConfirmar,
}: ConfirmarPagoDocenteModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const tituloId = useId();
  const descripcionId = useId();

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
        document.getElementById("pagos-docentes-busqueda")?.focus();
      }
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="pagos-docentes__modal"
      aria-labelledby={tituloId}
      aria-describedby={descripcionId}
      aria-busy={pagando}
      onCancel={(evento) => {
        evento.preventDefault();
        onCancelar();
      }}
    >
      <h2 id={tituloId}>Confirmar pago a docente</h2>
      <p id={descripcionId}>
        Confirma únicamente cuando el colegio haya entregado el importe.
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

      {error && (
        <p className="pagos-docentes__error" role="alert">
          {error}
        </p>
      )}

      <div className="pagos-docentes__acciones">
        <Boton onClick={onCancelar} disabled={pagando} autoFocus>
          Cancelar
        </Boton>
        <Boton
          variante="principal"
          onClick={onConfirmar}
          cargando={pagando}
          textoCargando="Registrando..."
        >
          {error ? "Reintentar pago" : "Confirmar pago"}
        </Boton>
      </div>
    </dialog>
  );
}
