import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import {
  obtenerPensiones,
  pagarPension,
  actualizarMoraPension,
} from "../pensiones.service";
import { obtenerMatriculas } from "../../matriculas/matriculas.service";
import type { Pension } from "../pensiones.types";
import type { Matricula } from "../../matriculas/matriculas.types";
import { Boton } from "../../../shared/components/Boton";
import { CampoEntrada } from "../../../shared/components/CampoEntrada";
import { BadgeEstado } from "../../../shared/components/BadgeEstado";
import { Paginacion } from "../../../shared/components/Paginacion";
import { TablaSkeleton } from "../../../shared/components/TablaSkeleton";
import { moneda, normalizar } from "../../../shared/utils/formato";
import "../../../styles/listados.css";
import "./PensionesPage.css";

interface PensionesPageProps {
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
  PENDIENTE: "Pendiente",
  PAGADO: "Pagada",
  EN_MORA: "En mora",
};

export function PensionesPage({ token }: PensionesPageProps) {
  const [pensiones, setPensiones] = useState<Pension[]>([]);
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0);

  const [busqueda, setBusqueda] = useState("");
  const [anio, setAnio] = useState(String(new Date().getFullYear()));
  const [mes, setMes] = useState(String(new Date().getMonth() + 1));
  const [estado, setEstado] = useState("");
  const [pagina, setPagina] = useState(1);

  const [pensionSeleccionada, setPensionSeleccionada] =
    useState<Pension | null>(null);
  const [pagando, setPagando] = useState(false);
  const [mensajePago, setMensajePago] = useState("");
  const [errorPago, setErrorPago] = useState("");

  const [pensionMora, setPensionMora] = useState<Pension | null>(null);
  const [guardandoMora, setGuardandoMora] = useState(false);
  const [errorMora, setErrorMora] = useState("");

  const pagandoRef = useRef(false);
  const guardandoMoraRef = useRef(false);

  useEffect(() => {
    let activo = true;

    Promise.all([obtenerPensiones(token), obtenerMatriculas(token)])
      .then(([datosPensiones, datosMatriculas]) => {
        if (!activo) return;

        setPensiones(datosPensiones);
        setMatriculas(datosMatriculas);
        setError("");
      })
      .catch((fallo: unknown) => {
        if (!activo) return;

        setError(
          fallo instanceof Error
            ? fallo.message
            : "No se pudieron cargar las pensiones.",
        );
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [token, intento]);

  const matriculasPorId = new Map(
    matriculas.map((matricula) => [matricula.id, matricula]),
  );

  const anios = Array.from(
    new Set([
      new Date().getFullYear(),
      ...matriculas.map((matricula) => matricula.anioLectivo),
    ]),
  ).sort((a, b) => b - a);

  const termino = normalizar(busqueda);

  const filtradas = pensiones
    .filter((pension) => {
      const matricula = matriculasPorId.get(pension.matriculaId);

      return (
        matricula !== undefined &&
        matricula.anioLectivo === Number(anio) &&
        normalizar(matricula.nombreEstudiante).includes(termino) &&
        (mes === "" || pension.mes === Number(mes)) &&
        (estado === "" || pension.estado === estado)
      );
    })
    .sort((a, b) => {
      const nombreA =
        matriculasPorId.get(a.matriculaId)?.nombreEstudiante ?? "";
      const nombreB =
        matriculasPorId.get(b.matriculaId)?.nombreEstudiante ?? "";

      return (
        nombreA.localeCompare(nombreB, "es") ||
        a.mes - b.mes ||
        a.id.localeCompare(b.id)
      );
    });

  const paginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, paginas);
  const visibles = filtradas.slice(
    (paginaActual - 1) * POR_PAGINA,
    paginaActual * POR_PAGINA,
  );

  function cerrarPago() {
    if (pagandoRef.current) return;

    setPensionSeleccionada(null);
    setErrorPago("");
  }

  async function registrarPago() {
    const seleccionada = pensionSeleccionada;

    if (
      !seleccionada ||
      seleccionada.estado === "PAGADO" ||
      seleccionada.montoTotal == null ||
      pagandoRef.current
    ) {
      return;
    }

    pagandoRef.current = true;
    setPagando(true);
    setErrorPago("");

    try {
      const actualizada = await pagarPension(token, seleccionada.id);

      setPensiones((actuales) =>
        actuales.map((item) =>
          item.id === actualizada.id ? actualizada : item,
        ),
      );

      const nombre = matriculasPorId.get(
        seleccionada.matriculaId,
      )?.nombreEstudiante;

      setPensionSeleccionada(null);
      const mensajeExito = `Pago de ${meses[seleccionada.mes - 1]} registrado para ${
        nombre ?? "el estudiante"
      }.`;
      setMensajePago(mensajeExito);
      toast.success(mensajeExito);
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

  function cerrarMora() {
    if (guardandoMoraRef.current) return;
    setPensionMora(null);
    setErrorMora("");
  }

  async function guardarMora(nuevaMora: number) {
    const seleccionada = pensionMora;

    if (
      !seleccionada ||
      seleccionada.estado === "PAGADO" ||
      guardandoMoraRef.current
    ) {
      return;
    }

    guardandoMoraRef.current = true;
    setGuardandoMora(true);
    setErrorMora("");

    try {
      const actualizada = await actualizarMoraPension(
        token,
        seleccionada.id,
        nuevaMora,
      );

      setPensiones((actuales) =>
        actuales.map((item) =>
          item.id === actualizada.id ? actualizada : item,
        ),
      );

      const nombre = matriculasPorId.get(
        seleccionada.matriculaId,
      )?.nombreEstudiante;

      setPensionMora(null);
      const mensajeExito = `Mora de ${meses[seleccionada.mes - 1]} actualizada para ${
        nombre ?? "el estudiante"
      }.`;
      setMensajePago(mensajeExito);
      toast.success(mensajeExito);
    } catch (fallo: unknown) {
      setErrorMora(
        fallo instanceof Error
          ? fallo.message
          : "No se pudo actualizar la mora. Inténtalo nuevamente.",
      );
    } finally {
      guardandoMoraRef.current = false;
      setGuardandoMora(false);
    }
  }

  return (
    <section className="pensiones">
      <header className="pensiones__encabezado">
        <h1>Pensiones</h1>
        <p>Consulta las pensiones y registra los pagos recibidos.</p>
      </header>

      <div className="pensiones__filtros">
        <div className="campo">
          <label className="campo__etiqueta" htmlFor="pensiones-anio">
            Año lectivo
          </label>
          <select
            id="pensiones-anio"
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
          <label className="campo__etiqueta" htmlFor="pensiones-mes">
            Mes
          </label>
          <select
            id="pensiones-mes"
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
          id="pensiones-busqueda"
          etiqueta="Buscar estudiante"
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
          <label className="campo__etiqueta" htmlFor="pensiones-estado">
            Estado
          </label>
          <select
            id="pensiones-estado"
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
        <p className="pensiones__exito" role="status">
          {mensajePago}
        </p>
      )}

      {cargando && (
        <TablaSkeleton columnas={6} etiqueta="Cargando pensiones..." />
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

      {!cargando && !error && filtradas.length === 0 && (
        <div className="estado-listado">
          <h2>No hay pensiones para estos filtros</h2>
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

      {!cargando && !error && filtradas.length > 0 && (
        <>
          <div
            className="tabla-listado"
            role="region"
            aria-label="Listado de pensiones"
            tabIndex={0}
          >
            <table>
              <caption className="solo-lectores">
                Pensiones del año {anio}
              </caption>

              <thead>
                <tr>
                  <th scope="col">Estudiante</th>
                  <th scope="col">Mes</th>
                  <th scope="col">Monto base</th>
                  <th scope="col">Mora</th>
                  <th scope="col">Total</th>
                  <th scope="col">Vencimiento</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {visibles.map((pension) => {
                  const nombre =
                    matriculasPorId.get(pension.matriculaId)
                      ?.nombreEstudiante ?? "Estudiante";

                  return (
                    <tr key={pension.id}>
                      <td data-label="Estudiante">{nombre}</td>
                      <td data-label="Mes">{meses[pension.mes - 1]}</td>
                      <td data-label="Monto base">
                        {moneda.format(pension.montoBase)}
                      </td>
                      <td data-label="Mora">
                        {moneda.format(pension.moraAcumulada)}
                      </td>
                      <td data-label="Total">
                        {pension.montoTotal == null
                          ? "No disponible"
                          : moneda.format(pension.montoTotal)}
                      </td>
                      <td data-label="Vencimiento">
                        {pension.fechaVencimiento
                          .split("-")
                          .reverse()
                          .join("/")}
                      </td>
                      <td data-label="Estado">
                        <BadgeEstado
                          variante={
                            pension.estado === "PAGADO"
                              ? "exito"
                              : pension.estado === "EN_MORA"
                                ? "error"
                                : "pendiente"
                          }
                        >
                          {estados[pension.estado]}
                        </BadgeEstado>
                      </td>
                      <td data-label="Acciones">
                        {pension.estado === "PAGADO" ? (
                          <span>Pago registrado</span>
                        ) : (
                          <div className="pensiones__acciones-fila">
                            {pension.montoTotal == null ? (
                              <span>
                                Total no disponible para registrar el pago
                              </span>
                            ) : (
                              <Boton
                                onClick={() => {
                                  setMensajePago("");
                                  setErrorPago("");
                                  setPensionSeleccionada(pension);
                                }}
                                aria-label={`Registrar pago de ${
                                  meses[pension.mes - 1]
                                } de ${nombre}`}
                              >
                                Registrar pago
                              </Boton>
                            )}

                            <Boton
                              onClick={() => {
                                setMensajePago("");
                                setErrorMora("");
                                setPensionMora(pension);
                              }}
                              aria-label={`Ajustar mora de ${
                                meses[pension.mes - 1]
                              } de ${nombre}`}
                            >
                              Ajustar mora
                            </Boton>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Paginacion
            pagina={paginaActual}
            total={filtradas.length}
            porPagina={POR_PAGINA}
            onCambiar={setPagina}
          />
        </>
      )}

      {pensionSeleccionada && (
        <ConfirmarPagoPensionModal
          pension={pensionSeleccionada}
          nombreEstudiante={
            matriculasPorId.get(pensionSeleccionada.matriculaId)
              ?.nombreEstudiante ?? "Estudiante"
          }
          pagando={pagando}
          error={errorPago}
          onCancelar={cerrarPago}
          onConfirmar={() => void registrarPago()}
        />
      )}

      {pensionMora && (
        <AjustarMoraPensionModal
          pension={pensionMora}
          nombreEstudiante={
            matriculasPorId.get(pensionMora.matriculaId)?.nombreEstudiante ??
            "Estudiante"
          }
          guardando={guardandoMora}
          error={errorMora}
          onCancelar={cerrarMora}
          onGuardar={(nuevaMora) => void guardarMora(nuevaMora)}
        />
      )}
    </section>
  );
}

interface ConfirmarPagoPensionModalProps {
  pension: Pension;
  nombreEstudiante: string;
  pagando: boolean;
  error: string;
  onCancelar: () => void;
  onConfirmar: () => void;
}

function ConfirmarPagoPensionModal({
  pension,
  nombreEstudiante,
  pagando,
  error,
  onCancelar,
  onConfirmar,
}: ConfirmarPagoPensionModalProps) {
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
        document.getElementById("pensiones-busqueda")?.focus();
      }
    };
  }, []);

  const detalles = [
    ["Estudiante", nombreEstudiante],
    [
      "Periodo",
      `${meses[pension.mes - 1]} de ${pension.fechaVencimiento.slice(0, 4)}`,
    ],
    ["Monto base", moneda.format(pension.montoBase)],
    ["Mora acumulada", moneda.format(pension.moraAcumulada)],
    [
      "Total recibido",
      pension.montoTotal == null
        ? "No disponible"
        : moneda.format(pension.montoTotal),
    ],
  ];

  return (
    <dialog
      ref={dialogRef}
      className="pensiones__modal"
      aria-labelledby={tituloId}
      aria-describedby={descripcionId}
      aria-busy={pagando}
      onCancel={(evento) => {
        evento.preventDefault();
        onCancelar();
      }}
    >
      <h2 id={tituloId}>Confirmar pago de pensión</h2>

      <p id={descripcionId}>
        Confirma únicamente cuando el colegio haya recibido el importe total.
      </p>

      <dl className="pensiones__modal-detalle">
        {detalles.map(([etiqueta, valor]) => (
          <div key={etiqueta}>
            <dt>{etiqueta}</dt>
            <dd>{valor}</dd>
          </div>
        ))}
      </dl>

      {error && (
        <p className="pensiones__error" role="alert">
          {error}
        </p>
      )}

      <div className="pensiones__modal-acciones">
        <Boton onClick={onCancelar} disabled={pagando} autoFocus>
          Cancelar
        </Boton>

        <Boton
          variante="principal"
          onClick={onConfirmar}
          cargando={pagando}
          textoCargando="Registrando..."
          disabled={pension.montoTotal == null}
        >
          {error ? "Reintentar pago" : "Confirmar pago"}
        </Boton>
      </div>
    </dialog>
  );
}

interface AjustarMoraPensionModalProps {
  pension: Pension;
  nombreEstudiante: string;
  guardando: boolean;
  error: string;
  onCancelar: () => void;
  onGuardar: (nuevaMora: number) => void;
}

function AjustarMoraPensionModal({
  pension,
  nombreEstudiante,
  guardando,
  error,
  onCancelar,
  onGuardar,
}: AjustarMoraPensionModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const tituloId = useId();
  const descripcionId = useId();
  const [moraTexto, setMoraTexto] = useState(
    String(pension.moraAcumulada ?? 0),
  );
  const [errorValidacion, setErrorValidacion] = useState("");

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
        document.getElementById("pensiones-busqueda")?.focus();
      }
    };
  }, []);

  const valorNumerico = Number(moraTexto);
  const esNumeroValido =
    moraTexto.trim() !== "" &&
    Number.isFinite(valorNumerico) &&
    valorNumerico >= 0 &&
    /^\d+(\.\d{1,2})?$/.test(moraTexto.trim());

  const totalCalculado = esNumeroValido
    ? pension.montoBase + valorNumerico
    : pension.montoTotal;

  function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (!esNumeroValido) {
      setErrorValidacion(
        "Ingresa un monto válido mayor o igual a 0.00 con hasta dos decimales.",
      );
      return;
    }

    setErrorValidacion("");
    onGuardar(Number(valorNumerico.toFixed(2)));
  }

  return (
    <dialog
      ref={dialogRef}
      className="pensiones__modal"
      aria-labelledby={tituloId}
      aria-describedby={descripcionId}
      aria-busy={guardando}
      onCancel={(evento) => {
        evento.preventDefault();
        onCancelar();
      }}
    >
      <h2 id={tituloId}>Ajustar mora de pensión</h2>

      <p id={descripcionId}>
        {nombreEstudiante} — {meses[pension.mes - 1]} de{" "}
        {pension.fechaVencimiento.slice(0, 4)}.
      </p>

      <form onSubmit={manejarEnvio} noValidate>
        <div className="pensiones__modal-campo">
          <CampoEntrada
            id="pension-mora-input"
            etiqueta="Mora acumulada (S/)"
            type="number"
            min="0"
            step="0.01"
            value={moraTexto}
            onChange={(evento) => {
              setMoraTexto(evento.target.value);
              if (errorValidacion) setErrorValidacion("");
            }}
            error={errorValidacion}
            disabled={guardando}
            autoFocus
          />
        </div>

        <dl className="pensiones__modal-detalle">
          <div>
            <dt>Monto base</dt>
            <dd>{moneda.format(pension.montoBase)}</dd>
          </div>
          <div>
            <dt>Nuevo total a cobrar</dt>
            <dd>
              {totalCalculado == null
                ? "No disponible"
                : moneda.format(totalCalculado)}
            </dd>
          </div>
        </dl>

        {error && (
          <p className="pensiones__error" role="alert">
            {error}
          </p>
        )}

        <div className="pensiones__modal-acciones">
          <Boton onClick={onCancelar} disabled={guardando}>
            Cancelar
          </Boton>

          <Boton
            type="submit"
            variante="principal"
            cargando={guardando}
            textoCargando="Guardando..."
          >
            Guardar mora
          </Boton>
        </div>
      </form>
    </dialog>
  );
}
